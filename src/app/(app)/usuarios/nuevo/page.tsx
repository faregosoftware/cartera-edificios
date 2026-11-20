import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { passwordTemporal } from "@/lib/seguridad";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, Campo } from "@/components/ui";
import { crearUsuario } from "../actions";

export default async function NuevoUsuario() {
  await requirePermiso("usuarios.administrar");
  const roles = await prisma.rol.findMany({ orderBy: { nombre: "asc" } });
  const operador = roles.find((r) => r.nombre === "Operador");
  return (
    <>
      <Cabecera titulo="Nuevo usuario" sub="La persona ingresará con este correo y una contraseña temporal que deberá cambiar." />
      <div className="form">
        <FormAccion action={crearUsuario}>
          <Campo nombre="nombre" etiqueta="Nombre completo" requerido completo />
          <Campo nombre="email" etiqueta="Correo" tipo="email" requerido autoComplete="off" />
          <Campo nombre="rolId" etiqueta="Rol" tipo="select" requerido opciones={roles.map((r) => [r.id, r.nombre])} valor={operador?.id} />
          <Campo
            nombre="password"
            etiqueta="Contraseña temporal"
            requerido
            completo
            valor={passwordTemporal()}
            autoComplete="off"
            ayuda="Generada al azar. Cópiala y entrégasela a la persona por un medio seguro."
          />
          <BotonesForm cancelar="/usuarios" texto="Crear usuario" />
        </FormAccion>
      </div>
    </>
  );
}
