"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUsuario, hashPassword, validarPassword, cerrarSesionesDe } from "@/lib/auth";
import type { Resultado } from "@/lib/formularios";

export async function cambiarMiPassword(fd: FormData): Promise<Resultado> {
  const u = await requireUsuario({ permitirPasswordTemporal: true });
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const repetir = String(fd.get("repetir") ?? "");
  const reg = await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await bcrypt.compare(actual, reg.passwordHash))) return { error: "La contraseña actual no es correcta." };
  const problema = validarPassword(nueva);
  if (problema) return { error: problema };
  if (nueva !== repetir) return { error: "Las contraseñas nuevas no coinciden." };
  if (nueva === actual) return { error: "La contraseña nueva debe ser distinta de la actual." };
  await prisma.usuario.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(nueva), debeCambiarPassword: false } });
  await cerrarSesionesDe(u.id, "actual"); // cierra las demás sesiones abiertas
  redirect(u.debeCambiarPassword ? "/" : "/cuenta?ok=1");
}
