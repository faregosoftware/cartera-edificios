import { requirePermiso } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposRol } from "../CamposRol";
import { crearRol } from "../actions";

export default async function NuevoRol() {
  await requirePermiso("roles.administrar");
  return (
    <>
      <Cabecera titulo="Nuevo rol" sub="Marca las funciones que podrán usar los usuarios con este rol." />
      <div className="form">
        <FormAccion action={crearRol}>
          <CamposRol />
          <BotonesForm cancelar="/roles" texto="Crear rol" />
        </FormAccion>
      </div>
    </>
  );
}
