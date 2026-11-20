import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FormAccion } from "@/components/FormAccion";
import { BotonesForm, Cabecera, Vacio } from "@/components/ui";
import { CamposUnidad } from "../CamposUnidad";
import { crearUnidad } from "../actions";

export default async function NuevaUnidad({ searchParams }: { searchParams: Promise<{ edificio?: string }> }) {
  await requirePermiso("unidades.crear");
  const { edificio } = await searchParams;
  const edificios = await prisma.edificio.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } });
  if (!edificios.length) return <Vacio titulo="Primero registra un edificio" />;
  return (
    <>
      <Cabecera titulo="Nueva unidad" />
      <div className="form">
        <FormAccion action={crearUnidad}>
          <CamposUnidad edificios={edificios} v={{ edificioId: edificio }} />
          <BotonesForm cancelar="/unidades" texto="Registrar unidad" />
        </FormAccion>
      </div>
    </>
  );
}
