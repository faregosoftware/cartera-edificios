import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { Vacio } from "@/components/ui";

export default async function SinPermiso() {
  const u = await requireUsuario();
  return (
    <Vacio titulo="No tienes permiso para esto">
      <p>
        Tu rol es <b>{u.rol.nombre}</b> y no incluye esta función. Si la necesitas, pídesela al administrador.
      </p>
      <Link className="btn" href="/">
        Volver al inicio
      </Link>
    </Vacio>
  );
}
