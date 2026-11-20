import { requirePermiso } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposInquilino } from "../CamposInquilino";
import { crearInquilino } from "../actions";

export default async function NuevoInquilino() {
  await requirePermiso("inquilinos.crear");
  return (
    <>
      <Cabecera titulo="Nuevo inquilino" />
      <div className="form">
        <FormAccion action={crearInquilino}>
          <CamposInquilino />
          <BotonesForm cancelar="/inquilinos" texto="Registrar inquilino" />
        </FormAccion>
      </div>
    </>
  );
}
