import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Aviso, Cabecera } from "@/components/ui";

const fechaHora = (d: Date | null) =>
  d ? d.toLocaleString("es-DO", { timeZone: process.env.APP_TZ || "America/Santo_Domingo", dateStyle: "short", timeStyle: "short" }) : "Nunca";

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const u = await requirePermiso("usuarios.ver");
  const { creado } = await searchParams;
  const usuarios = await prisma.usuario.findMany({ include: { rol: true }, orderBy: { nombre: "asc" } });
  const ahora = new Date();
  const admin = puede(u, "usuarios.administrar");
  return (
    <>
      <Cabecera titulo="Usuarios" sub="Personas que pueden ingresar a la app y el rol de cada una">
        {admin && (
          <Link className="btn primary" href="/usuarios/nuevo">
            Nuevo usuario
          </Link>
        )}
        {puede(u, "roles.administrar") && (
          <Link className="btn" href="/roles">
            Roles y permisos
          </Link>
        )}
      </Cabecera>
      {creado && <Aviso tipo="ok">Usuario creado. Entrégale su correo y la contraseña temporal: deberá cambiarla al ingresar.</Aviso>}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((x) => {
              const bloqueado = x.bloqueadoHasta && x.bloqueadoHasta > ahora;
              return (
                <tr key={x.id}>
                  <td>
                    <b>{x.nombre}</b>
                    {x.id === u.id && <span className="sub"> (tú)</span>}
                  </td>
                  <td>{x.email}</td>
                  <td>{x.rol.nombre}</td>
                  <td>
                    {!x.activo ? (
                      <span className="pill idle">Inactivo</span>
                    ) : bloqueado ? (
                      <span className="pill bad">Bloqueado</span>
                    ) : x.debeCambiarPassword ? (
                      <span className="pill warn">Contraseña temporal</span>
                    ) : (
                      <span className="pill ok">Activo</span>
                    )}
                  </td>
                  <td>{fechaHora(x.ultimoAcceso)}</td>
                  <td className="act">
                    {admin && (
                      <Link className="btn sm" href={`/usuarios/${x.id}`}>
                        Editar
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
