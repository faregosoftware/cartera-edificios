import type { ReactNode } from "react";
import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { menuPara } from "@/lib/menu";
import { datosEmpresa } from "@/lib/empresa";
import { Nav } from "@/components/Nav";
import { salir } from "../login/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Cada página vuelve a verificar su propio permiso; aquí sólo se arma el menú.
  const u = await requireUsuario({ permitirPasswordTemporal: true });
  const items = u.debeCambiarPassword ? [] : menuPara(u.permisos).map(({ href, texto }) => ({ href, texto }));
  return (
    <div className="app">
      <nav className="side" aria-label="Secciones">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <rect x="3" y="8" width="9" height="15" rx="1.5" fill="var(--accent)" opacity=".55" />
            <rect x="11" y="3" width="12" height="20" rx="1.5" fill="var(--accent)" />
            <g fill="var(--surface)">
              <rect x="14" y="7" width="2.4" height="2.4" />
              <rect x="18" y="7" width="2.4" height="2.4" />
              <rect x="14" y="12" width="2.4" height="2.4" />
              <rect x="18" y="12" width="2.4" height="2.4" />
              <rect x="15.5" y="17.5" width="3.5" height="5.5" />
            </g>
          </svg>
          <span>{datosEmpresa().nombre}</span>
        </div>
        <Nav items={items} />
        <div className="user">
          <b>{u.nombre}</b>
          <span className="sub">{u.rol.nombre}</span>
          <div className="row">
            <Link className="link" href="/cuenta">
              Mi cuenta
            </Link>
            <form action={salir} className="inline">
              <button className="link" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
