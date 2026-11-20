import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, Campo, Vacio } from "@/components/ui";
import { finalizarContrato } from "../../actions";
import { cargarCartera } from "@/lib/cartera";

export default async function FinalizarContrato({ params }: { params: Promise<{ id: string }> }) {
  await requirePermiso("contratos.finalizar");
  const { id } = await params;
  const d = await cargarCartera();
  const c = d.contratos.find((x) => x.id === id);
  if (!c) notFound();
  if (c.finalizado) return <Vacio titulo="Este contrato ya está finalizado" />;
  return (
    <>
      <Cabecera titulo="Finalizar contrato" sub={`${d.nombreUnidad(c.unidadId)} · ${d.nombreInquilino(c.inquilinoId)}`} />
      <div className="form">
        <p className="full">La unidad quedará libre desde la fecha de salida.</p>
        <FormAccion action={finalizarContrato.bind(null, id)}>
          <Campo nombre="fechaSalida" etiqueta="Fecha de salida" tipo="date" requerido valor={d.hoy < c.fin ? d.hoy : c.fin} />
          <BotonesForm cancelar="/contratos" texto="Finalizar contrato" />
        </FormAccion>
      </div>
    </>
  );
}
