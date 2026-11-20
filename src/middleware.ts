// Filtro rápido: sin cookie de sesión, cualquier página lleva al login.
// La verificación real (sesión válida, usuario activo, permisos) ocurre en el servidor con requirePermiso().
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (!req.cookies.has("cartera_sesion")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
