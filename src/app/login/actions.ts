"use server";
import { redirect } from "next/navigation";
import { iniciarSesion, cerrarSesion } from "@/lib/auth";
import type { Resultado } from "@/lib/formularios";

export async function entrar(fd: FormData): Promise<Resultado> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };
  const r = await iniciarSesion(email, password);
  if (!r.ok) return { error: r.error };
  redirect("/");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
