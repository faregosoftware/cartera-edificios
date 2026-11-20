import { Campo } from "@/components/ui";
import { MONEDAS, TIPOS_UNIDAD } from "@/lib/catalogos";

type Valores = Partial<{
  edificioId: string;
  codigo: string;
  tipo: string;
  piso: string | null;
  superficie: number | null;
  dormitorios: number | null;
  rentaReferencia: number | null;
  monedaReferencia: string;
  notas: string | null;
}>;

export function CamposUnidad({ edificios, v = {} }: { edificios: { id: string; nombre: string }[]; v?: Valores }) {
  return (
    <>
      <Campo nombre="edificioId" etiqueta="Edificio" tipo="select" requerido completo vacio="Elige un edificio" opciones={edificios.map((e) => [e.id, e.nombre])} valor={v.edificioId} />
      <Campo nombre="codigo" etiqueta="Código o número" requerido valor={v.codigo} />
      <Campo nombre="tipo" etiqueta="Tipo" tipo="select" opciones={TIPOS_UNIDAD} valor={v.tipo ?? "Departamento"} />
      <Campo nombre="piso" etiqueta="Piso" valor={v.piso} />
      <Campo nombre="superficie" etiqueta="Superficie (m²)" tipo="number" min={0} valor={v.superficie} />
      <Campo nombre="dormitorios" etiqueta="Dormitorios" tipo="number" min={0} paso={1} valor={v.dormitorios} />
      <Campo nombre="rentaReferencia" etiqueta="Renta de referencia" tipo="number" min={0} valor={v.rentaReferencia} />
      <Campo nombre="monedaReferencia" etiqueta="Moneda" tipo="select" opciones={MONEDAS} valor={v.monedaReferencia ?? "BOB"} />
      <Campo nombre="notas" etiqueta="Notas" tipo="textarea" completo valor={v.notas} />
    </>
  );
}
