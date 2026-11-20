// Conversión entre los tipos de Prisma (Decimal, Date) y los de la app (number, "AAAA-MM-DD").
import type { Prisma } from "@prisma/client";

export function fechaISO(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** "AAAA-MM-DD" a Date en medianoche UTC, que es como Prisma guarda las columnas DATE. */
export function deFechaISO(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function num(x: Prisma.Decimal | number | null | undefined): number | null {
  return x == null ? null : Number(x);
}
