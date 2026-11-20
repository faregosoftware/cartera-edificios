import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { Campo } from "@/components/ui";
import { entrar } from "./actions";

export const metadata = { title: "Ingresar · Cartera de Edificios" };

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/");
  return (
    <div className="login">
      <div className="card">
        <div>
          <h1>Cartera de Edificios</h1>
          <p className="sub">Ingresa con tu correo y contraseña.</p>
        </div>
        <FormAccion action={entrar}>
          <Campo nombre="email" etiqueta="Correo" tipo="email" requerido autoComplete="username" />
          <Campo nombre="password" etiqueta="Contraseña" tipo="password" requerido autoComplete="current-password" />
          <button type="submit" className="btn primary">
            Ingresar
          </button>
        </FormAccion>
        <p className="sub">¿Olvidaste tu contraseña? Pide al administrador que te asigne una nueva.</p>
      </div>
    </div>
  );
}
