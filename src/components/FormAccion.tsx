"use client";
// Formulario que llama a una acción del servidor y muestra su error sin perder lo escrito.
import { useState, useTransition, type ReactNode } from "react";

type Accion = (fd: FormData) => Promise<{ error: string } | void>;

export function FormAccion({
  action,
  children,
  className,
  confirmar,
}: {
  action: Accion;
  children: ReactNode;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmar?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, start] = useTransition();
  return (
    <form
      className={className}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmar && !window.confirm(confirmar)) return;
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const r = await action(fd);
          if (r && "error" in r) setError(r.error);
        });
      }}
    >
      <fieldset disabled={pendiente} className="fs">
        {children}
      </fieldset>
      {error && (
        <div className="err" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
