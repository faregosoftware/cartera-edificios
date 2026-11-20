import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { cargarCartera } from "@/lib/cartera";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { Aviso, Cabecera, PillContrato, Vacio } from "@/components/ui";

const FILTROS: [string, string][] = [
  ["activos", "En curso y futuros"],
  ["Por vencer", "Por vencer"],
  ["Vencido", "Vencidos"],
  ["Finalizado", "Finalizados"],
  ["todos", "Todos"],
];

export default async function Contratos({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; inquilino?: string }> }) {
  const u = await requirePermiso("contratos.ver");
  const f = await searchParams;
  const estado = f.estado ?? "activos";
  const d = await cargarCartera();
  const q = (f.q ?? "").trim().toLowerCase();
  const filas = d.contratos
    .filter((c) => (estado === "todos" ? true : estado === "activos" ? c.estado !== "Finalizado" : c.estado === estado))
    .filter((c) => !f.inquilino || c.inquilinoId === f.inquilino)
    .filter((c) => !q || `${d.nombreUnidad(c.unidadId)} ${d.nombreInquilino(c.inquilinoId)}`.toLowerCase().includes(q))
    .sort((a, b) => a.fin.localeCompare(b.fin));
  const puedeCrear = d.unidades.length > 0 && d.inquilinos.length > 0;

  return (
    <>
      <Cabecera titulo="Contratos" sub="Contratos de alquiler por unidad e inquilino">
        {puede(u, "contratos.crear") && puedeCrear && (
          <Link className="btn primary" href="/contratos/nuevo">
            Nuevo contrato
          </Link>
        )}
      </Cabecera>
      {!puedeCrear && <Aviso>Para crear un contrato necesitas al menos una unidad y un inquilino registrados.</Aviso>}
      {!d.contratos.length ? (
        <Vacio titulo="Sin contratos todavía">
          <p>Crea un contrato para marcar una unidad como ocupada.</p>
        </Vacio>
      ) : (
        <>
          <form className="filters" method="get">
            <input type="search" name="q" placeholder="Buscar unidad, edificio o inquilino" defaultValue={f.q ?? ""} aria-label="Buscar" />
            <select name="estado" defaultValue={estado} aria-label="Estado">
              {FILTROS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            {f.inquilino && <input type="hidden" name="inquilino" value={f.inquilino} />}
            <button className="btn" type="submit">
              Filtrar
            </button>
            {f.inquilino && (
              <Link className="link" href="/contratos">
                Quitar filtro de {d.nombreInquilino(f.inquilino)}
              </Link>
            )}
          </form>
          {!filas.length ? (
            <Vacio titulo="Ningún contrato coincide con los filtros" />
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Inquilino</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th className="num">Renta</th>
                    <th className="num">Garantía</th>
                    <th className="num">Día de pago</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{d.nombreUnidad(c.unidadId)}</b>
                      </td>
                      <td>{d.nombreInquilino(c.inquilinoId)}</td>
                      <td>
                        {formatoFecha(c.inicio)} → {formatoFecha(c.fin)}
                        {c.finalizado && c.fechaSalida && <div className="sub">Salida {formatoFecha(c.fechaSalida)}</div>}
                      </td>
                      <td>
                        <PillContrato estado={c.estado} />
                      </td>
                      <td className="num">{formatoDinero(c.renta, c.moneda)}</td>
                      <td className="num">{c.garantia ? formatoDinero(c.garantia, c.moneda) : "—"}</td>
                      <td className="num">{c.diaPago ?? "—"}</td>
                      <td className="act">
                        {!c.finalizado && puede(u, "contratos.renovar") && (
                          <Link className="btn sm" href={`/contratos/${c.id}/renovar`}>
                            Renovar
                          </Link>
                        )}
                        {!c.finalizado && puede(u, "contratos.finalizar") && (
                          <Link className="btn sm" href={`/contratos/${c.id}/finalizar`}>
                            Finalizar
                          </Link>
                        )}
                        {(puede(u, "contratos.editar") || puede(u, "contratos.eliminar")) && (
                          <Link className="btn sm" href={`/contratos/${c.id}`}>
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
