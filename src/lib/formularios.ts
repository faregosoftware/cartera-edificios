// Lectura y validación de formularios con zod. Los mensajes de error están en español.
import { z } from "zod";
import { esFechaValida } from "./negocio";

export type Resultado = { error: string } | void;

const vacioANull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v);

export const textoOpcional = z.preprocess(vacioANull, z.string().max(500).nullable().default(null));
export const textoRequerido = (campo: string) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string({ required_error: `Completa ${campo}.` }).min(1, `Completa ${campo}.`).max(200));
export const numeroOpcional = (campo: string) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number({ invalid_type_error: `${campo} debe ser un número.` }).min(0, `${campo} no puede ser negativo.`).nullable(),
  );
export const numeroRequerido = (campo: string) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ required_error: `Completa ${campo}.`, invalid_type_error: `${campo} debe ser un número.` }).min(0, `${campo} no puede ser negativo.`),
  );
export const enteroOpcional = (campo: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int(`${campo} debe ser un número entero.`).min(min, `${campo} debe estar entre ${min} y ${max}.`).max(max, `${campo} debe estar entre ${min} y ${max}.`).nullable(),
  );
export const fecha = (campo: string) =>
  z.string({ required_error: `Indica ${campo}.` }).refine(esFechaValida, `Indica una fecha válida para ${campo}.`);
export const moneda = z.enum(["DOP", "USD"]).default("DOP");

export function leer<T extends z.ZodTypeAny>(esquema: T, fd: FormData): { ok: true; datos: z.infer<T> } | { ok: false; error: string } {
  const r = esquema.safeParse(Object.fromEntries(fd.entries()));
  if (r.success) return { ok: true, datos: r.data };
  return { ok: false, error: r.error.issues[0]?.message ?? "Revisa los datos del formulario." };
}

/** Convierte errores conocidos de Prisma en mensajes entendibles. */
export function errorPrisma(e: unknown, mensajes: { unico?: string; relacion?: string } = {}): string | null {
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return mensajes.unico ?? "Ya existe un registro con esos datos.";
  if (code === "P2003") return mensajes.relacion ?? "No se puede eliminar porque tiene registros relacionados.";
  if (code === "P2025") return "El registro ya no existe. Recarga la página.";
  return null;
}
