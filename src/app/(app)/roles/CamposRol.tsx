import { Campo } from "@/components/ui";
import { MODULOS } from "@/lib/permisos";

export function CamposRol({ v = {}, bloqueado }: { v?: { nombre?: string; descripcion?: string | null; permisos?: string[] }; bloqueado?: boolean }) {
  const marcados = new Set(v.permisos ?? []);
  return (
    <>
      <Campo nombre="nombre" etiqueta="Nombre del rol" requerido valor={v.nombre} />
      <Campo nombre="descripcion" etiqueta="Descripción" valor={v.descripcion} />
      <div className="permisos">
        {MODULOS.map((m) => (
          <fieldset key={m.clave}>
            <legend>{m.nombre}</legend>
            {m.acciones.map((a) => {
              const clave = `${m.clave}.${a.clave}`;
              return (
                <label key={clave}>
                  <input type="checkbox" name="permisos" value={clave} defaultChecked={bloqueado || marcados.has(clave)} disabled={bloqueado} />
                  {a.nombre}
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
      {bloqueado && <p className="full sub">El rol Administrador siempre tiene todos los permisos.</p>}
    </>
  );
}
