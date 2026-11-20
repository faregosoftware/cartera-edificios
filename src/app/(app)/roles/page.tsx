import Link from "next/link";
import { requirePermiso } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULOS } from "@/lib/permisos";
import { Cabecera } from "@/components/ui";

export default async function Roles() {
  await requirePermiso("roles.administrar");
  const roles = await prisma.rol.findMany({ include: { _count: { select: { usuarios: true } } }, orderBy: { nombre: "asc" } });
  return (
    <>
      <Cabecera titulo="Roles y permisos" sub="Cada usuario tiene un rol; el rol define qué funciones puede usar.">
        <Link className="btn primary" href="/roles/nuevo">
          Nuevo rol
        </Link>
      </Cabecera>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              {MODULOS.map((m) => (
                <th key={m.clave}>{m.nombre}</th>
              ))}
              <th className="num">Usuarios</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.nombre}</b>
                  {r.descripcion && <div className="sub">{r.descripcion}</div>}
                </td>
                {MODULOS.map((m) => {
                  const n = m.acciones.filter((a) => r.permisos.includes(`${m.clave}.${a.clave}`)).length;
                  const cls = n === 0 ? "idle" : n === m.acciones.length ? "ok" : "warn";
                  const txt = n === 0 ? "Sin acceso" : n === m.acciones.length ? "Total" : `${n} de ${m.acciones.length}`;
                  return (
                    <td key={m.clave}>
                      <span className={`pill ${cls}`}>{txt}</span>
                    </td>
                  );
                })}
                <td className="num">{r._count.usuarios}</td>
                <td className="act">
                  <Link className="btn sm" href={`/roles/${r.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
