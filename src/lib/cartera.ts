// Lecturas de la cartera ya convertidas a objetos simples, con el estado de cada contrato calculado.
import { prisma } from "./db";
import { fechaISO, num } from "./convertir";
import { estadoContrato, hoyEn, ocupa, type EstadoContrato } from "./negocio";

export function hoyApp(): string {
  return hoyEn(process.env.APP_TZ || "America/Santo_Domingo");
}

export type ContratoVista = {
  id: string;
  unidadId: string;
  inquilinoId: string;
  inicio: string;
  fin: string;
  renta: number;
  moneda: "DOP" | "USD";
  garantia: number | null;
  diaPago: number | null;
  finalizado: boolean;
  fechaSalida: string | null;
  notas: string | null;
  estado: EstadoContrato;
};

export type UnidadVista = {
  id: string;
  edificioId: string;
  edificio: string;
  codigo: string;
  tipo: string;
  piso: string | null;
  superficie: number | null;
  dormitorios: number | null;
  rentaReferencia: number | null;
  monedaReferencia: "DOP" | "USD";
  notas: string | null;
  actual: ContratoVista | null;
  inquilinoActual: string | null;
};

export async function cargarCartera() {
  const hoy = hoyApp();
  const [edificios, unidadesDb, inquilinos, contratosDb] = await Promise.all([
    prisma.edificio.findMany({ orderBy: { nombre: "asc" } }),
    prisma.unidad.findMany(),
    prisma.inquilino.findMany({ orderBy: { nombre: "asc" } }),
    prisma.contrato.findMany(),
  ]);
  const contratos: ContratoVista[] = contratosDb.map((c) => {
    const base = { inicio: fechaISO(c.inicio)!, fin: fechaISO(c.fin)!, finalizado: c.finalizado };
    return {
      id: c.id,
      unidadId: c.unidadId,
      inquilinoId: c.inquilinoId,
      ...base,
      renta: num(c.renta)!,
      moneda: c.moneda,
      garantia: num(c.garantia),
      diaPago: c.diaPago,
      fechaSalida: fechaISO(c.fechaSalida),
      notas: c.notas,
      estado: estadoContrato(base, hoy),
    };
  });
  const nombreEdificio = new Map(edificios.map((e) => [e.id, e.nombre]));
  const nombreInquilino = new Map(inquilinos.map((i) => [i.id, i.nombre]));
  const unidades: UnidadVista[] = unidadesDb
    .map((u) => {
      const actual = contratos.find((c) => c.unidadId === u.id && ocupa(c, hoy)) ?? null;
      return {
        id: u.id,
        edificioId: u.edificioId,
        edificio: nombreEdificio.get(u.edificioId) ?? "—",
        codigo: u.codigo,
        tipo: u.tipo,
        piso: u.piso,
        superficie: num(u.superficie),
        dormitorios: u.dormitorios,
        rentaReferencia: num(u.rentaReferencia),
        monedaReferencia: u.monedaReferencia,
        notas: u.notas,
        actual,
        inquilinoActual: actual ? (nombreInquilino.get(actual.inquilinoId) ?? null) : null,
      };
    })
    .sort((a, b) => `${a.edificio} ${a.codigo}`.localeCompare(`${b.edificio} ${b.codigo}`, "es", { numeric: true }));

  function resumenEdificio(edificioId: string) {
    const us = unidades.filter((u) => u.edificioId === edificioId);
    let ocupadas = 0,
      dop = 0,
      usd = 0;
    for (const u of us) {
      if (!u.actual) continue;
      ocupadas++;
      if (u.actual.moneda === "USD") usd += u.actual.renta;
      else dop += u.actual.renta;
    }
    return { total: us.length, ocupadas, libres: us.length - ocupadas, pct: us.length ? Math.round((ocupadas * 100) / us.length) : 0, dop, usd };
  }

  const nombreUnidad = (id: string) => {
    const u = unidades.find((x) => x.id === id);
    return u ? `${u.edificio} · ${u.codigo}` : "(unidad eliminada)";
  };

  return { hoy, edificios, unidades, inquilinos, contratos, resumenEdificio, nombreUnidad, nombreInquilino: (id: string) => nombreInquilino.get(id) ?? "(inquilino eliminado)" };
}
