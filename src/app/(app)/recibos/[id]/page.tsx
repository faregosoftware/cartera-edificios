import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermiso, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fechaISO, num } from "@/lib/convertir";
import { montoEnLetras, redondear } from "@/lib/cobros";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { FormAccion } from "@/components/FormAccion";
import { Aviso, Campo } from "@/components/ui";
import { BotonImprimir } from "@/components/BotonImprimir";
import { datosEmpresa } from "@/lib/empresa";
import { anularPago } from "../../cobros/actions";

export default async function Recibo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const u = await requirePermiso("cobros.ver");
  const { id } = await params;
  const { nuevo } = await searchParams;
  const p = await prisma.pago.findUnique({
    where: { id },
    include: {
      registradoPor: { select: { nombre: true } },
      anuladoPor: { select: { nombre: true } },
      cuota: {
        include: {
          pagos: { where: { anulado: false }, select: { monto: true, numero: true } },
          contrato: { include: { inquilino: true, unidad: { include: { edificio: true } } } },
        },
      },
    },
  });
  if (!p) notFound();
  const c = p.cuota.contrato;
  const monto = num(p.monto)!;
  // Saldo que quedó después de este pago (no cambia si se reimprime más tarde).
  const pagadoHastaAqui = p.cuota.pagos.filter((x) => x.numero <= p.numero).reduce((s, x) => s + Number(x.monto), 0) + (p.anulado ? monto : 0);
  const saldo = redondear(Math.max(0, Number(p.cuota.monto) - pagadoHastaAqui));
  const empresa = datosEmpresa();
  const numero = String(p.numero).padStart(6, "0");

  return (
    <>
      <div className="head noprint">
        <div>
          <h1>Recibo N.º {numero}</h1>
          <p>
            <Link className="link" href={`/cobros/${c.id}`}>
              Estado de cuenta de {c.inquilino.nombre}
            </Link>
          </p>
        </div>
        <div className="row">
          {!p.anulado && <BotonImprimir />}
          <Link className="btn" href="/cobros">
            Volver a cobros
          </Link>
        </div>
      </div>
      {nuevo && (
        <div className="noprint">
          <Aviso tipo="ok">Pago registrado. Imprime el recibo o guárdalo como PDF desde la ventana de impresión.</Aviso>
        </div>
      )}
      {p.anulado && (
        <Aviso tipo="warn">
          Recibo anulado el {p.anuladoEl?.toLocaleDateString("es-BO", { timeZone: process.env.APP_TZ || "America/La_Paz" })}
          {p.anuladoPor ? ` por ${p.anuladoPor.nombre}` : ""}. Motivo: {p.anuladoMotivo}
        </Aviso>
      )}

      <article className={`recibo${p.anulado ? " anulado" : ""}`} aria-label={`Recibo ${numero}`}>
        <header>
          <div>
            <h2>{empresa.nombre}</h2>
            <div className="sub">
              {[empresa.nit && `NIT ${empresa.nit}`, empresa.direccion, empresa.telefono && `Tel. ${empresa.telefono}`].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="nro">
            <div className="l">RECIBO</div>
            <div className="n">N.º {numero}</div>
            <div className="monto">{formatoDinero(monto, p.moneda)}</div>
          </div>
        </header>
        <dl>
          <dt>Fecha</dt>
          <dd>{formatoFecha(fechaISO(p.fecha))}</dd>
          <dt>Recibí de</dt>
          <dd>
            <b>{c.inquilino.nombre}</b>
            {c.inquilino.documento ? ` · ${c.inquilino.tipoDoc} ${c.inquilino.documento}` : ""}
          </dd>
          <dt>La suma de</dt>
          <dd>
            <b>{montoEnLetras(monto, p.moneda)}</b>
          </dd>
          <dt>Por concepto de</dt>
          <dd>
            Alquiler de {c.unidad.tipo.toLowerCase()} {c.unidad.codigo}, {c.unidad.edificio.nombre}
            {c.unidad.edificio.direccion ? ` (${c.unidad.edificio.direccion})` : ""}, período del {formatoFecha(fechaISO(p.cuota.desde))} al{" "}
            {formatoFecha(fechaISO(p.cuota.hasta))}
            {monto < Number(p.cuota.monto) ? ` — pago a cuenta de ${formatoDinero(num(p.cuota.monto), p.moneda)}` : ""}.
          </dd>
          <dt>Forma de pago</dt>
          <dd>
            {p.metodo}
            {p.referencia ? ` · Ref. ${p.referencia}` : ""}
          </dd>
          {p.notas && (
            <>
              <dt>Notas</dt>
              <dd>{p.notas}</dd>
            </>
          )}
          <dt>Saldo del período</dt>
          <dd>{saldo > 0 ? formatoDinero(saldo, p.moneda) : "Cancelado"}</dd>
        </dl>
        <footer>
          <div className="firma">
            <span />
            Recibí conforme
            <small>{p.registradoPor.nombre}</small>
          </div>
          <div className="firma">
            <span />
            Entregué conforme
            <small>{c.inquilino.nombre}</small>
          </div>
        </footer>
        {p.anulado && <div className="sello">ANULADO</div>}
      </article>

      {!p.anulado && puede(u, "cobros.anular") && (
        <div className="form noprint">
          <h2>Anular recibo</h2>
          <p className="full sub">El recibo queda en el historial marcado como anulado y su monto vuelve a quedar pendiente en la cuota.</p>
          <FormAccion action={anularPago.bind(null, id)} confirmar={`¿Anular el recibo N.º ${numero}?`}>
            <Campo nombre="motivo" etiqueta="Motivo" requerido completo />
            <div className="acciones">
              <button type="submit" className="btn danger">
                Anular recibo
              </button>
            </div>
          </FormAccion>
        </div>
      )}
    </>
  );
}
