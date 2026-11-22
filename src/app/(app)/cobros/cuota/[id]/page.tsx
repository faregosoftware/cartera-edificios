import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { hoyApp } from "@/lib/cartera";
import { cargarCuotas } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/cobros";
import { formatoDinero, formatoFecha } from "@/lib/negocio";
import { FormAccion } from "@/components/FormAccion";
import { Aviso, BotonesForm, Cabecera, Campo, Vacio } from "@/components/ui";
import { PillCuota } from "@/components/cobros";
import { registrarPago } from "../../actions";

export default async function RegistrarPago({ params }: { params: Promise<{ id: string }> }) {
  await requirePermiso("cobros.registrar");
  const { id } = await params;
  const [c] = await cargarCuotas({ id });
  if (!c) notFound();
  if (c.saldo <= 0) return <Vacio titulo="Esta cuota ya está pagada" />;
  const otrasVencidas = (await cargarCuotas({ contratoId: c.contratoId })).filter((x) => x.id !== c.id && x.estado === "Vencida" && x.vencimiento < c.vencimiento);
  return (
    <>
      <Cabecera titulo="Registrar pago" sub={`${c.unidad} · ${c.inquilino}`} />
      {otrasVencidas.length > 0 && (
        <Aviso tipo="warn">
          Este contrato tiene {otrasVencidas.length} cuota(s) más antiguas sin pagar, la primera vencida el {formatoFecha(otrasVencidas[0].vencimiento)}.
        </Aviso>
      )}
      <div className="kpis">
        <div className="kpi">
          <div className="l">Período</div>
          <div className="v" style={{ fontSize: 18 }}>
            {formatoFecha(c.desde)} – {formatoFecha(c.hasta)}
          </div>
          <div className="s">
            Vence {formatoFecha(c.vencimiento)} <PillCuota estado={c.estado} dias={c.diasAtraso} />
          </div>
        </div>
        <div className="kpi">
          <div className="l">Cuota</div>
          <div className="v">{formatoDinero(c.monto, c.moneda)}</div>
          <div className="s">pagado {formatoDinero(c.pagado, c.moneda)}</div>
        </div>
        <div className="kpi alert">
          <div className="l">Saldo</div>
          <div className="v">{formatoDinero(c.saldo, c.moneda)}</div>
          <div className="s">puedes cobrar todo o una parte</div>
        </div>
      </div>
      <div className="form">
        <FormAccion action={registrarPago.bind(null, id)}>
          <Campo nombre="monto" etiqueta={`Monto recibido (${c.moneda === "USD" ? "US$" : "RD$"})`} tipo="number" requerido min={0.01} max={c.saldo} valor={c.saldo} />
          <Campo nombre="fecha" etiqueta="Fecha del pago" tipo="date" requerido valor={hoyApp()} />
          <Campo nombre="metodo" etiqueta="Forma de pago" tipo="select" requerido opciones={METODOS_PAGO} valor="Efectivo" />
          <Campo nombre="referencia" etiqueta="N.º de transacción o cheque" ayuda="Para transferencias, QR, depósitos o cheques." />
          <Campo nombre="notas" etiqueta="Notas" tipo="textarea" completo />
          <BotonesForm cancelar={`/cobros/${c.contratoId}`} texto="Registrar pago y emitir recibo" />
        </FormAccion>
      </div>
    </>
  );
}
