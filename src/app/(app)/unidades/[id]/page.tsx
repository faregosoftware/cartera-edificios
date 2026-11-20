import { notFound, redirect } from "next/navigation";
import { requireUsuario, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { num } from "@/lib/convertir";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera } from "@/components/ui";
import { CamposUnidad } from "../CamposUnidad";
import { editarUnidad, eliminarUnidad } from "../actions";

export default async function EditarUnidad({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUsuario();
  if (!puede(u, "unidades.editar") && !puede(u, "unidades.eliminar")) redirect("/sin-permiso");
  const { id } = await params;
  const [x, edificios] = await Promise.all([
    prisma.unidad.findUnique({ where: { id }, include: { edificio: true } }),
    prisma.edificio.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);
  if (!x) notFound();
  const valores = { ...x, superficie: num(x.superficie), rentaReferencia: num(x.rentaReferencia) };
  return (
    <>
      <Cabecera titulo={`Unidad ${x.codigo}`} sub={x.edificio.nombre}>
        {puede(u, "unidades.eliminar") && (
          <FormAccion action={eliminarUnidad.bind(null, id)} confirmar={`¿Eliminar la unidad ${x.codigo}?`}>
            <button type="submit" className="btn danger">
              Eliminar unidad
            </button>
          </FormAccion>
        )}
      </Cabecera>
      {puede(u, "unidades.editar") && (
        <div className="form">
          <FormAccion action={editarUnidad.bind(null, id)}>
            <CamposUnidad edificios={edificios} v={valores} />
            <BotonesForm cancelar="/unidades" />
          </FormAccion>
        </div>
      )}
    </>
  );
}
