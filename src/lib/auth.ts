// Autenticación y autorización del lado del servidor.
// - Contraseñas con bcrypt (costo 12).
// - Sesiones guardadas en la base: la cookie lleva un token aleatorio y la base sólo su SHA-256.
// - Bloqueo temporal tras varios intentos fallidos.
// - requirePermiso() se llama en cada página y en cada acción del servidor: ocultar un botón no basta.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { TODOS_LOS_PERMISOS, type Permiso } from "./permisos";

const COOKIE = "cartera_sesion";
const DURACION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
export const LARGO_MINIMO_PASSWORD = 10;

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

let hashFicticio: string | null = null;
function hashParaComparar(): string {
  // Se compara contra un hash ficticio cuando el usuario no existe, para que la respuesta tarde lo mismo.
  hashFicticio ??= bcrypt.hashSync(randomBytes(16).toString("hex"), 12) as string;
  return hashFicticio;
}

export function hashPassword(p: string) {
  return bcrypt.hash(p, 12);
}

export function validarPassword(p: string): string | null {
  if (p.length < LARGO_MINIMO_PASSWORD) return `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(p) || !/\d/.test(p)) return "La contraseña debe combinar letras y números.";
  return null;
}

export type UsuarioActual = {
  id: string;
  nombre: string;
  email: string;
  debeCambiarPassword: boolean;
  rol: { id: string; nombre: string };
  permisos: string[];
};

const ERROR_GENERICO = "Correo o contraseña incorrectos.";

export async function iniciarSesion(emailCrudo: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailCrudo.trim().toLowerCase();
  const u = await prisma.usuario.findUnique({ where: { email } });
  if (!u) {
    await bcrypt.compare(password, hashParaComparar());
    return { ok: false, error: ERROR_GENERICO };
  }
  const ahora = new Date();
  if (u.bloqueadoHasta && u.bloqueadoHasta > ahora) {
    const min = Math.ceil((u.bloqueadoHasta.getTime() - ahora.getTime()) / 60000);
    return { ok: false, error: `Demasiados intentos fallidos. Intenta de nuevo en ${min} minuto${min === 1 ? "" : "s"}.` };
  }
  const correcta = await bcrypt.compare(password, u.passwordHash);
  if (!correcta || !u.activo) {
    if (!correcta) {
      const intentos = u.intentosFallidos + 1;
      await prisma.usuario.update({
        where: { id: u.id },
        data:
          intentos >= MAX_INTENTOS
            ? { intentosFallidos: 0, bloqueadoHasta: new Date(ahora.getTime() + BLOQUEO_MS) }
            : { intentosFallidos: intentos },
      });
    }
    return { ok: false, error: u.activo ? ERROR_GENERICO : "Este usuario está desactivado. Habla con el administrador." };
  }

  const token = randomBytes(32).toString("base64url");
  const expira = new Date(ahora.getTime() + DURACION_MS);
  await prisma.$transaction([
    prisma.sesion.deleteMany({ where: { usuarioId: u.id, expira: { lt: ahora } } }),
    prisma.sesion.create({ data: { id: hashToken(token), usuarioId: u.id, expira } }),
    prisma.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: ahora } }),
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
  return { ok: true };
}

export async function cerrarSesion() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

/** Cierra todas las sesiones de un usuario (al desactivarlo o cambiarle la contraseña). */
export async function cerrarSesionesDe(usuarioId: string, excepto?: "actual") {
  let conservar: string | undefined;
  if (excepto === "actual") {
    const token = (await cookies()).get(COOKIE)?.value;
    if (token) conservar = hashToken(token);
  }
  await prisma.sesion.deleteMany({ where: { usuarioId, ...(conservar ? { id: { not: conservar } } : {}) } });
}

/** Usuario de la petición actual, o null. Se calcula una sola vez por petición. */
export const usuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.sesion.findUnique({
    where: { id: hashToken(token) },
    include: { usuario: { include: { rol: true } } },
  });
  if (!s || s.expira < new Date() || !s.usuario.activo) return null;
  const u = s.usuario;
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    debeCambiarPassword: u.debeCambiarPassword,
    rol: { id: u.rol.id, nombre: u.rol.nombre },
    // El rol del sistema (Administrador) recibe siempre todos los permisos, incluidos los que se agreguen en el futuro.
    permisos: u.rol.sistema ? [...TODOS_LOS_PERMISOS] : u.rol.permisos,
  };
});

/** Exige sesión iniciada. Si la contraseña es temporal, obliga a cambiarla antes de seguir. */
export async function requireUsuario(opciones?: { permitirPasswordTemporal?: boolean }): Promise<UsuarioActual> {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  if (u.debeCambiarPassword && !opciones?.permitirPasswordTemporal) redirect("/cuenta?primera=1");
  return u;
}

/** Exige un permiso concreto. Úsalo al inicio de cada página y de cada acción del servidor. */
export async function requirePermiso(p: Permiso): Promise<UsuarioActual> {
  const u = await requireUsuario();
  if (!u.permisos.includes(p)) redirect("/sin-permiso");
  return u;
}

export function puede(u: UsuarioActual, p: Permiso): boolean {
  return u.permisos.includes(p);
}
