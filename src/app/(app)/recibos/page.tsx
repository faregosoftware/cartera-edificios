import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hoyApp } from "@/lib/cartera";
import { deFechaISO, fechaISO, num } from "@/lib/convertir";
import { METODOS_PAGO } from "@/lib/cobros";
import { esFechaValida, formatoDinero, formatoFecha } from "@/lib/negocio";
import { Cabecera, Vacio } from "@/components/ui";
import { Montos } from "@/components/cobros";
import { totalesPorMoneda } from "@/lib/cuentas";

export default async function Recibos({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string; metodo?: string; anulados?: string }> }) {
  await requirePermiso("cobros.ver");
  const f = await searchParams;
  const hoy = hoyApp();
  const desde = esFechaValida(f.desde) ? f.desde : `${hoy.slice(0, 7)}-01`;
  const hasta = esFechaValida(f.hasta) ? f.hasta : hoy;
  const where: Prisma.PagoWhereInput = {
    fecha: { gte: deFechaISO(desde), lte: deFechaISO(hasta) },
    ...(f.metodo ? { metodo: f.metodo } : {}),
    ...(f.anulados ? {} : { anulado: false }),
  };
  const pagos = await prisma.pago.findMany({
    where,
    include: {
      registradoPor: { select: { nombre: true } },
      cuota: { select: { desde: true, hasta: true, contrato: { select: { inquilino: { select: { nombre: true } }, unidad: { select: { codigo: true, edificio: { select: { nombre: true } } } } } } } },
    },
    orderBy: { numero: "desc" },
  });
  const validos = pagos.filter((p) => !p.anulado).map((p) => ({ moneda: p.moneda, monto: num(p.monto)! }));
  const total = totalesPorMoneda(validos, (p) => p.monto);
  const porMetodo = METODOS_PAGO.map((m) => ({
    m,
    t: totalesPorMoneda(
      pagos.filter((p) => !p.anulado && p.metodo === m).map((p) => ({ moneda: p.moneda, monto: num(p.monto)! })),
      (p) => p.monto,
    ),
  })).filter((x) => x.t.DOP || x.t.USD);

  return (
    <>
      <Cabecera titulo="Recibos" sub={`Pagos cobrados del ${formatoFecha(desde)} al ${formatoFecha(hasta)}`} />
      <form className="filters" method="get">
        <label className="chk">
          Desde <input type="date" name="desde" defaultValue={desde} />
        </label>
        <label className="chk">
          Hasta <input type="date" name="hasta" defaultValue={hasta} />
        </label>
        <select name="metodo" defaultValue={f.metodo ?? ""} aria-label="Forma de pago">
          <option value="">Todas las formas de pago</option>
          {METODOS_PAGO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label className="chk">
          <input type="checkbox" name="anulados" value="1" defaultChecked={!!f.anulados} /> Incluir anulados
        </label>
        <button className="btn" type="submit">
          Filtrar
        </button>
      </form>
      <div className="kpis">
        <div className="kpi">
          <div className="l">Total cobrado</div>
          <div className="v">
            <Montos t={total} />
          </div>
          <div className="s">{validos.length} recibo(s)</div>
        </div>
        {porMetodo.map((x) => (
          <div className="kpi" key={x.m}>
            <div className="l">{x.m}</div>
            <div className="v" style={{ fontSize: 20 }}>
              <Montos t={x.t} />
            </div>
          </div>
        ))}
      </div>
      {!pagos.length ? (
        <Vacio titulo="No hay recibos en ese rango" />
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>N.º</th>
                <th>Fecha</th>
                <th>Inquilino</th>
                <th>Unidad</th>
                <th>Período</th>
                <th>Forma de pago</th>
                <th className="num">Monto</th>
                <th>Cobró</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td>{String(p.numero).padStart(6, "0")}</td>
                  <td>{formatoFecha(fechaISO(p.fecha))}</td>
                  <td>{p.cuota.contrato.inquilino.nombre}</td>
                  <td>
                    {p.cuota.contrato.unidad.edificio.nombre} · {p.cuota.contrato.unidad.codigo}
                  </td>
                  <td>
                    {formatoFecha(fechaISO(p.cuota.desde))} – {formatoFecha(fechaISO(p.cuota.hasta))}
                  </td>
                  <td>{p.metodo}</td>
                  <td className="num">{p.anulado ? <s>{formatoDinero(num(p.monto), p.moneda)}</s> : formatoDinero(num(p.monto), p.moneda)}</td>
                  <td className="sub">{p.registradoPor.nombre}</td>
                  <td className="act">
                    {p.anulado && <span className="pill idle">Anulado</span>}{" "}
                    <Link className="btn sm" href={`/recibos/${p.id}`}>
                      Ver
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
