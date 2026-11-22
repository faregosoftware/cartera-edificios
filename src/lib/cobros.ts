// Reglas de cobro puras (sin base de datos): cuotas mensuales, saldos, atrasos y monto en letras.
import { diasEntre } from "./negocio.ts";

export const METODOS_PAGO = ["Efectivo", "Transferencia", "QR", "Depósito", "Cheque"] as const;

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function nombrePeriodo(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function ultimoDiaDelMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const dos = (n: number) => String(n).padStart(2, "0");

export type ContratoParaCuotas = {
  inicio: string;
  fin: string;
  finalizado: boolean;
  fechaSalida: string | null;
  diaPago: number | null;
};

export type Periodo = { periodo: string; desde: string; hasta: string; vencimiento: string };

/** Mismo día de `inicio`, `n` meses después (si el mes es más corto, su último día). */
function mesesDespues(inicio: string, n: number): string {
  const [y, m, d] = inicio.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const yy = t.getUTCFullYear(),
    mm = t.getUTCMonth() + 1;
  return `${yy}-${dos(mm)}-${dos(Math.min(d, ultimoDiaDelMes(yy, mm)))}`;
}

function diaAnterior(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/** Primera fecha en o después de `desde` cuyo día del mes es `dia` (o el último día si el mes es más corto). */
function proximoDiaDePago(desde: string, dia: number): string {
  const [y, m, d] = desde.split("-").map(Number);
  const esteMes = `${y}-${dos(m)}-${dos(Math.min(dia, ultimoDiaDelMes(y, m)))}`;
  if (Math.min(dia, ultimoDiaDelMes(y, m)) >= d) return esteMes;
  const sig = m === 12 ? [y + 1, 1] : [y, m + 1];
  return `${sig[0]}-${dos(sig[1])}-${dos(Math.min(dia, ultimoDiaDelMes(sig[0], sig[1])))}`;
}

/**
 * Períodos que se deben cobrar de un contrato hasta `hoy`.
 * - Cada período dura un mes y empieza el mismo día que el contrato (del 10/11 al 09/12, del 10/12 al 09/01...).
 *   Así un contrato renovado a mitad de mes nunca cobra dos veces el mismo tramo.
 * - Vence el primer día de pago del contrato dentro del período (sin día de pago: al empezar el período).
 * - Se cobran los períodos que ya empezaron, sin pasar del fin del contrato. Si el contrato venció
 *   y no se finalizó, el inquilino sigue en la unidad y se siguen generando hasta que se finalice.
 * - `periodo` ("AAAA-MM") es el mes en que empieza: identifica la cuota.
 */
export function periodosAdeudados(c: ContratoParaCuotas, hoy: string): Periodo[] {
  const limite = c.finalizado ? (c.fechaSalida && c.fechaSalida < c.fin ? c.fechaSalida : c.fin) : hoy;
  const salida: Periodo[] = [];
  for (let k = 0; k < 1200; k++) {
    const desde = mesesDespues(c.inicio, k);
    if (desde > limite) break;
    if (c.finalizado && desde > c.fin) break;
    const hasta = diaAnterior(mesesDespues(c.inicio, k + 1));
    salida.push({
      periodo: desde.slice(0, 7),
      desde,
      hasta,
      vencimiento: c.diaPago ? proximoDiaDePago(desde, c.diaPago) : desde,
    });
  }
  return salida;
}

export type EstadoCuota = "Pagada" | "Vencida" | "Vence hoy" | "Por vencer" | "Pago parcial";

export function estadoCuota(c: { vencimiento: string; monto: number; pagado: number }, hoy: string): EstadoCuota {
  const saldo = redondear(c.monto - c.pagado);
  if (saldo <= 0) return "Pagada";
  if (c.vencimiento < hoy) return "Vencida";
  if (c.vencimiento === hoy) return "Vence hoy";
  return c.pagado > 0 ? "Pago parcial" : "Por vencer";
}

export function diasDeAtraso(vencimiento: string, hoy: string): number {
  return Math.max(0, diasEntre(vencimiento, hoy));
}

export function tramoAtraso(dias: number): "1–30 días" | "31–60 días" | "61–90 días" | "Más de 90 días" | null {
  if (dias <= 0) return null;
  if (dias <= 30) return "1–30 días";
  if (dias <= 60) return "31–60 días";
  if (dias <= 90) return "61–90 días";
  return "Más de 90 días";
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------- Monto en letras (para el recibo) ----------

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function menorQueMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  let txt = CENTENAS[c];
  if (r) {
    let dec: string;
    if (r < 30) dec = UNIDADES[r];
    else {
      const d = Math.floor(r / 10),
        u = r % 10;
      dec = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : "");
    }
    txt = txt ? `${txt} ${dec}` : dec;
  }
  return txt;
}

/** Número entero en palabras, en español ("tres mil doscientos"). */
export function numeroALetras(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? "un millón" : `${apocopar(numeroALetras(millones))} millones`);
  if (miles) partes.push(miles === 1 ? "mil" : `${apocopar(menorQueMil(miles))} mil`);
  if (resto) partes.push(menorQueMil(resto));
  return partes.join(" ");
}

// "veintiuno mil" → "veintiún mil", "treinta y uno mil" → "treinta y un mil"
function apocopar(s: string): string {
  return s.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

/** "Tres mil doscientos 50/100 Pesos Dominicanos" */
export function montoEnLetras(monto: number, moneda: "DOP" | "USD"): string {
  const enteros = Math.floor(redondear(monto));
  const centavos = Math.round((redondear(monto) - enteros) * 100);
  const letras = numeroALetras(enteros);
  const moned = moneda === "USD" ? "Dólares Estadounidenses" : "Pesos Dominicanos";
  return `${letras.charAt(0).toUpperCase()}${letras.slice(1)} ${dos(centavos)}/100 ${moned}`;
}
