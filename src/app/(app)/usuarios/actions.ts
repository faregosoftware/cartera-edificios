"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso, hashPassword, validarPassword, cerrarSesionesDe } from "@/lib/auth";
import { quedaOtroAdministrador } from "@/lib/seguridad";
import { errorPrisma, leer, textoRequerido, type Resultado } from "@/lib/formularios";

const datos = {
  nombre: textoRequerido("el nombre"),
  email: z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.string().email("Escribe un correo válido.")),
  rolId: textoRequerido("el rol"),
};
const UNICO = { unico: "Ya existe un usuario con ese correo." };

export async function crearUsuario(fd: FormData): Promise<Resultado> {
  await requirePermiso("usuarios.administrar");
  const r = leer(z.object({ ...datos, password: z.string() }), fd);
  if (!r.ok) return { error: r.error };
  const problema = validarPassword(r.datos.password);
  if (problema) return { error: problema };
  if (!(await prisma.rol.findUnique({ where: { id: r.datos.rolId } }))) return { error: "El rol elegido no existe." };
  try {
    await prisma.usuario.create({
      data: {
        nombre: r.datos.nombre,
        email: r.datos.email,
        rolId: r.datos.rolId,
        passwordHash: await hashPassword(r.datos.password),
        debeCambiarPassword: true,
      },
    });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo crear el usuario." };
  }
  revalidatePath("/usuarios");
  redirect("/usuarios?creado=1");
}

export async function editarUsuario(id: string, fd: FormData): Promise<Resultado> {
  const yo = await requirePermiso("usuarios.administrar");
  const r = leer(z.object({ ...datos, activo: z.string().optional() }), fd);
  if (!r.ok) return { error: r.error };
  const activo = r.datos.activo === "on";
  const antes = await prisma.usuario.findUnique({ where: { id } });
  if (!antes) return { error: "El usuario ya no existe." };
  const rol = await prisma.rol.findUnique({ where: { id: r.datos.rolId } });
  if (!rol) return { error: "El rol elegido no existe." };

  if (id === yo.id && !activo) return { error: "No puedes desactivar tu propio usuario." };
  const dejaDeSerAdmin = !activo || !rol.permisos.includes("usuarios.administrar");
  if (dejaDeSerAdmin && !(await quedaOtroAdministrador({ usuarioId: id }))) {
    return { error: "Debe quedar al menos un usuario activo que pueda administrar usuarios." };
  }
  try {
    await prisma.usuario.update({
      where: { id },
      data: { nombre: r.datos.nombre, email: r.datos.email, rolId: r.datos.rolId, activo },
    });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo guardar el usuario." };
  }
  if (!activo) await cerrarSesionesDe(id);
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function restablecerPassword(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("usuarios.administrar");
  const password = String(fd.get("password") ?? "");
  const problema = validarPassword(password);
  if (problema) return { error: problema };
  await prisma.usuario.update({
    where: { id },
    data: { passwordHash: await hashPassword(password), debeCambiarPassword: true, intentosFallidos: 0, bloqueadoHasta: null },
  });
  await cerrarSesionesDe(id);
  revalidatePath("/usuarios");
  redirect(`/usuarios/${id}?restablecida=1`);
}

export async function desbloquearUsuario(id: string): Promise<Resultado> {
  await requirePermiso("usuarios.administrar");
  await prisma.usuario.update({ where: { id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
  revalidatePath("/usuarios");
  redirect(`/usuarios/${id}`);
}
