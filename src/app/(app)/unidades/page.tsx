import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { cargarCartera } from "@/lib/cartera";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";

type Filtros = { edificio?: string; estado?: string; q?: string };

export default async function Unidades({ searchParams }: { searchParams: Promise<Filtros> }) {
  const u = await requirePermiso("unidades.ver");
  const f = await searchParams;
  const d = await cargarCartera();
  const q = (f.q ?? "").trim().toLowerCase();
  const filas = d.unidades
    .filter((x) => !f.edificio || x.edificioId === f.edificio)
    .filter((x) => !f.estado || (f.estado === "ocupada") === !!x.actual)
    .filter((x) => !q || [x.codigo, x.edificio, x.inquilinoActual, x.tipo].join(" ").toLowerCase().includes(q));
  const nueva = `/unidades/nueva${f.edificio ? `?edificio=${f.edificio}` : ""}`;

  return (
    <>
      <Cabecera titulo="Unidades" sub="Departamentos, locales, oficinas y parqueos de todos los edificios">
        {puede(u, "unidades.crear") && d.edificios.length > 0 && (
          <Link className="btn primary" href={nueva}>
            Nueva unidad
          </Link>
        )}
      </Cabecera>
      {!d.edificios.length ? (
        <Vacio titulo="Primero registra un edificio" />
      ) : (
        <>
          <form className="filters" method="get">
            <input type="search" name="q" placeholder="Buscar unidad o inquilino" defaultValue={f.q ?? ""} aria-label="Buscar" />
            <select name="edificio" defaultValue={f.edificio ?? ""} aria-label="Edificio">
              <option value="">Todos los edificios</option>
              {d.edificios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <select name="estado" defaultValue={f.estado ?? ""} aria-label="Estado">
              <option value="">Ocupadas y libres</option>
              <option value="ocupada">Sólo ocupadas</option>
              <option value="libre">Sólo libres</option>
            </select>
            <button className="btn" type="submit">
              Filtrar
            </button>
          </form>
          {!filas.length ? (
            <Vacio titulo={d.unidades.length ? "Ninguna unidad coincide con los filtros" : "Todavía no hay unidades"} />
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Edificio</th>
                    <th>Unidad</th>
                    <th>Tipo</th>
                    <th className="num">m²</th>
                    <th>Estado</th>
                    <th>Inquilino actual</th>
                    <th className="num">Renta</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((x) => (
                    <tr key={x.id}>
                      <td>{x.edificio}</td>
                      <td>
                        <b>{x.codigo}</b>
                        {x.piso && <div className="sub">Piso {x.piso}</div>}
                      </td>
                      <td>
                        {x.tipo}
                        {x.dormitorios ? <div className="sub">{x.dormitorios} dorm.</div> : null}
                      </td>
                      <td className="num">{x.superficie ?? "—"}</td>
                      <td>
                        {x.actual ? (
                          x.actual.estado === "Vencido" ? (
                            <span className="pill bad">Ocupada · vencido</span>
                          ) : (
                            <span className="pill ok">Ocupada</span>
                          )
                        ) : (
                          <span className="pill idle">Libre</span>
                        )}
                      </td>
                      <td>
                        {x.inquilinoActual ?? "—"}
                        {x.actual && <div className="sub">hasta {formatoFecha(x.actual.fin)}</div>}
                      </td>
                      <td className="num">
                        {x.actual ? (
                          formatoDinero(x.actual.renta, x.actual.moneda)
                        ) : x.rentaReferencia ? (
                          <span className="sub">ref. {formatoDinero(x.rentaReferencia, x.monedaReferencia)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="act">
                        {!x.actual && puede(u, "contratos.crear") && (
                          <Link className="btn sm" href={`/contratos/nuevo?unidad=${x.id}`}>
                            Alquilar
                          </Link>
                        )}
                        {(puede(u, "unidades.editar") || puede(u, "unidades.eliminar")) && (
                          <Link className="btn sm" href={`/unidades/${x.id}`}>
                            Editar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
