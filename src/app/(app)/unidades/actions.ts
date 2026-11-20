"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { TIPOS_UNIDAD } from "@/lib/catalogos";
import { enteroOpcional, errorPrisma, leer, moneda, numeroOpcional, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquema = z.object({
  edificioId: textoRequerido("el edificio"),
  codigo: textoRequerido("el código de la unidad"),
  tipo: z.enum(TIPOS_UNIDAD).default("Departamento"),
  piso: textoOpcional,
  superficie: numeroOpcional("La superficie"),
  dormitorios: enteroOpcional("Dormitorios", 0, 50),
  rentaReferencia: numeroOpcional("La renta de referencia"),
  monedaReferencia: moneda,
  notas: textoOpcional,
});

const UNICO = { unico: "Ya existe una unidad con ese código en este edificio." };

export async function crearUnidad(fd: FormData): Promise<Resultado> {
  await requirePermiso("unidades.crear");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  try {
    await prisma.unidad.create({ data: r.datos });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo guardar la unidad." };
  }
  revalidatePath("/", "layout");
  redirect(`/unidades?edificio=${r.datos.edificioId}`);
}

export async function editarUnidad(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("unidades.editar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  try {
    await prisma.unidad.update({ where: { id }, data: r.datos });
  } catch (e) {
    return { error: errorPrisma(e, UNICO) ?? "No se pudo guardar la unidad." };
  }
  revalidatePath("/", "layout");
  redirect(`/unidades?edificio=${r.datos.edificioId}`);
}

export async function eliminarUnidad(id: string): Promise<Resultado> {
  await requirePermiso("unidades.eliminar");
  const n = await prisma.contrato.count({ where: { unidadId: id } });
  if (n) return { error: `No se puede eliminar: la unidad tiene ${n} contrato${n === 1 ? "" : "s"} registrado${n === 1 ? "" : "s"}.` };
  await prisma.unidad.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/unidades");
}
