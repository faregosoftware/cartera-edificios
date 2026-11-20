"use client";

export function BotonImprimir({ texto = "Imprimir recibo" }: { texto?: string }) {
  return (
    <button type="button" className="btn primary" onClick={() => window.print()}>
      {texto}
    </button>
  );
}
