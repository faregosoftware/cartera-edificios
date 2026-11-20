import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUsuario, puede } from "@/lib/auth";
import { menuPara } from "@/lib/menu";
import { cargarCartera } from "@/lib/cartera";
import { DIAS_AVISO, diasEntre, formatoDinero, formatoFecha } from "@/lib/negocio";
import { Barra, Cabecera, PillContrato, Vacio } from "@/components/ui";

export default async function Panel() {
  const u = await requireUsuario();
  if (!puede(u, "panel.ver")) {
    const primero = menuPara(u.permisos)[0];
    redirect(primero ? primero.href : "/sin-permiso");
  }
  const d = await cargarCartera();
  const sub = `Situación de la cartera al ${formatoFecha(d.hoy)}`;
  if (!d.edificios.length) {
    return (
      <>
        <Cabecera titulo="Panel" sub={sub} />
        <Vacio titulo="Tu cartera está vacía">
          <p>Empieza registrando tu primer edificio y luego sus unidades.</p>
          {puede(u, "edificios.crear") && (
            <Link className="btn primary" href="/edificios/nuevo">
              Registrar edificio
            </Link>
          )}
        </Vacio>
      </>
    );
  }
  const total = d.unidades.length;
  const ocupadas = d.unidades.filter((x) => x.actual);
  const bs = ocupadas.filter((x) => x.actual!.moneda === "BOB").reduce((s, x) => s + x.actual!.renta, 0);
  const usd = ocupadas.filter((x) => x.actual!.moneda === "USD").reduce((s, x) => s + x.actual!.renta, 0);
  const porVencer = d.contratos.filter((c) => c.estado === "Por vencer");
  const vencidos = d.contratos.filter((c) => c.estado === "Vencido");
  const pct = total ? Math.round((ocupadas.length * 100) / total) : 0;
  const atender = [...vencidos, ...porVencer].sort((a, b) => a.fin.localeCompare(b.fin)).slice(0, 8);
  const libres = d.unidades.filter((x) => !x.actual);

  return (
    <>
      <Cabecera titulo="Panel" sub={sub} />
      <div className="kpis">
        <div className="kpi">
          <div className="l">Ocupación</div>
          <div className="v">{pct}%</div>
          <div className="s">
            {ocupadas.length} de {total} unidades
          </div>
        </div>
        <div className="kpi">
          <div className="l">Renta mensual Bs</div>
          <div className="v">{formatoDinero(bs, "BOB")}</div>
          <div className="s">contratos en curso</div>
        </div>
        <div className="kpi">
          <div className="l">Renta mensual US$</div>
          <div className="v">{formatoDinero(usd, "USD")}</div>
          <div className="s">contratos en curso</div>
        </div>
        <div className={`kpi${porVencer.length ? " alert" : ""}`}>
          <div className="l">Por vencer</div>
          <div className="v">{porVencer.length}</div>
          <div className="s">en los próximos {DIAS_AVISO} días</div>
        </div>
        <div className={`kpi${vencidos.length ? " alert" : ""}`}>
          <div className="l">Vencidos</div>
          <div className="v">{vencidos.length}</div>
          <div className="s">sin renovar ni finalizar</div>
        </div>
      </div>

      <div className="card">
        <h2>Por edificio</h2>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Edificio</th>
                <th className="num">Unidades</th>
                <th className="num">Libres</th>
                <th>Ocupación</th>
                <th className="num">Renta Bs</th>
                <th className="num">Renta US$</th>
              </tr>
            </thead>
            <tbody>
              {d.edificios.map((e) => {
                const r = d.resumenEdificio(e.id);
                return (
                  <tr key={e.id}>
                    <td>
                      <Link className="link" href={`/unidades?edificio=${e.id}`}>
                        {e.nombre}
                      </Link>
                      <div className="sub">{e.direccion}</div>
                    </td>
                    <td className="num">{r.total}</td>
                    <td className="num">{r.libres}</td>
                    <td>
                      <Barra pct={r.pct} />
                    </td>
                    <td className="num">{r.bs ? formatoDinero(r.bs, "BOB") : "—"}</td>
                    <td className="num">{r.usd ? formatoDinero(r.usd, "USD") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Vencimientos a atender</h2>
          {atender.length ? (
            <div className="list">
              {atender.map((c) => {
                const n = diasEntre(d.hoy, c.fin);
                return (
                  <div className="it" key={c.id}>
                    <div>
                      <b>{d.nombreUnidad(c.unidadId)}</b>
                      <div className="sub">
                        {d.nombreInquilino(c.inquilinoId)} · vence {formatoFecha(c.fin)} ({n < 0 ? `hace ${-n} días` : `en ${n} días`})
                      </div>
                    </div>
                    <div className="row">
                      <PillContrato estado={c.estado} />
                      {puede(u, "contratos.renovar") && (
                        <Link className="btn sm" href={`/contratos/${c.id}/renovar`}>
                          Renovar
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sub">No hay contratos por vencer en los próximos {DIAS_AVISO} días.</p>
          )}
        </div>
        <div className="card">
          <h2>Unidades libres</h2>
          {libres.length ? (
            <div className="list">
              {libres.slice(0, 8).map((x) => (
                <div className="it" key={x.id}>
                  <div>
                    <b>
                      {x.edificio} · {x.codigo}
                    </b>
                    <div className="sub">
                      {x.tipo}
                      {x.superficie ? ` · ${x.superficie} m²` : ""}
                      {x.rentaReferencia ? ` · ref. ${formatoDinero(x.rentaReferencia, x.monedaReferencia)}` : ""}
                    </div>
                  </div>
                  {puede(u, "contratos.crear") && (
                    <Link className="btn sm" href={`/contratos/nuevo?unidad=${x.id}`}>
                      Alquilar
                    </Link>
                  )}
                </div>
              ))}
              {libres.length > 8 && (
                <div className="it">
                  <Link className="link" href="/unidades?estado=libre">
                    Ver las {libres.length} unidades libres
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="sub">Todas las unidades están ocupadas.</p>
          )}
        </div>
      </div>
    </>
  );
}
