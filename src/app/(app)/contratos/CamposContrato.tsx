import { Campo } from "@/components/ui";
import { MONEDAS } from "@/lib/catalogos";

export type ValoresContrato = Partial<{
  unidadId: string;
  inquilinoId: string;
  inicio: string;
  fin: string;
  renta: number | null;
  moneda: string;
  garantia: number | null;
  diaPago: number | null;
  notas: string | null;
}>;

export function CamposContrato({
  unidades,
  inquilinos,
  v,
  unidadFija,
}: {
  unidades: { id: string; nombre: string; ocupada: boolean }[];
  inquilinos: { id: string; nombre: string }[];
  v: ValoresContrato;
  /** En una renovación la unidad no cambia. */
  unidadFija?: boolean;
}) {
  const opcionesUnidad = unidades.map((u) => [u.id, u.nombre + (u.ocupada ? " (ocupada)" : "")] as [string, string]);
  return (
    <>
      {unidadFija ? (
        <>
          <input type="hidden" name="unidadId" value={v.unidadId} />
          <div className="fld full">
            <label>Unidad</label>
            <div>{unidades.find((u) => u.id === v.unidadId)?.nombre}</div>
          </div>
        </>
      ) : (
        <Campo nombre="unidadId" etiqueta="Unidad" tipo="select" requerido completo vacio="Elige una unidad" opciones={opcionesUnidad} valor={v.unidadId} />
      )}
      <Campo nombre="inquilinoId" etiqueta="Inquilino" tipo="select" requerido completo vacio="Elige un inquilino" opciones={inquilinos.map((i) => [i.id, i.nombre])} valor={v.inquilinoId} />
      <Campo nombre="inicio" etiqueta="Fecha de inicio" tipo="date" requerido valor={v.inicio} />
      <Campo nombre="fin" etiqueta="Fecha de fin" tipo="date" requerido valor={v.fin} />
      <Campo nombre="renta" etiqueta="Renta mensual" tipo="number" requerido min={0} valor={v.renta} />
      <Campo nombre="moneda" etiqueta="Moneda" tipo="select" opciones={MONEDAS} valor={v.moneda ?? "DOP"} />
      <Campo nombre="garantia" etiqueta="Garantía" tipo="number" min={0} valor={v.garantia} />
      <Campo nombre="diaPago" etiqueta="Día de pago del mes" tipo="number" min={1} max={31} paso={1} valor={v.diaPago ?? 5} />
      <Campo nombre="notas" etiqueta="Notas" tipo="textarea" completo valor={v.notas} />
    </>
  );
}
