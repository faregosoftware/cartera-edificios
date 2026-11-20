import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermiso, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fechaISO, num } from "@/lib/convertir";
import { cargarCuotas, sincronizarCuotas, totalesPorMoneda } from "@/lib/cuentas";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";
import { Montos, PillCuota } from "@/components/cobros";

export default async function EstadoDeCuenta({ params }: { params: Promise<{ contratoId: string }> }) {
  const u = await requirePermiso("cobros.ver");
  const { contratoId } = await params;
  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: { inquilino: true, unidad: { include: { edificio: true } } },
  });
  if (!contrato) notFound();
  await sincronizarCuotas();
  const [cuotas, pagos] = await Promise.all([
    cargarCuotas({ contratoId }),
    prisma.pago.findMany({ where: { cuota: { contratoId } }, include: { cuota: { select: { periodo: true, desde: true, hasta: true } } }, orderBy: { numero: "desc" } }),
  ]);
  const pendientes = cuotas.filter((c) => c.saldo > 0);
  const vencido = totalesPorMoneda(pendientes.filter((c) => c.estado === "Vencida"), (c) => c.saldo);
  const saldo = totalesPorMoneda(pendientes, (c) => c.saldo);
  const cobrar = puede(u, "cobros.registrar");
  const ajustar = puede(u, "cobros.anular");

  return (
    <>
      <Cabecera
        titulo={`${contrato.unidad.edificio.nombre} · ${contrato.unidad.codigo}`}
        sub={
          <>
            {contrato.inquilino.nombre}
            {contrato.inquilino.telefono ? ` · ${contrato.inquilino.telefono}` : ""} · Contrato del {formatoFecha(fechaISO(contrato.inicio))} al{" "}
            {formatoFecha(fechaISO(contrato.fin))} · {formatoDinero(num(contrato.renta), contrato.moneda)}/mes
            {contrato.diaPago ? `, paga el día ${contrato.diaPago}` : ""}
          </>
        }
      >
        <Link className="btn" href="/cobros">
          Volver a cobros
        </Link>
      </Cabecera>

      <div className="kpis">
        <div className={`kpi${vencido.BOB || vencido.USD ? " alert" : ""}`}>
          <div className="l">Vencido</div>
          <div className="v">
            <Montos t={vencido} />
          </div>
          <div className="s">{pendientes.filter((c) => c.estado === "Vencida").length} cuota(s)</div>
        </div>
        <div className="kpi">
          <div className="l">Saldo total</div>
          <div className="v">
            <Montos t={saldo} />
          </div>
          <div className="s">incluye lo que aún no vence</div>
        </div>
        <div className="kpi">
          <div className="l">Pagado</div>
          <div className="v">
            <Montos t={totalesPorMoneda(cuotas, (c) => c.pagado)} />
          </div>
          <div className="s">{pagos.filter((p) => !p.anulado).length} recibo(s)</div>
        </div>
      </div>

      <div className="card">
        <h2>Cuotas</h2>
        {!cuotas.length ? (
          <p className="sub">Todavía no hay cuotas: la primera se genera cuando empieza el contrato.</p>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Vence</th>
                  <th className="num">Monto</th>
                  <th className="num">Pagado</th>
                  <th className="num">Saldo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...cuotas].reverse().map((c) => (
                  <tr key={c.id}>
                    <td>
                      {formatoFecha(c.desde)} – {formatoFecha(c.hasta)}
                      {c.nota && <div className="sub">Ajuste: {c.nota}</div>}
                    </td>
                    <td>{formatoFecha(c.vencimiento)}</td>
                    <td className="num">{formatoDinero(c.monto, c.moneda)}</td>
                    <td className="num">{c.pagado ? formatoDinero(c.pagado, c.moneda) : "—"}</td>
                    <td className="num">{c.saldo ? <b>{formatoDinero(c.saldo, c.moneda)}</b> : "—"}</td>
                    <td>
                      <PillCuota estado={c.estado} dias={c.diasAtraso} />
                    </td>
                    <td className="act">
                      {c.saldo > 0 && cobrar && (
                        <Link className="btn sm primary" href={`/cobros/cuota/${c.id}`}>
                          Cobrar
                        </Link>
                      )}
                      {ajustar && c.saldo > 0 && (
                        <Link className="btn sm" href={`/cobros/cuota/${c.id}/ajustar`}>
                          Ajustar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Recibos</h2>
        {!pagos.length ? (
          <p className="sub">Sin pagos registrados.</p>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>N.º</th>
                  <th>Fecha</th>
                  <th>Período</th>
                  <th>Forma de pago</th>
                  <th className="num">Monto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{String(p.numero).padStart(6, "0")}</td>
                    <td>{formatoFecha(fechaISO(p.fecha))}</td>
                    <td>
                      {formatoFecha(fechaISO(p.cuota.desde))} – {formatoFecha(fechaISO(p.cuota.hasta))}
                    </td>
                    <td>
                      {p.metodo}
                      {p.referencia && <div className="sub">{p.referencia}</div>}
                    </td>
                    <td className="num">{p.anulado ? <s>{formatoDinero(num(p.monto), p.moneda)}</s> : formatoDinero(num(p.monto), p.moneda)}</td>
                    <td className="act">
                      {p.anulado && <span className="pill idle">Anulado</span>}{" "}
                      <Link className="btn sm" href={`/recibos/${p.id}`}>
                        Ver recibo
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!cuotas.length && !pagos.length && <Vacio titulo="Sin movimientos" />}
    </>
  );
}
