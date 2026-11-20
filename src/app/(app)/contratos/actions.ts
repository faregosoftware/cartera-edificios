"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { deFechaISO, fechaISO } from "@/lib/convertir";
import { haySolape, sumarDias } from "@/lib/negocio";
import { enteroOpcional, errorPrisma, fecha, leer, moneda, numeroOpcional, numeroRequerido, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquema = z
  .object({
    unidadId: textoRequerido("la unidad"),
    inquilinoId: textoRequerido("el inquilino"),
    inicio: fecha("la fecha de inicio"),
    fin: fecha("la fecha de fin"),
    renta: numeroRequerido("La renta mensual"),
    moneda,
    garantia: numeroOpcional("La garantía"),
    diaPago: enteroOpcional("El día de pago", 1, 31),
    notas: textoOpcional,
  })
  .refine((c) => c.fin >= c.inicio, { message: "La fecha de fin debe ser posterior a la de inicio." });

type Datos = z.infer<typeof esquema>;

async function validarSolape(d: Datos, idPropio?: string): Promise<string | null> {
  const otros = await prisma.contrato.findMany({
    where: { unidadId: d.unidadId, finalizado: false },
    select: { id: true, unidadId: true, inicio: true, fin: true, finalizado: true },
  });
  const existentes = otros
    .filter((o) => o.id !== idPropio)
    .map((o) => ({ ...o, inicio: fechaISO(o.inicio)!, fin: fechaISO(o.fin)! }));
  return haySolape({ ...d, id: idPropio, finalizado: false }, existentes)
    ? "Esa unidad ya tiene otro contrato activo en esas fechas. Finaliza el anterior o ajusta las fechas."
    : null;
}

function aDb(d: Datos) {
  return { ...d, inicio: deFechaISO(d.inicio), fin: deFechaISO(d.fin) };
}

export async function crearContrato(fd: FormData): Promise<Resultado> {
  await requirePermiso("contratos.crear");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  const solape = await validarSolape(r.datos);
  if (solape) return { error: solape };
  try {
    await prisma.contrato.create({ data: aDb(r.datos) });
  } catch (e) {
    return { error: errorPrisma(e) ?? "No se pudo registrar el contrato." };
  }
  revalidatePath("/", "layout");
  redirect("/contratos");
}

export async function editarContrato(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("contratos.editar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  const actual = await prisma.contrato.findUnique({ where: { id }, select: { finalizado: true } });
  if (!actual) return { error: "El contrato ya no existe." };
  if (!actual.finalizado) {
    const solape = await validarSolape(r.datos, id);
    if (solape) return { error: solape };
  }
  await prisma.contrato.update({ where: { id }, data: aDb(r.datos) });
  revalidatePath("/", "layout");
  redirect("/contratos");
}

/** Crea el contrato nuevo y finaliza el anterior en una sola transacción. */
export async function renovarContrato(idAnterior: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("contratos.renovar");
  const r = leer(esquema, fd);
  if (!r.ok) return { error: r.error };
  const anterior = await prisma.contrato.findUnique({ where: { id: idAnterior } });
  if (!anterior || anterior.finalizado) return { error: "Ese contrato ya fue finalizado o no existe." };
  if (r.datos.unidadId !== anterior.unidadId) return { error: "La renovación debe ser para la misma unidad." };
  const finAnterior = fechaISO(anterior.fin)!;
  if (r.datos.inicio <= fechaISO(anterior.inicio)!) return { error: "El contrato nuevo debe empezar después del inicio del anterior." };
  const solape = await validarSolape(r.datos, idAnterior);
  if (solape) return { error: solape };
  // Si el nuevo empieza antes de que termine el anterior, el anterior se cierra el día previo.
  const salida = r.datos.inicio <= finAnterior ? sumarDias(r.datos.inicio, -1) : finAnterior;
  await prisma.$transaction([
    prisma.contrato.update({ where: { id: idAnterior }, data: { finalizado: true, fechaSalida: deFechaISO(salida) } }),
    prisma.contrato.create({ data: aDb(r.datos) }),
  ]);
  revalidatePath("/", "layout");
  redirect("/contratos");
}

export async function finalizarContrato(id: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("contratos.finalizar");
  const r = leer(z.object({ fechaSalida: fecha("la fecha de salida") }), fd);
  if (!r.ok) return { error: r.error };
  const c = await prisma.contrato.findUnique({ where: { id } });
  if (!c) return { error: "El contrato ya no existe." };
  if (r.datos.fechaSalida < fechaISO(c.inicio)!) return { error: "La fecha de salida no puede ser anterior al inicio del contrato." };
  await prisma.contrato.update({ where: { id }, data: { finalizado: true, fechaSalida: deFechaISO(r.datos.fechaSalida) } });
  revalidatePath("/", "layout");
  redirect("/contratos");
}

export async function eliminarContrato(id: string): Promise<Resultado> {
  await requirePermiso("contratos.eliminar");
  await prisma.contrato.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/contratos");
}
