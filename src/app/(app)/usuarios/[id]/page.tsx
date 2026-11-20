import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { passwordTemporal } from "@/lib/seguridad";
import { FormAccion } from "@/components/FormAccion";
import { Aviso, BotonesForm, Cabecera, Campo } from "@/components/ui";
import { desbloquearUsuario, editarUsuario, restablecerPassword } from "../actions";

export default async function EditarUsuario({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ restablecida?: string }>;
}) {
  const yo = await requirePermiso("usuarios.administrar");
  const { id } = await params;
  const { restablecida } = await searchParams;
  const [x, roles] = await Promise.all([prisma.usuario.findUnique({ where: { id } }), prisma.rol.findMany({ orderBy: { nombre: "asc" } })]);
  if (!x) notFound();
  const bloqueado = x.bloqueadoHasta && x.bloqueadoHasta > new Date();
  return (
    <>
      <Cabecera titulo={x.nombre} sub={x.email} />
      {restablecida && <Aviso tipo="ok">Contraseña restablecida. Se cerraron sus sesiones abiertas.</Aviso>}
      {bloqueado && (
        <Aviso tipo="warn">
          Este usuario está bloqueado por intentos fallidos.
          <FormAccion action={desbloquearUsuario.bind(null, id)}>
            <button type="submit" className="btn sm">
              Desbloquear ahora
            </button>
          </FormAccion>
        </Aviso>
      )}
      <div className="form">
        <h2>Datos y rol</h2>
        <FormAccion action={editarUsuario.bind(null, id)}>
          <Campo nombre="nombre" etiqueta="Nombre completo" requerido completo valor={x.nombre} />
          <Campo nombre="email" etiqueta="Correo" tipo="email" requerido valor={x.email} />
          <Campo nombre="rolId" etiqueta="Rol" tipo="select" requerido opciones={roles.map((r) => [r.id, r.nombre])} valor={x.rolId} />
          <label className="chk full">
            <input type="checkbox" name="activo" defaultChecked={x.activo} disabled={x.id === yo.id} />
            Usuario activo (puede ingresar)
          </label>
          {x.id === yo.id && <input type="hidden" name="activo" value="on" />}
          <BotonesForm cancelar="/usuarios" />
        </FormAccion>
      </div>
      <div className="form">
        <h2>Restablecer contraseña</h2>
        <p className="full sub">Asigna una contraseña temporal nueva. La persona deberá cambiarla al ingresar y se cerrarán sus sesiones abiertas.</p>
        <FormAccion action={restablecerPassword.bind(null, id)} confirmar={`¿Restablecer la contraseña de ${x.nombre}?`}>
          <Campo nombre="password" etiqueta="Contraseña temporal nueva" requerido completo valor={passwordTemporal()} autoComplete="off" />
          <div className="acciones">
            <button type="submit" className="btn">
              Restablecer contraseña
            </button>
          </div>
        </FormAccion>
      </div>
    </>
  );
}
