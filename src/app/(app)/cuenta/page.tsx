import { requireUsuario, LARGO_MINIMO_PASSWORD } from "@/lib/auth";
import { FormAccion } from "@/components/FormAccion";
import { Aviso, Cabecera, Campo } from "@/components/ui";
import { cambiarMiPassword } from "./actions";

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const u = await requireUsuario({ permitirPasswordTemporal: true });
  const { ok } = await searchParams;
  return (
    <>
      <Cabecera titulo="Mi cuenta" sub={`${u.nombre} · ${u.email} · Rol: ${u.rol.nombre}`} />
      {u.debeCambiarPassword && (
        <Aviso tipo="warn">Tu contraseña es temporal. Cámbiala para empezar a usar la app.</Aviso>
      )}
      {ok && <Aviso tipo="ok">Contraseña actualizada.</Aviso>}
      <div className="form">
        <h2 className="full">Cambiar contraseña</h2>
        <FormAccion action={cambiarMiPassword}>
          <Campo nombre="actual" etiqueta="Contraseña actual" tipo="password" requerido completo autoComplete="current-password" />
          <Campo
            nombre="nueva"
            etiqueta="Contraseña nueva"
            tipo="password"
            requerido
            autoComplete="new-password"
            ayuda={`Mínimo ${LARGO_MINIMO_PASSWORD} caracteres, con letras y números.`}
          />
          <Campo nombre="repetir" etiqueta="Repite la contraseña nueva" tipo="password" requerido autoComplete="new-password" />
          <div className="acciones full">
            <button type="submit" className="btn primary">
              Cambiar contraseña
            </button>
          </div>
        </FormAccion>
      </div>
    </>
  );
}
