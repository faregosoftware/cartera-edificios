import { Campo } from "@/components/ui";
import { TIPOS_DOC } from "@/lib/catalogos";

type Valores = Partial<{ nombre: string; tipoDoc: string; documento: string | null; telefono: string | null; email: string | null; notas: string | null }>;

export function CamposInquilino({ v = {} }: { v?: Valores }) {
  return (
    <>
      <Campo nombre="nombre" etiqueta="Nombre o razón social" requerido completo valor={v.nombre} />
      <Campo nombre="tipoDoc" etiqueta="Tipo de documento" tipo="select" opciones={TIPOS_DOC} valor={v.tipoDoc ?? "CI"} />
      <Campo nombre="documento" etiqueta="Número de documento" valor={v.documento} />
      <Campo nombre="telefono" etiqueta="Teléfono" tipo="tel" valor={v.telefono} />
      <Campo nombre="email" etiqueta="Correo" tipo="email" valor={v.email} />
      <Campo nombre="notas" etiqueta="Notas" tipo="textarea" completo valor={v.notas} />
    </>
  );
}
