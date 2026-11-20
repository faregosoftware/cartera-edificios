import { notFound, redirect } from "next/navigation";
import { requireUsuario, puede } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, PillContrato } from "@/components/ui";
import { CamposContrato } from "../CamposContrato";
import { editarContrato, eliminarContrato } from "../actions";
import { opcionesContrato } from "../opciones";

export default async function EditarContrato({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUsuario();
  if (!puede(u, "contratos.editar") && !puede(u, "contratos.eliminar")) redirect("/sin-permiso");
  const { id } = await params;
  const { d, unidades, inquilinos } = await opcionesContrato();
  const c = d.contratos.find((x) => x.id === id);
  if (!c) notFound();
  return (
    <>
      <Cabecera
        titulo="Contrato"
        sub={
          <>
            {d.nombreUnidad(c.unidadId)} · {d.nombreInquilino(c.inquilinoId)} · <PillContrato estado={c.estado} />
          </>
        }
      >
        {puede(u, "contratos.eliminar") && (
          <FormAccion
            action={eliminarContrato.bind(null, id)}
            confirmar="¿Eliminar este contrato? Si sólo terminó, usa Finalizar para conservar el historial."
          >
            <button type="submit" className="btn danger">
              Eliminar contrato
            </button>
          </FormAccion>
        )}
      </Cabecera>
      {puede(u, "contratos.editar") && (
        <div className="form">
          <FormAccion action={editarContrato.bind(null, id)}>
            <CamposContrato unidades={unidades} inquilinos={inquilinos} v={c} />
            <BotonesForm cancelar="/contratos" />
          </FormAccion>
        </div>
      )}
    </>
  );
}
