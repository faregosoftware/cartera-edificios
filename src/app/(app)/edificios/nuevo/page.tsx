import { requirePermiso } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposEdificio } from "../CamposEdificio";
import { crearEdificio } from "../actions";

export default async function NuevoEdificio() {
  await requirePermiso("edificios.crear");
  return (
    <>
      <Cabecera titulo="Nuevo edificio" />
      <div className="form">
        <FormAccion action={crearEdificio}>
          <CamposEdificio />
          <BotonesForm cancelar="/edificios" texto="Registrar edificio" />
        </FormAccion>
      </div>
    </>
  );
}
