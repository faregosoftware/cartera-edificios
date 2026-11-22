import Link from "next/link";
import { requirePermiso } from "@/lib/auth";
import { finPorDefecto } from "@/lib/negocio";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, Vacio } from "@/components/ui";
import { CamposContrato } from "../CamposContrato";
import { crearContrato } from "../actions";
import { opcionesContrato } from "../opciones";

export default async function NuevoContrato({ searchParams }: { searchParams: Promise<{ unidad?: string }> }) {
  await requirePermiso("contratos.crear");
  const { unidad } = await searchParams;
  const { d, unidades, inquilinos } = await opcionesContrato();
  if (!unidades.length || !inquilinos.length) {
    return (
      <Vacio titulo="Faltan datos para crear un contrato">
        <p>Necesitas al menos una unidad y un inquilino registrados.</p>
        <Link className="btn" href={!inquilinos.length ? "/inquilinos/nuevo" : "/unidades/nueva"}>
          {!inquilinos.length ? "Registrar inquilino" : "Registrar unidad"}
        </Link>
      </Vacio>
    );
  }
  const u = unidad ? d.unidades.find((x) => x.id === unidad) : undefined;
  return (
    <>
      <Cabecera titulo="Nuevo contrato" sub={u ? `${u.edificio} · ${u.codigo}` : undefined} />
      <div className="form">
        <FormAccion action={crearContrato}>
          <CamposContrato
            unidades={unidades}
            inquilinos={inquilinos}
            v={{
              unidadId: u?.id,
              inicio: d.hoy,
              fin: finPorDefecto(d.hoy),
              renta: u?.rentaReferencia ?? null,
              moneda: u?.monedaReferencia ?? "DOP",
            }}
          />
          <BotonesForm cancelar="/contratos" texto="Registrar contrato" />
        </FormAccion>
      </div>
    </>
  );
}
