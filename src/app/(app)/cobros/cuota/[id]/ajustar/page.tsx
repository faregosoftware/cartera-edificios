import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { cargarCuotas } from "@/lib/cuentas";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, Campo } from "@/components/ui";
import { ajustarCuota } from "../../../actions";

export default async function AjustarCuota({ params }: { params: Promise<{ id: string }> }) {
  await requirePermiso("cobros.anular");
  const { id } = await params;
  const [c] = await cargarCuotas({ id });
  if (!c) notFound();
  return (
    <>
      <Cabecera
        titulo="Ajustar cuota"
        sub={`${c.unidad} · ${c.inquilino} · ${formatoFecha(c.desde)} – ${formatoFecha(c.hasta)} · ya pagado ${formatoDinero(c.pagado, c.moneda)}`}
      />
      <div className="form">
        <p className="full sub">Úsalo para descuentos, prorrateos o correcciones. Para no cobrar nada, pon 0 (si no hay pagos).</p>
        <FormAccion action={ajustarCuota.bind(null, id)}>
          <Campo nombre="monto" etiqueta={`Monto de la cuota (${c.moneda === "USD" ? "US$" : "RD$"})`} tipo="number" requerido min={c.pagado} valor={c.monto} />
          <Campo nombre="nota" etiqueta="Motivo" requerido valor={c.nota} />
          <BotonesForm cancelar={`/cobros/${c.contratoId}`} texto="Guardar ajuste" />
        </FormAccion>
      </div>
    </>
  );
}
