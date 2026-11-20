import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposRol } from "../CamposRol";
import { editarRol, eliminarRol } from "../actions";

export default async function EditarRol({ params }: { params: Promise<{ id: string }> }) {
  await requirePermiso("roles.administrar");
  const { id } = await params;
  const rol = await prisma.rol.findUnique({ where: { id } });
  if (!rol) notFound();
  return (
    <>
      <Cabecera titulo={`Rol ${rol.nombre}`} sub="Los cambios se aplican de inmediato a todos los usuarios con este rol.">
        {!rol.sistema && (
          <FormAccion action={eliminarRol.bind(null, id)} confirmar={`¿Eliminar el rol ${rol.nombre}?`}>
            <button type="submit" className="btn danger">
              Eliminar rol
            </button>
          </FormAccion>
        )}
      </Cabecera>
      <div className="form">
        <FormAccion action={editarRol.bind(null, id)}>
          <CamposRol v={rol} bloqueado={rol.sistema} />
          <BotonesForm cancelar="/roles" />
        </FormAccion>
      </div>
    </>
  );
}
