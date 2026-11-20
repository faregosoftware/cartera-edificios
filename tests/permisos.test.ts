import { test } from "node:test";
import assert from "node:assert/strict";
import { esPermisoValido, normalizarPermisos, PERMISOS_ADMIN_OBLIGATORIOS, ROLES_INICIALES, TODOS_LOS_PERMISOS } from "../src/lib/permisos.ts";

const rol = (n: string) => ROLES_INICIALES.find((r) => r.nombre === n)!;

test("catálogo de permisos", () => {
  assert.equal(TODOS_LOS_PERMISOS.length, 25);
  assert.equal(new Set(TODOS_LOS_PERMISOS).size, TODOS_LOS_PERMISOS.length, "sin duplicados");
  assert.ok(esPermisoValido("contratos.renovar"));
  assert.ok(!esPermisoValido("contratos.borrar"));
});

test("normalizar lo que llega del formulario", () => {
  assert.deepEqual(normalizarPermisos(["unidades.ver", "x.y", "panel.ver", "panel.ver"]), ["panel.ver", "unidades.ver"]);
  assert.deepEqual(normalizarPermisos([]), []);
});

test("roles iniciales", () => {
  assert.deepEqual(rol("Administrador").permisos, TODOS_LOS_PERMISOS);
  for (const p of PERMISOS_ADMIN_OBLIGATORIOS) assert.ok(rol("Administrador").permisos.includes(p));

  const op = rol("Operador").permisos;
  assert.ok(op.includes("contratos.crear") && op.includes("contratos.renovar") && op.includes("contratos.finalizar"));
  assert.ok(!op.some((p) => p.endsWith(".eliminar")), "el operador no elimina");
  assert.ok(op.includes("cobros.registrar") && !op.includes("cobros.anular"), "el operador cobra pero no anula");
  assert.ok(!op.some((p) => p.startsWith("usuarios.") || p.startsWith("roles.")), "el operador no administra usuarios");

  const con = rol("Consulta").permisos;
  assert.ok(con.every((p) => p.endsWith(".ver")));
  assert.ok(con.includes("panel.ver") && con.includes("contratos.ver") && con.includes("cobros.ver"));
  assert.ok(!con.includes("usuarios.ver"));
});
