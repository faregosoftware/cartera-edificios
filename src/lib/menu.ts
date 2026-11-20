import type { Permiso } from "./permisos";

export const MENU: { href: string; texto: string; permiso: Permiso }[] = [
  { href: "/", texto: "Panel", permiso: "panel.ver" },
  { href: "/edificios", texto: "Edificios", permiso: "edificios.ver" },
  { href: "/unidades", texto: "Unidades", permiso: "unidades.ver" },
  { href: "/inquilinos", texto: "Inquilinos", permiso: "inquilinos.ver" },
  { href: "/contratos", texto: "Contratos", permiso: "contratos.ver" },
  { href: "/usuarios", texto: "Usuarios", permiso: "usuarios.ver" },
  { href: "/roles", texto: "Roles y permisos", permiso: "roles.administrar" },
];

export function menuPara(permisos: readonly string[]) {
  return MENU.filter((m) => permisos.includes(m.permiso));
}
