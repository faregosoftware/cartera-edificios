import { notFound, redirect } from "next/navigation";
import { requireUsuario, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposInquilino } from "../CamposInquilino";
import { editarInquilino, eliminarInquilino } from "../actions";

export default async function EditarInquilino({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUsuario();
  if (!puede(u, "inquilinos.editar") && !puede(u, "inquilinos.eliminar")) redirect("/sin-permiso");
  const { id } = await params;
  const i = await prisma.inquilino.findUnique({ where: { id } });
  if (!i) notFound();
  return (
    <>
      <Cabecera titulo={i.nombre}>
        {puede(u, "inquilinos.eliminar") && (
          <FormAccion action={eliminarInquilino.bind(null, id)} confirmar={`¿Eliminar a ${i.nombre}?`}>
            <button type="submit" className="btn danger">
              Eliminar inquilino
            </button>
          </FormAccion>
        )}
      </Cabecera>
      {puede(u, "inquilinos.editar") && (
        <div className="form">
          <FormAccion action={editarInquilino.bind(null, id)}>
            <CamposInquilino v={i} />
            <BotonesForm cancelar="/inquilinos" />
          </FormAccion>
        </div>
      )}
    </>
  );
}
