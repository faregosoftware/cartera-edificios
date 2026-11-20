// Piezas de interfaz compartidas (componentes de servidor).
import Link from "next/link";
import type { ReactNode } from "react";
import type { EstadoContrato } from "@/lib/negocio";

type Opcion = string | [string, string];

export function Campo({
  nombre,
  etiqueta,
  tipo = "text",
  valor,
  requerido,
  opciones,
  vacio,
  completo,
  min,
  max,
  paso,
  ayuda,
  autoComplete,
}: {
  nombre: string;
  etiqueta: string;
  tipo?: "text" | "email" | "tel" | "number" | "date" | "password" | "select" | "textarea";
  valor?: string | number | null;
  requerido?: boolean;
  opciones?: readonly Opcion[];
  vacio?: string;
  completo?: boolean;
  min?: number;
  max?: number;
  paso?: number | "any";
  ayuda?: string;
  autoComplete?: string;
}) {
  const id = `f-${nombre}`;
  const v = valor ?? "";
  let control: ReactNode;
  if (tipo === "select") {
    control = (
      <select id={id} name={nombre} defaultValue={String(v)} required={requerido}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {(opciones ?? []).map((o) => {
          const [ov, ol] = Array.isArray(o) ? o : [o, o];
          return (
            <option key={ov} value={ov}>
              {ol}
            </option>
          );
        })}
      </select>
    );
  } else if (tipo === "textarea") {
    control = <textarea id={id} name={nombre} defaultValue={String(v)} />;
  } else {
    control = (
      <input
        id={id}
        name={nombre}
        type={tipo}
        defaultValue={String(v)}
        required={requerido}
        min={min}
        max={max}
        step={tipo === "number" ? (paso ?? "any") : undefined}
        autoComplete={autoComplete}
      />
    );
  }
  return (
    <div className={`fld${completo ? " full" : ""}`}>
      <label htmlFor={id}>
        {etiqueta}
        {requerido ? " *" : ""}
      </label>
      {control}
      {ayuda && <small className="sub">{ayuda}</small>}
    </div>
  );
}

export function Cabecera({ titulo, sub, children }: { titulo: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="head">
      <div>
        <h1>{titulo}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function BotonesForm({ cancelar, texto = "Guardar" }: { cancelar: string; texto?: string }) {
  return (
    <div className="acciones full">
      <Link className="btn" href={cancelar}>
        Cancelar
      </Link>
      <button type="submit" className="btn primary">
        {texto}
      </button>
    </div>
  );
}

const CLASE_ESTADO: Record<EstadoContrato, string> = {
  Vigente: "ok",
  "Por vencer": "warn",
  Vencido: "bad",
  Finalizado: "idle",
  Futuro: "info",
};
export function PillContrato({ estado }: { estado: EstadoContrato }) {
  return <span className={`pill ${CLASE_ESTADO[estado]}`}>{estado}</span>;
}

export function Barra({ pct }: { pct: number }) {
  return (
    <div className="occ">
      <div className="bar" role="img" aria-label={`${pct}% ocupado`}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="card empty">
      <h2>{titulo}</h2>
      {children}
    </div>
  );
}

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "warn" | "ok"; children: ReactNode }) {
  return <div className={`banner ${tipo}`}>{children}</div>;
}
