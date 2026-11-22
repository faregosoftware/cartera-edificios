import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDeAtraso, estadoCuota, montoEnLetras, nombrePeriodo, numeroALetras, periodosAdeudados, tramoAtraso } from "../src/lib/cobros.ts";

const hoy = "2026-11-19";

const fmt = (p: { periodo: string; desde: string; hasta: string; vencimiento: string }[]) => p.map((x) => `${x.desde}..${x.hasta} vence ${x.vencimiento}`);

test("contrato desde el día 1 con día de pago 5", () => {
  const p = periodosAdeudados({ inicio: "2026-08-01", fin: "2027-07-31", finalizado: false, fechaSalida: null, diaPago: 5 }, hoy);
  assert.deepEqual(fmt(p), [
    "2026-08-01..2026-08-31 vence 2026-08-05",
    "2026-09-01..2026-09-30 vence 2026-09-05",
    "2026-10-01..2026-10-31 vence 2026-10-05",
    "2026-11-01..2026-11-30 vence 2026-11-05",
  ]);
  assert.deepEqual(p.map((x) => x.periodo), ["2026-08", "2026-09", "2026-10", "2026-11"]);
});

test("contrato a mitad de mes: el período va de día 10 a día 9 y vence el siguiente día 5", () => {
  const p = periodosAdeudados({ inicio: "2025-11-10", fin: "2026-11-09", finalizado: false, fechaSalida: null, diaPago: 5 }, "2026-01-20");
  assert.deepEqual(fmt(p), [
    "2025-11-10..2025-12-09 vence 2025-12-05",
    "2025-12-10..2026-01-09 vence 2026-01-05",
    "2026-01-10..2026-02-09 vence 2026-02-05",
  ]);
});

test("renovación a mitad de mes no cobra dos veces", () => {
  const anterior = periodosAdeudados({ inicio: "2025-11-10", fin: "2026-11-09", finalizado: true, fechaSalida: "2026-11-09", diaPago: 1 }, hoy);
  const nuevo = periodosAdeudados({ inicio: "2026-11-10", fin: "2027-11-09", finalizado: false, fechaSalida: null, diaPago: 1 }, hoy);
  assert.equal(anterior.length, 12);
  assert.equal(anterior.at(-1)!.hasta, "2026-11-09");
  assert.equal(nuevo.length, 1);
  assert.equal(nuevo[0].desde, "2026-11-10");
  assert.equal(nuevo[0].vencimiento, "2026-12-01");
});

test("fin de mes y día de pago 31", () => {
  const p = periodosAdeudados({ inicio: "2026-01-31", fin: "2027-01-30", finalizado: false, fechaSalida: null, diaPago: 31 }, "2026-04-02");
  assert.deepEqual(fmt(p), [
    "2026-01-31..2026-02-27 vence 2026-01-31",
    "2026-02-28..2026-03-30 vence 2026-02-28",
    "2026-03-31..2026-04-29 vence 2026-03-31",
  ]);
});

test("sin día de pago vence al empezar el período; contrato futuro no genera nada", () => {
  const p = periodosAdeudados({ inicio: "2026-10-15", fin: "2027-10-14", finalizado: false, fechaSalida: null, diaPago: null }, hoy);
  assert.deepEqual(p.map((x) => x.vencimiento), ["2026-10-15", "2026-11-15"]);
  assert.deepEqual(periodosAdeudados({ inicio: "2026-12-01", fin: "2027-11-30", finalizado: false, fechaSalida: null, diaPago: 5 }, hoy), []);
});

test("finalizado: hasta la fecha de salida; vencido sin finalizar: sigue cobrando", () => {
  const fin = periodosAdeudados({ inicio: "2026-01-01", fin: "2026-12-31", finalizado: true, fechaSalida: "2026-03-10", diaPago: 5 }, hoy);
  assert.deepEqual(fin.map((x) => x.periodo), ["2026-01", "2026-02", "2026-03"]);
  const venc = periodosAdeudados({ inicio: "2026-08-10", fin: "2026-10-09", finalizado: false, fechaSalida: null, diaPago: 10 }, hoy);
  assert.deepEqual(venc.map((x) => x.periodo), ["2026-08", "2026-09", "2026-10", "2026-11"]);
});

test("estado de una cuota y atraso", () => {
  assert.equal(estadoCuota({ vencimiento: "2026-11-05", monto: 3200, pagado: 3200 }, hoy), "Pagada");
  assert.equal(estadoCuota({ vencimiento: "2026-11-05", monto: 3200, pagado: 1000 }, hoy), "Vencida");
  assert.equal(estadoCuota({ vencimiento: hoy, monto: 3200, pagado: 0 }, hoy), "Vence hoy");
  assert.equal(estadoCuota({ vencimiento: "2026-11-25", monto: 3200, pagado: 0 }, hoy), "Por vencer");
  assert.equal(estadoCuota({ vencimiento: "2026-11-25", monto: 3200, pagado: 500 }, hoy), "Pago parcial");
  assert.equal(estadoCuota({ vencimiento: "2026-11-05", monto: 0.1 + 0.2, pagado: 0.3 }, hoy), "Pagada", "sin errores de redondeo");
  assert.equal(diasDeAtraso("2026-11-05", hoy), 14);
  assert.equal(diasDeAtraso("2026-11-25", hoy), 0);
  assert.equal(tramoAtraso(14), "1–30 días");
  assert.equal(tramoAtraso(61), "61–90 días");
  assert.equal(tramoAtraso(200), "Más de 90 días");
  assert.equal(tramoAtraso(0), null);
});

test("monto en letras", () => {
  assert.equal(numeroALetras(0), "cero");
  assert.equal(numeroALetras(100), "cien");
  assert.equal(numeroALetras(101), "ciento uno");
  assert.equal(numeroALetras(21), "veintiuno");
  assert.equal(numeroALetras(350), "trescientos cincuenta");
  assert.equal(numeroALetras(1000), "mil");
  assert.equal(numeroALetras(3200), "tres mil doscientos");
  assert.equal(numeroALetras(21000), "veintiún mil");
  assert.equal(numeroALetras(31500), "treinta y un mil quinientos");
  assert.equal(numeroALetras(100000), "cien mil");
  assert.equal(numeroALetras(1_250_000), "un millón doscientos cincuenta mil");
  assert.equal(numeroALetras(2_001_001), "dos millones mil uno");
  assert.equal(montoEnLetras(35000, "DOP"), "Treinta y cinco mil 00/100 Pesos Dominicanos");
  assert.equal(montoEnLetras(650.5, "USD"), "Seiscientos cincuenta 50/100 Dólares Estadounidenses");
  assert.equal(montoEnLetras(5500.99, "DOP"), "Cinco mil quinientos 99/100 Pesos Dominicanos");
  assert.equal(nombrePeriodo("2026-11"), "Noviembre 2026");
});
