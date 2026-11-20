// Acceso a cuotas y pagos, ya con saldos y estados calculados.
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { deFechaISO, fechaISO, num } from "./convertir";
import { hoyApp } from "./cartera";
import { diasDeAtraso, estadoCuota, periodosAdeudados, redondear, type EstadoCuota } from "./cobros";

/**
 * Crea las cuotas que falten hasta hoy para todos los contratos. Es idempotente:
 * nunca duplica (índice único contrato+periodo) ni modifica cuotas existentes.
 */
export async function sincronizarCuotas(): Promise<void> {
  const hoy = hoyApp();
  const contratos = await prisma.contrato.findMany({
    select: { id: true, inicio: true, fin: true, finalizado: true, fechaSalida: true, diaPago: true, renta: true, moneda: true, cuotas: { select: { periodo: true } } },
  });
  const nuevas: Prisma.CuotaCreateManyInput[] = [];
  for (const c of contratos) {
    const existentes = new Set(c.cuotas.map((q) => q.periodo));
    const periodos = periodosAdeudados(
      { inicio: fechaISO(c.inicio)!, fin: fechaISO(c.fin)!, finalizado: c.finalizado, fechaSalida: fechaISO(c.fechaSalida), diaPago: c.diaPago },
      hoy,
    );
    for (const p of periodos) {
      if (existentes.has(p.periodo)) continue;
      nuevas.push({
        contratoId: c.id,
        periodo: p.periodo,
        desde: deFechaISO(p.desde),
        hasta: deFechaISO(p.hasta),
        vencimiento: deFechaISO(p.vencimiento),
        monto: c.renta,
        moneda: c.moneda,
      });
    }
  }
  if (nuevas.length) await prisma.cuota.createMany({ data: nuevas, skipDuplicates: true });
}

export type CuotaVista = {
  id: string;
  contratoId: string;
  periodo: string;
  desde: string;
  hasta: string;
  vencimiento: string;
  monto: number;
  moneda: "BOB" | "USD";
  nota: string | null;
  pagado: number;
  saldo: number;
  estado: EstadoCuota;
  diasAtraso: number;
  unidad: string;
  edificioId: string;
  inquilinoId: string;
  inquilino: string;
  telefono: string | null;
  contratoFinalizado: boolean;
};

const incluir = {
  pagos: { where: { anulado: false }, select: { monto: true } },
  contrato: {
    select: {
      finalizado: true,
      inquilino: { select: { id: true, nombre: true, telefono: true } },
      unidad: { select: { codigo: true, edificioId: true, edificio: { select: { nombre: true } } } },
    },
  },
} satisfies Prisma.CuotaInclude;

export async function cargarCuotas(where: Prisma.CuotaWhereInput = {}): Promise<CuotaVista[]> {
  const hoy = hoyApp();
  const filas = await prisma.cuota.findMany({ where, include: incluir, orderBy: [{ vencimiento: "asc" }] });
  return filas.map((q) => {
    const monto = num(q.monto)!;
    const pagado = redondear(q.pagos.reduce((s, p) => s + Number(p.monto), 0));
    const vencimiento = fechaISO(q.vencimiento)!;
    const saldo = redondear(Math.max(0, monto - pagado));
    return {
      id: q.id,
      contratoId: q.contratoId,
      periodo: q.periodo,
      desde: fechaISO(q.desde)!,
      hasta: fechaISO(q.hasta)!,
      vencimiento,
      monto,
      moneda: q.moneda,
      nota: q.nota,
      pagado,
      saldo,
      estado: estadoCuota({ vencimiento, monto, pagado }, hoy),
      diasAtraso: saldo > 0 ? diasDeAtraso(vencimiento, hoy) : 0,
      unidad: `${q.contrato.unidad.edificio.nombre} · ${q.contrato.unidad.codigo}`,
      edificioId: q.contrato.unidad.edificioId,
      inquilinoId: q.contrato.inquilino.id,
      inquilino: q.contrato.inquilino.nombre,
      telefono: q.contrato.inquilino.telefono,
      contratoFinalizado: q.contrato.finalizado,
    };
  });
}

/** Suma por moneda: { BOB, USD } */
export function totalesPorMoneda<T extends { moneda: "BOB" | "USD" }>(filas: T[], campo: (x: NoInfer<T>) => number) {
  const t = { BOB: 0, USD: 0 };
  for (const f of filas) t[f.moneda] = redondear(t[f.moneda] + campo(f));
  return t;
}
