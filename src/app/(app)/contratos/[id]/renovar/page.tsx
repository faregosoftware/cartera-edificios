import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { finPorDefecto, formatoFecha, sumarDias } from "@/lib/negocio";
import { FormAccion } from "@/components/FormAccion";
import { Aviso, BotonesForm, Cabecera, Vacio } from "@/components/ui";
import { CamposContrato } from "../../CamposContrato";
import { renovarContrato } from "../../actions";
import { opcionesContrato } from "../../opciones";

export default async function RenovarContrato({ params }: { params: Promise<{ id: string }> }) {
  await requirePermiso("contratos.renovar");
  const { id } = await params;
  const { d, unidades, inquilinos } = await opcionesContrato();
  const c = d.contratos.find((x) => x.id === id);
  if (!c) notFound();
  if (c.finalizado) return <Vacio titulo="Este contrato ya está finalizado" />;
  const inicio = sumarDias(c.fin, 1);
  return (
    <>
      <Cabecera titulo="Renovar contrato" sub={`${d.nombreUnidad(c.unidadId)} · ${d.nombreInquilino(c.inquilinoId)}`} />
      <Aviso>
        Se creará un contrato nuevo y el actual quedará finalizado al {formatoFecha(c.fin)}. Ajusta la renta si cambia.
      </Aviso>
      <div className="form">
        <FormAccion action={renovarContrato.bind(null, id)}>
          <CamposContrato unidadFija unidades={unidades} inquilinos={inquilinos} v={{ ...c, inicio, fin: finPorDefecto(inicio) }} />
          <BotonesForm cancelar="/contratos" texto="Renovar" />
        </FormAccion>
      </div>
    </>
  );
}
