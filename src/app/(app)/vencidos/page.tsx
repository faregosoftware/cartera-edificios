import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hoyApp } from "@/lib/cartera";
import { cargarCuotas, sincronizarCuotas, totalesPorMoneda, type CuotaVista } from "@/lib/cuentas";
import { tramoAtraso } from "@/lib/cobros";
import { diasEntre, formatoDinero, formatoFecha, sumarDias } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";
import { Montos } from "@/components/cobros";

const TRAMOS = ["1–30 días", "31–60 días", "61–90 días", "Más de 90 días"] as const;
const CLASE_TRAMO: Record<(typeof TRAMOS)[number], string> = { "1–30 días": "warn", "31–60 días": "bad", "61–90 días": "bad", "Más de 90 días": "bad" };

export default async function Vencidos({ searchParams }: { searchParams: Promise<{ edificio?: string; tramo?: string }> }) {
  const u = await requirePermiso("cobros.ver");
  const f = await searchParams;
  const hoy = hoyApp();
  await sincronizarCuotas();
  const [pendientes, edificios] = await Promise.all([
    cargarCuotas({ vencimiento: { lte: new Date(`${sumarDias(hoy, 7)}T00:00:00Z`) } }),
    prisma.edificio.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);
  const delEdificio = pendientes.filter((c) => c.saldo > 0 && (!f.edificio || c.edificioId === f.edificio));
  const vencidas = delEdificio.filter((c) => c.estado === "Vencida");
  const proximas = delEdificio.filter((c) => c.estado !== "Vencida");

  // Agrupa por contrato: una fila por inquilino/unidad en mora.
  const grupos = new Map<string, CuotaVista[]>();
  for (const c of vencidas) grupos.set(c.contratoId, [...(grupos.get(c.contratoId) ?? []), c]);
  const morosos = [...grupos.values()]
    .map((cs) => {
      const atraso = Math.max(...cs.map((c) => c.diasAtraso));
      return { ref: cs[0], cuotas: cs, atraso, tramo: tramoAtraso(atraso)!, deuda: totalesPorMoneda(cs, (c) => c.saldo) };
    })
    .filter((m) => !f.tramo || m.tramo === f.tramo)
    .sort((a, b) => b.atraso - a.atraso);

  const porTramo = TRAMOS.map((t) => {
    const cs = vencidas.filter((c) => tramoAtraso(c.diasAtraso) === t);
    return { t, n: new Set(cs.map((c) => c.contratoId)).size, total: totalesPorMoneda(cs, (c) => c.saldo) };
  });
  const totalVencido = totalesPorMoneda(vencidas, (c) => c.saldo);
  const cobrar = puede(u, "cobros.registrar");

  return (
    <>
      <Cabecera titulo="Vencidos" sub={`Cuotas impagas cuyo día de pago ya pasó, al ${formatoFecha(hoy)}`}>
        <Link className="btn" href="/cobros">
          Ir a cobros
        </Link>
      </Cabecera>

      <div className="kpis">
        <div className={`kpi${vencidas.length ? " alert" : ""}`}>
          <div className="l">Total vencido</div>
          <div className="v">
            <Montos t={totalVencido} />
          </div>
          <div className="s">
            {vencidas.length} cuota(s) de {grupos.size} contrato(s)
          </div>
        </div>
        {porTramo.map((x) => (
          <a key={x.t} className="kpi" href={`?tramo=${encodeURIComponent(x.t)}${f.edificio ? `&edificio=${f.edificio}` : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="l">{x.t}</div>
            <div className="v">{x.n}</div>
            <div className="s">
              <Montos t={x.total} />
            </div>
          </a>
        ))}
      </div>

      <form className="filters" method="get">
        <select name="edificio" defaultValue={f.edificio ?? ""} aria-label="Edificio">
          <option value="">Todos los edificios</option>
          {edificios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select name="tramo" defaultValue={f.tramo ?? ""} aria-label="Atraso">
          <option value="">Cualquier atraso</option>
          {TRAMOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="btn" type="submit">
          Filtrar
        </button>
      </form>

      {!morosos.length ? (
        <Vacio titulo={vencidas.length ? "Nadie en ese tramo de atraso" : "No hay cuotas vencidas"}>
          {!vencidas.length && <p>Todos los inquilinos están al día con sus pagos.</p>}
        </Vacio>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Unidad</th>
                <th>Cuotas vencidas</th>
                <th className="num">Días de atraso</th>
                <th className="num">Deuda vencida</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {morosos.map((m) => (
                <tr key={m.ref.contratoId}>
                  <td>
                    <b>{m.ref.inquilino}</b>
                    {m.ref.telefono && <div className="sub">{m.ref.telefono}</div>}
                  </td>
                  <td>
                    {m.ref.unidad}
                    {m.ref.contratoFinalizado && <div className="sub">contrato finalizado</div>}
                  </td>
                  <td>
                    {m.cuotas.map((c) => (
                      <div key={c.id} className="sub">
                        Vencía {formatoFecha(c.vencimiento)}: {formatoDinero(c.saldo, c.moneda)}
                        {c.pagado > 0 ? " (pago parcial)" : ""}
                      </div>
                    ))}
                  </td>
                  <td className="num">
                    <span className={`pill ${CLASE_TRAMO[m.tramo]}`}>{m.atraso} días</span>
                  </td>
                  <td className="num">
                    <b>
                      <Montos t={m.deuda} />
                    </b>
                  </td>
                  <td className="act">
                    <Link className={`btn sm${cobrar ? " primary" : ""}`} href={`/cobros/${m.ref.contratoId}`}>
                      {cobrar ? "Cobrar" : "Estado de cuenta"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Vencen en los próximos 7 días</h2>
        {!proximas.length ? (
          <p className="sub">No hay cuotas por vencer esta semana.</p>
        ) : (
          <div className="list">
            {proximas.map((c) => {
              const d = diasEntre(hoy, c.vencimiento);
              return (
                <div className="it" key={c.id}>
                  <div>
                    <b>{c.inquilino}</b> · {c.unidad}
                    <div className="sub">
                      Vence {formatoFecha(c.vencimiento)} ({d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`}) · {formatoDinero(c.saldo, c.moneda)}
                    </div>
                  </div>
                  {cobrar && (
                    <Link className="btn sm" href={`/cobros/cuota/${c.id}`}>
                      Cobrar
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
