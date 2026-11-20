"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermiso } from "@/lib/auth";
import { hoyApp } from "@/lib/cartera";
import { deFechaISO } from "@/lib/convertir";
import { METODOS_PAGO, redondear } from "@/lib/cobros";
import { fecha, leer, numeroRequerido, textoOpcional, textoRequerido, type Resultado } from "@/lib/formularios";

const esquemaPago = z.object({
  fecha: fecha("la fecha del pago"),
  monto: numeroRequerido("El monto"),
  metodo: z.enum(METODOS_PAGO, { errorMap: () => ({ message: "Elige la forma de pago." }) }),
  referencia: textoOpcional,
  notas: textoOpcional,
});

class ErrorCobro extends Error {}

export async function registrarPago(cuotaId: string, fd: FormData): Promise<Resultado> {
  const u = await requirePermiso("cobros.registrar");
  const r = leer(esquemaPago, fd);
  if (!r.ok) return { error: r.error };
  const d = r.datos;
  if (d.monto <= 0) return { error: "El monto debe ser mayor a cero." };
  if (d.fecha > hoyApp()) return { error: "La fecha del pago no puede ser futura." };

  let pagoId: string;
  try {
    pagoId = await prisma.$transaction(async (tx) => {
      // Bloquea la cuota mientras se calcula el saldo: dos cobros simultáneos no pueden pagar de más.
      await tx.$queryRaw`SELECT id FROM "Cuota" WHERE id = ${cuotaId} FOR UPDATE`;
      const cuota = await tx.cuota.findUnique({ where: { id: cuotaId }, include: { pagos: { where: { anulado: false }, select: { monto: true } } } });
      if (!cuota) throw new ErrorCobro("La cuota ya no existe.");
      const saldo = redondear(Number(cuota.monto) - cuota.pagos.reduce((s, p) => s + Number(p.monto), 0));
      if (saldo <= 0) throw new ErrorCobro("Esta cuota ya está pagada.");
      if (redondear(d.monto) > saldo) throw new ErrorCobro(`El monto supera el saldo pendiente de la cuota (${saldo}).`);
      const pago = await tx.pago.create({
        data: {
          cuotaId,
          fecha: deFechaISO(d.fecha),
          monto: redondear(d.monto),
          moneda: cuota.moneda,
          metodo: d.metodo,
          referencia: d.referencia,
          notas: d.notas,
          registradoPorId: u.id,
        },
      });
      return pago.id;
    });
  } catch (e) {
    if (e instanceof ErrorCobro) return { error: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(`/recibos/${pagoId}?nuevo=1`);
}

export async function anularPago(pagoId: string, fd: FormData): Promise<Resultado> {
  const u = await requirePermiso("cobros.anular");
  const r = leer(z.object({ motivo: textoRequerido("el motivo de la anulación") }), fd);
  if (!r.ok) return { error: r.error };
  const p = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!p) return { error: "El recibo no existe." };
  if (p.anulado) return { error: "Este recibo ya está anulado." };
  await prisma.pago.update({ where: { id: pagoId }, data: { anulado: true, anuladoMotivo: r.datos.motivo, anuladoEl: new Date(), anuladoPorId: u.id } });
  revalidatePath("/", "layout");
  redirect(`/recibos/${pagoId}`);
}

export async function ajustarCuota(cuotaId: string, fd: FormData): Promise<Resultado> {
  await requirePermiso("cobros.anular");
  const r = leer(z.object({ monto: numeroRequerido("El monto"), nota: textoRequerido("el motivo del ajuste") }), fd);
  if (!r.ok) return { error: r.error };
  const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId }, include: { pagos: { where: { anulado: false }, select: { monto: true } } } });
  if (!cuota) return { error: "La cuota ya no existe." };
  const pagado = redondear(cuota.pagos.reduce((s, p) => s + Number(p.monto), 0));
  if (redondear(r.datos.monto) < pagado) return { error: `El monto no puede ser menor a lo ya pagado (${pagado}).` };
  await prisma.cuota.update({ where: { id: cuotaId }, data: { monto: redondear(r.datos.monto), nota: r.datos.nota } });
  revalidatePath("/", "layout");
  redirect(`/cobros/${cuota.contratoId}`);
}
