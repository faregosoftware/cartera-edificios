"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { TIPOS_DOC } from "@/lib/catalogos";
import { leer, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquema = z.object({
  nombre: textoRequerido("el nombre del inquilino"),
  tipoDoc: z.enum(TIPOS_DOC).default("Cédula"),
  documento: textoOpcional,
  telefono: textoOpcional,
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v),
    z.string().email("El correo no es válido.").nullable().default(null),
  ),
  notas: textoOpcional,
});

export async function crearInquilino(fd: FormData): Promise<Resultado> {
  await requirePermiso("inquilinos.crear");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  await prisma.inquilino.create({ data: r.datos });
  revalidatePath("/", "layout");
  redirect("/inquilinos");
}

export async function editarInquilino(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("inquilinos.editar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  await prisma.inquilino.update({ where: { id }, data: r.datos });
  revalidatePath("/", "layout");
  redirect("/inquilinos");
}

export async function eliminarInquilino(id: string): Promise<Resultado> {
  await requirePermiso("inquilinos.eliminar");
  const n = await prisma.contrato.count({ where: { inquilinoId: id } });
  if (n) return { error: `No se puede eliminar: el inquilino tiene ${n} contrato${n === 1 ? "" : "s"} registrado${n === 1 ? "" : "s"}.` };
  await prisma.inquilino.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/inquilinos");
}
