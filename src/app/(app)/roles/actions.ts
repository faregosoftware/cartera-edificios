"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { normalizarPermisos, TODOS_LOS_PERMISOS } from "@/lib/permisos";
import { quedaOtroAdministrador } from "@/lib/seguridad";
import { errorPrisma, leer, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquema = z.object({ nombre: textoRequerido("el nombre del rol"), descripcion: textoOpcional });
const UNICO = { unico: "Ya existe un rol con ese nombre." };

function permisosDe(fd: FormData) {
  return normalizarPermisos(fd.getAll("permisos").map(String));
}

export async function crearRol(fd: FormData): Promise<Resultado> {
  await requirePermiso("roles.administrar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  const permisos = permisosDe(fd);
  if (!permisos.length) return { error: "Marca al menos un permiso." };
  try {
    await prisma.rol.create({ data: { ...r.datos, permisos } });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo crear el rol." };
  }
  revalidatePath("/roles");
  redirect("/roles");
}

export async function editarRol(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("roles.administrar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  const rol = await prisma.rol.findUnique({ where: { id } });
  if (!rol) return { error: "El rol ya no existe." };
  // El rol del sistema conserva siempre todos los permisos.
  const permisos = rol.sistema ? TODOS_LOS_PERMISOS : permisosDe(fd);
  if (!permisos.length) return { error: "Marca al menos un permiso." };
  if (!permisos.includes("usuarios.administrar") && rol.permisos.includes("usuarios.administrar")) {
    if (!(await quedaOtroAdministrador({ rolId: id }))) {
      return { error: "Si quitas «administrar usuarios» a este rol nadie podría administrar la app. Asigna antes otro administrador." };
    }
  }
  try {
    await prisma.rol.update({ where: { id }, data: { ...r.datos, permisos } });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo guardar el rol." };
  }
  revalidatePath("/", "layout");
  redirect("/roles");
}

export async function eliminarRol(id: string): Promise<Resultado> {
  await requirePermiso("roles.administrar");
  const rol = await prisma.rol.findUnique({ where: { id }, include: { _count: { select: { usuarios: true } } } });
  if (!rol) redirect("/roles");
  if (rol.sistema) return { error: "El rol Administrador no se puede eliminar." };
  if (rol._count.usuarios) return { error: `No se puede eliminar: ${rol._count.usuarios} usuario(s) tienen este rol. Cámbiales el rol primero.` };
  await prisma.rol.delete({ where: { id } });
  revalidatePath("/roles");
  redirect("/roles");
}
