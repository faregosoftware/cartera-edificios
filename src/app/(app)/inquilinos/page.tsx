import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { cargarCartera } from "@/lib/cartera";
import { ocupa } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";

export default async function Inquilinos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const u = await requirePermiso("inquilinos.ver");
  const { q: qCrudo } = await searchParams;
  const d = await cargarCartera();
  const q = (qCrudo ?? "").trim().toLowerCase();
  const filas = d.inquilinos.filter((i) => !q || [i.nombre, i.documento, i.telefono, i.email].join(" ").toLowerCase().includes(q));
  return (
    <>
      <Cabecera titulo="Inquilinos" sub="Personas y empresas que alquilan en tus edificios">
        {puede(u, "inquilinos.crear") && (
          <Link className="btn primary" href="/inquilinos/nuevo">
            Nuevo inquilino
          </Link>
        )}
      </Cabecera>
      {!d.inquilinos.length ? (
        <Vacio titulo="Sin inquilinos todavía">
          <p>Registra a tus inquilinos para poder asignarles contratos.</p>
        </Vacio>
      ) : (
        <>
          <form className="filters" method="get">
            <input type="search" name="q" placeholder="Buscar por nombre, documento o teléfono" defaultValue={qCrudo ?? ""} aria-label="Buscar" />
            <button className="btn" type="submit">
              Buscar
            </button>
          </form>
          {!filas.length ? (
            <Vacio titulo="Ningún inquilino coincide con la búsqueda" />
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Contacto</th>
                    <th>Alquila actualmente</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((i) => {
                    const actuales = d.contratos.filter((c) => c.inquilinoId === i.id && ocupa(c, d.hoy));
                    return (
                      <tr key={i.id}>
                        <td>
                          <b>{i.nombre}</b>
                          {i.notas && <div className="sub">{i.notas}</div>}
                        </td>
                        <td>{i.documento ? `${i.tipoDoc} ${i.documento}` : "—"}</td>
                        <td>
                          {i.telefono ?? (i.email ? null : "—")}
                          {i.email && <div className="sub">{i.email}</div>}
                        </td>
                        <td>
                          {actuales.length ? (
                            actuales.map((c) => <div key={c.id}>{d.nombreUnidad(c.unidadId)}</div>)
                          ) : (
                            <span className="sub">Nada</span>
                          )}
                        </td>
                        <td className="act">
                          {puede(u, "contratos.ver") && (
                            <Link className="btn sm" href={`/contratos?inquilino=${i.id}&estado=todos`}>
                              Contratos
                            </Link>
                          )}
                          {(puede(u, "inquilinos.editar") || puede(u, "inquilinos.eliminar")) && (
                            <Link className="btn sm" href={`/inquilinos/${i.id}`}>
                              Editar
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
