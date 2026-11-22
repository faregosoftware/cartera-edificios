import Link from "next/link";
import { requirePermiso, puede } from "@/lib/auth";
import { cargarCartera } from "@/lib/cartera";
import { formatoDinero } from "@/lib/negocio";
import { Barra, Cabecera, Vacio } from "@/components/ui";

export default async function Edificios() {
  const u = await requirePermiso("edificios.ver");
  const d = await cargarCartera();
  const n = d.edificios.length;
  return (
    <>
      <Cabecera titulo="Edificios" sub={`${n} edificio${n === 1 ? "" : "s"} en la cartera`}>
        {puede(u, "edificios.crear") && (
          <Link className="btn primary" href="/edificios/nuevo">
            Nuevo edificio
          </Link>
        )}
      </Cabecera>
      {!n ? (
        <Vacio titulo="Sin edificios todavía">
          <p>Registra un edificio para empezar a cargar sus unidades.</p>
        </Vacio>
      ) : (
        <div className="bcards">
          {d.edificios.map((e) => {
            const r = d.resumenEdificio(e.id);
            return (
              <div className="card bcard" key={e.id}>
                <div>
                  <h2>{e.nombre}</h2>
                  <div className="addr">{[e.direccion, e.ciudad].filter(Boolean).join(", ") || "Sin dirección"}</div>
                </div>
                <Barra pct={r.pct} />
                <div className="bstats">
                  <div>
                    <b>{r.total}</b>unidades
                  </div>
                  <div>
                    <b>{r.libres}</b>libres
                  </div>
                  <div>
                    <b>
                      {r.dop || r.usd ? (
                        <>
                          {r.dop ? formatoDinero(r.dop, "DOP") : null}
                          {r.dop && r.usd ? <br /> : null}
                          {r.usd ? formatoDinero(r.usd, "USD") : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </b>
                    renta/mes
                  </div>
                </div>
                {e.notas && <div className="sub">{e.notas}</div>}
                <div className="row">
                  {puede(u, "unidades.ver") && (
                    <Link className="btn sm" href={`/unidades?edificio=${e.id}`}>
                      Ver unidades
                    </Link>
                  )}
                  {puede(u, "unidades.crear") && (
                    <Link className="btn sm" href={`/unidades/nueva?edificio=${e.id}`}>
                      Agregar unidad
                    </Link>
                  )}
                  {(puede(u, "edificios.editar") || puede(u, "edificios.eliminar")) && (
                    <Link className="btn sm" href={`/edificios/${e.id}`}>
                      Editar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
