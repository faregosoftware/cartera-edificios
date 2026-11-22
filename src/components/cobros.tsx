import type { EstadoCuota } from "@/lib/cobros";
import { formatoDinero } from "@/lib/negocio";

const CLASE: Record<EstadoCuota, string> = {
  Pagada: "ok",
  Vencida: "bad",
  "Vence hoy": "warn",
  "Por vencer": "info",
  "Pago parcial": "warn",
};

export function PillCuota({ estado, dias }: { estado: EstadoCuota; dias?: number }) {
  return (
    <span className={`pill ${CLASE[estado]}`}>
      {estado}
      {estado === "Vencida" && dias ? ` · ${dias} d` : ""}
    </span>
  );
}

/** "RD$ 3,200 · US$ 650", o "—" si ambos son cero. */
export function Montos({ t }: { t: { DOP: number; USD: number } }) {
  const partes = [t.DOP ? formatoDinero(t.DOP, "DOP") : null, t.USD ? formatoDinero(t.USD, "USD") : null].filter(Boolean);
  return <>{partes.length ? partes.join(" · ") : "—"}</>;
}
