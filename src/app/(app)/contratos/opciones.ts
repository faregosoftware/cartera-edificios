import { cargarCartera } from "@/lib/cartera";

/** Listas para los selectores del formulario de contrato. */
export async function opcionesContrato() {
  const d = await cargarCartera();
  return {
    d,
    unidades: d.unidades.map((u) => ({ id: u.id, nombre: `${u.edificio} · ${u.codigo}`, ocupada: !!u.actual })),
    inquilinos: d.inquilinos.map((i) => ({ id: i.id, nombre: i.nombre })),
  };
}
