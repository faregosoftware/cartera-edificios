import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cargarCuotas, sincronizarCuotas, totalesPorMoneda, type CuotaVista } from "@/lib/cuentas";
import { formatoFecha } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";
import { Montos, PillCuota } from "@/components/cobros";

export default async function Cobros({ searchParams }: { searchParams: Promise<{ q?: string; edificio?: string; solo?: string }> }) {
  const u = await requirePermiso("cobros.ver");
  const f = await searchParams;
  await sincronizarCuotas();
  const [cuotas, edificios] = await Promise.all([cargarCuotas(), prisma.edificio.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } })]);

  // Una fila por contrato con algo pendiente (o en curso).
  const porContrato = new Map<string, CuotaVista[]>();
  for (const c of cuotas) porContrato.set(c.contratoId, [...(porContrato.get(c.contratoId) ?? []), c]);
  const q = (f.q ?? "").trim().toLowerCase();
  const filas = [...porContrato.entries()]
    .map(([contratoId, cs]) => {
      const pendientes = cs.filter((c) => c.saldo > 0);
      const vencidas = pendientes.filter((c) => c.estado === "Vencida");
      const proxima = pendientes.find((c) => c.estado !== "Vencida");
      return {
        contratoId,
        ref: cs[0],
        pendientes,
        vencidas,
        proxima,
        saldo: totalesPorMoneda(pendientes, (c) => c.saldo),
        vencido: totalesPorMoneda(vencidas, (c) => c.saldo),
        atraso: Math.max(0, ...vencidas.map((c) => c.diasAtraso)),
      };
    })
    .filter((x) => !x.ref.contratoFinalizado || x.pendientes.length > 0)
    .filter((x) => f.solo !== "deuda" || x.pendientes.length > 0)
    .filter((x) => !f.edificio || x.ref.edificioId === f.edificio)
    .filter((x) => !q || `${x.ref.unidad} ${x.ref.inquilino}`.toLowerCase().includes(q))
    .sort((a, b) => b.atraso - a.atraso || a.ref.unidad.localeCompare(b.ref.unidad, "es", { numeric: true }));

  return (
    <>
      <Cabecera titulo="Cobros" sub="Estado de cuenta de cada contrato. Elige uno para registrar un pago.">
        <Link className="btn" href="/vencidos">
          Ver vencidos
        </Link>
        <Link className="btn" href="/recibos">
          Recibos emitidos
        </Link>
      </Cabecera>
      <form className="filters" method="get">
        <input type="search" name="q" placeholder="Buscar unidad o inquilino" defaultValue={f.q ?? ""} aria-label="Buscar" />
        <select name="edificio" defaultValue={f.edificio ?? ""} aria-label="Edificio">
          <option value="">Todos los edificios</option>
          {edificios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select name="solo" defaultValue={f.solo ?? ""} aria-label="Mostrar">
          <option value="">Todos los contratos</option>
          <option value="deuda">Sólo con saldo pendiente</option>
        </select>
        <button className="btn" type="submit">
          Filtrar
        </button>
      </form>
      {!filas.length ? (
        <Vacio titulo={cuotas.length ? "Ningún contrato coincide con los filtros" : "Todavía no hay cuotas"}>
          {!cuotas.length && <p>Las cuotas se generan solas a partir de los contratos registrados.</p>}
        </Vacio>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Inquilino</th>
                <th>Situación</th>
                <th className="num">Vencido</th>
                <th className="num">Saldo total</th>
                <th>Próximo vencimiento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filas.map((x) => (
                <tr key={x.contratoId}>
                  <td>
                    <b>{x.ref.unidad}</b>
                  </td>
                  <td>{x.ref.inquilino}</td>
                  <td>
                    {x.vencidas.length ? (
                      <span className="pill bad">
                        {x.vencidas.length} vencida{x.vencidas.length === 1 ? "" : "s"} · {x.atraso} d
                      </span>
                    ) : x.pendientes.length ? (
                      <PillCuota estado={x.pendientes[0].estado} />
                    ) : (
                      <span className="pill ok">Al día</span>
                    )}
                  </td>
                  <td className="num">
                    <Montos t={x.vencido} />
                  </td>
                  <td className="num">
                    <Montos t={x.saldo} />
                  </td>
                  <td>{x.proxima ? formatoFecha(x.proxima.vencimiento) : "—"}</td>
                  <td className="act">
                    <Link className={`btn sm${x.pendientes.length && puede(u, "cobros.registrar") ? " primary" : ""}`} href={`/cobros/${x.contratoId}`}>
                      {x.pendientes.length && puede(u, "cobros.registrar") ? "Cobrar" : "Estado de cuenta"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
