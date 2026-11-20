import { notFound } from "next/navigation";
import { requireUsuario, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposEdificio } from "../CamposEdificio";
import { editarEdificio, eliminarEdificio } from "../actions";
import { redirect } from "next/navigation";

export default async function EditarEdificio({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUsuario();
  if (!puede(u, "edificios.editar") && !puede(u, "edificios.eliminar")) redirect("/sin-permiso");
  const { id } = await params;
  const e = await prisma.edificio.findUnique({ where: { id } });
  if (!e) notFound();
  return (
    <>
      <Cabecera titulo={puede(u, "edificios.editar") ? "Editar edificio" : e.nombre}>
        {puede(u, "edificios.eliminar") && (
          <FormAccion action={eliminarEdificio.bind(null, id)} confirmar={`¿Eliminar ${e.nombre}? No se puede deshacer.`}>
            <button type="submit" className="btn danger">
              Eliminar edificio
            </button>
          </FormAccion>
        )}
      </Cabecera>
      {puede(u, "edificios.editar") && (
        <div className="form">
          <FormAccion action={editarEdificio.bind(null, id)}>
            <CamposEdificio v={e} />
            <BotonesForm cancelar="/edificios" />
          </FormAccion>
        </div>
      )}
    </>
  );
}
