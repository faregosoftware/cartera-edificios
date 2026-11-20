// Reglas de negocio puras (sin base de datos): fechas, estados de contrato, ocupación.
// Las fechas se manejan como texto "AAAA-MM-DD" para evitar errores de zona horaria.

export const DIAS_AVISO = 60;

export type EstadoContrato = "Vigente" | "Por vencer" | "Vencido" | "Finalizado" | "Futuro";
export const ESTADOS_QUE_OCUPAN: ReadonlySet<EstadoContrato> = new Set(["Vigente", "Por vencer", "Vencido"]);

export type ContratoBasico = {
  id?: string;
  unidadId: string;
  inicio: string;
  fin: string;
  finalizado: boolean;
};

/** Fecha de hoy en la zona horaria indicada, como "AAAA-MM-DD". */
export function hoyEn(tz: string, ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  return partes; // en-CA ya da AAAA-MM-DD
}

function aUTC(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
function deUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function esFechaValida(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return deUTC(aUTC(s)) === s;
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

export function sumarDias(s: string, n: number): string {
  return deUTC(aUTC(s) + n * 86_400_000);
}

/** Fin por defecto de un contrato: mismo día N meses después, menos un día. */
export function finPorDefecto(inicio: string, meses = 12): string {
  const [y, m, d] = inicio.split("-").map(Number);
  const objetivo = new Date(Date.UTC(y, m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(objetivo.getUTCFullYear(), objetivo.getUTCMonth() + 1, 0)).getUTCDate();
  objetivo.setUTCDate(Math.min(d, ultimoDia));
  return sumarDias(deUTC(objetivo.getTime()), -1);
}

export function estadoContrato(c: Pick<ContratoBasico, "inicio" | "fin" | "finalizado">, hoy: string): EstadoContrato {
  if (c.finalizado) return "Finalizado";
  if (c.inicio > hoy) return "Futuro";
  if (c.fin < hoy) return "Vencido";
  if (diasEntre(hoy, c.fin) <= DIAS_AVISO) return "Por vencer";
  return "Vigente";
}

export function ocupa(c: Pick<ContratoBasico, "inicio" | "fin" | "finalizado">, hoy: string): boolean {
  return ESTADOS_QUE_OCUPAN.has(estadoContrato(c, hoy));
}

/** ¿El contrato `nuevo` se cruza en fechas con otro contrato no finalizado de la misma unidad? */
export function haySolape(nuevo: ContratoBasico, existentes: readonly ContratoBasico[]): boolean {
  return existentes.some(
    (o) =>
      o.id !== nuevo.id &&
      !o.finalizado &&
      o.unidadId === nuevo.unidadId &&
      o.inicio <= nuevo.fin &&
      nuevo.inicio <= o.fin,
  );
}

export function formatoFecha(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function formatoDinero(n: number | null | undefined, moneda: "BOB" | "USD" | string): string {
  const v = Number(n) || 0;
  return (moneda === "USD" ? "US$ " : "Bs ") + v.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
