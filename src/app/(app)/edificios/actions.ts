"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { leer, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquema = z.object({
  nombre: textoRequerido("el nombre del edificio"),
  direccion: textoOpcional,
  ciudad: textoOpcional,
  notas: textoOpcional,
});

export async function crearEdificio(fd: FormData): Promise<Resultado> {
  await requirePermiso("edificios.crear");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  await prisma.edificio.create({ data: r.datos });
  revalidatePath("/", "layout");
  redirect("/edificios");
}

export async function editarEdificio(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("edificios.editar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  await prisma.edificio.update({ where: { id }, data: r.datos });
  revalidatePath("/", "layout");
  redirect("/edificios");
}

export async function eliminarEdificio(id: string): Promise<Resultado> {
  await requirePermiso("edificios.eliminar");
  const n = await prisma.unidad.count({ where: { edificioId: id } });
  if (n) return { error: `No se puede eliminar: el edificio tiene ${n} unidad${n === 1 ? "" : "es"}. Elimínalas primero.` };
  await prisma.edificio.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/edificios");
}
