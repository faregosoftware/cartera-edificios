// Ayudas para administrar usuarios y roles sin dejar el sistema sin administradores.
import { randomInt } from "node:crypto";
import { prisma } from "./db";

/** Contraseña temporal legible: sin letras ni números que se confundan (0/O, 1/l/I). */
export function passwordTemporal(): string {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const elegir = (s: string, n: number) => Array.from({ length: n }, () => s[randomInt(s.length)]).join("");
  return `${elegir(letras, 4)}-${elegir(numeros, 4)}-${elegir(letras, 4)}`;
}

/**
 * ¿Seguirá habiendo al menos un usuario activo que pueda administrar usuarios
 * si excluimos al usuario o al rol indicados?
 */
export async function quedaOtroAdministrador(excluir: { usuarioId?: string; rolId?: string }): Promise<boolean> {
  const n = await prisma.usuario.count({
    where: {
      activo: true,
      rol: { permisos: { has: "usuarios.administrar" } },
      ...(excluir.usuarioId ? { id: { not: excluir.usuarioId } } : {}),
      ...(excluir.rolId ? { rolId: { not: excluir.rolId } } : {}),
    },
  });
  return n > 0;
}
