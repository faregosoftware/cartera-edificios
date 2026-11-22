import { Campo } from "@/components/ui";

type Valores = { nombre?: string; direccion?: string | null; ciudad?: string | null; notas?: string | null };

export function CamposEdificio({ v = {} }: { v?: Valores }) {
  return (
    <>
      <Campo nombre="nombre" etiqueta="Nombre del edificio" requerido completo valor={v.nombre} />
      <Campo nombre="direccion" etiqueta="Dirección" valor={v.direccion} />
      <Campo nombre="ciudad" etiqueta="Ciudad" valor={v.ciudad ?? "Santo Domingo"} />
      <Campo nombre="notas" etiqueta="Notas" tipo="textarea" completo valor={v.notas} />
    </>
  );
}
