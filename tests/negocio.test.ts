import { test } from "node:test";
import assert from "node:assert/strict";
import { diasEntre, esFechaValida, estadoContrato, finPorDefecto, haySolape, hoyEn, ocupa, sumarDias } from "../src/lib/negocio.ts";

const hoy = "2026-11-19";
const c = (inicio: string, fin: string, finalizado = false) => ({ inicio, fin, finalizado });

test("estado de contrato", () => {
  assert.equal(estadoContrato(c("2026-03-01", "2027-02-28"), hoy), "Vigente");
  assert.equal(estadoContrato(c("2025-01-01", "2026-12-31"), hoy), "Por vencer"); // 42 días
  assert.equal(estadoContrato(c("2025-01-01", "2027-01-18"), hoy), "Por vencer"); // justo 60
  assert.equal(estadoContrato(c("2025-01-01", "2027-01-19"), hoy), "Vigente"); // 61
  assert.equal(estadoContrato(c("2025-11-10", "2026-11-09"), hoy), "Vencido");
  assert.equal(estadoContrato(c("2026-12-01", "2027-11-30"), hoy), "Futuro");
  assert.equal(estadoContrato(c("2025-11-10", "2026-11-09", true), hoy), "Finalizado");
  assert.equal(estadoContrato(c(hoy, hoy), hoy), "Por vencer");
});

test("ocupa la unidad", () => {
  assert.equal(ocupa(c("2025-11-10", "2026-11-09"), hoy), true, "un vencido sin finalizar sigue ocupando");
  assert.equal(ocupa(c("2026-12-01", "2027-11-30"), hoy), false, "un contrato futuro todavía no ocupa");
  assert.equal(ocupa(c("2025-01-01", "2027-01-01", true), hoy), false);
});

test("fechas", () => {
  assert.equal(finPorDefecto("2026-03-01"), "2027-02-28");
  assert.equal(finPorDefecto("2026-01-31"), "2027-01-30");
  assert.equal(finPorDefecto("2024-02-29"), "2025-02-27"); // 29/02 → 28/02 del año siguiente, menos un día
  assert.equal(finPorDefecto("2026-11-20", 6), "2027-05-19");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(diasEntre("2026-11-19", "2026-12-31"), 42);
  assert.equal(esFechaValida("2026-02-29"), false);
  assert.equal(esFechaValida("2028-02-29"), true);
  assert.equal(esFechaValida("29/02/2028"), false);
  assert.equal(hoyEn("America/Santo_Domingo", new Date("2026-11-20T03:30:00Z")), "2026-11-19"); // 23:30 en Santo Domingo
});

test("solape de contratos en la misma unidad", () => {
  const existentes = [
    { id: "a", unidadId: "u1", inicio: "2026-01-01", fin: "2026-12-31", finalizado: false },
    { id: "b", unidadId: "u1", inicio: "2025-01-01", fin: "2025-12-31", finalizado: true },
  ];
  const nuevo = (inicio: string, fin: string, unidadId = "u1", id?: string) => ({ id, unidadId, inicio, fin, finalizado: false });
  assert.equal(haySolape(nuevo("2026-06-01", "2027-05-31"), existentes), true);
  assert.equal(haySolape(nuevo("2027-01-01", "2027-12-31"), existentes), false);
  assert.equal(haySolape(nuevo("2026-12-31", "2027-12-30"), existentes), true, "el último día cuenta");
  assert.equal(haySolape(nuevo("2025-03-01", "2025-06-30"), existentes), false, "los finalizados no cuentan");
  assert.equal(haySolape(nuevo("2026-06-01", "2027-05-31", "u2"), existentes), false, "otra unidad");
  assert.equal(haySolape(nuevo("2026-01-01", "2026-12-31", "u1", "a"), existentes), false, "el propio contrato al editarlo");
});
