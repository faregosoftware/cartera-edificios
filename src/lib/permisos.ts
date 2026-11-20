// Catálogo de permisos de la app. Cada función protegida del servidor exige uno de estos.
// Archivo sin dependencias: lo usan la app, el seed y los tests.

export const MODULOS = [
  {
    clave: "panel",
    nombre: "Panel",
    acciones: [{ clave: "ver", nombre: "Ver el panel de resumen" }],
  },
  {
    clave: "edificios",
    nombre: "Edificios",
    acciones: [
      { clave: "ver", nombre: "Ver" },
      { clave: "crear", nombre: "Crear" },
      { clave: "editar", nombre: "Editar" },
      { clave: "eliminar", nombre: "Eliminar" },
    ],
  },
  {
    clave: "unidades",
    nombre: "Unidades",
    acciones: [
      { clave: "ver", nombre: "Ver" },
      { clave: "crear", nombre: "Crear" },
      { clave: "editar", nombre: "Editar" },
      { clave: "eliminar", nombre: "Eliminar" },
    ],
  },
  {
    clave: "inquilinos",
    nombre: "Inquilinos",
    acciones: [
      { clave: "ver", nombre: "Ver" },
      { clave: "crear", nombre: "Crear" },
      { clave: "editar", nombre: "Editar" },
      { clave: "eliminar", nombre: "Eliminar" },
    ],
  },
  {
    clave: "contratos",
    nombre: "Contratos",
    acciones: [
      { clave: "ver", nombre: "Ver" },
      { clave: "crear", nombre: "Crear" },
      { clave: "editar", nombre: "Editar" },
      { clave: "renovar", nombre: "Renovar" },
      { clave: "finalizar", nombre: "Finalizar" },
      { clave: "eliminar", nombre: "Eliminar" },
    ],
  },
  {
    clave: "cobros",
    nombre: "Cobros",
    acciones: [
      { clave: "ver", nombre: "Ver estados de cuenta, vencidos y recibos" },
      { clave: "registrar", nombre: "Registrar pagos e imprimir recibos" },
      { clave: "anular", nombre: "Anular recibos y ajustar cuotas" },
    ],
  },
  {
    clave: "usuarios",
    nombre: "Usuarios",
    acciones: [
      { clave: "ver", nombre: "Ver usuarios" },
      { clave: "administrar", nombre: "Crear, editar y desactivar usuarios" },
    ],
  },
  {
    clave: "roles",
    nombre: "Roles y permisos",
    acciones: [{ clave: "administrar", nombre: "Crear y editar roles y sus permisos" }],
  },
] as const;

type Modulo = (typeof MODULOS)[number];
export type Permiso = {
  [M in Modulo as M["clave"]]: `${M["clave"]}.${M["acciones"][number]["clave"]}`;
}[Modulo["clave"]];

export const TODOS_LOS_PERMISOS: Permiso[] = MODULOS.flatMap((m) =>
  m.acciones.map((a) => `${m.clave}.${a.clave}` as Permiso),
);

const CONJUNTO = new Set<string>(TODOS_LOS_PERMISOS);
export function esPermisoValido(p: string): p is Permiso {
  return CONJUNTO.has(p);
}

/** Limpia una lista recibida de un formulario: quita duplicados y claves desconocidas. */
export function normalizarPermisos(lista: readonly string[]): Permiso[] {
  return TODOS_LOS_PERMISOS.filter((p) => lista.includes(p));
}

export function tienePermiso(permisos: readonly string[], p: Permiso): boolean {
  return permisos.includes(p);
}

/** Permisos que el rol Administrador siempre conserva, para que nadie quede fuera del sistema. */
export const PERMISOS_ADMIN_OBLIGATORIOS: Permiso[] = ["usuarios.ver", "usuarios.administrar", "roles.administrar"];

export const ROLES_INICIALES: { nombre: string; descripcion: string; sistema: boolean; permisos: Permiso[] }[] = [
  {
    nombre: "Administrador",
    descripcion: "Acceso total, incluidos usuarios y roles.",
    sistema: true,
    permisos: TODOS_LOS_PERMISOS,
  },
  {
    nombre: "Operador",
    descripcion: "Registra y edita la cartera y cobra. No elimina, no anula recibos ni administra usuarios.",
    sistema: false,
    permisos: TODOS_LOS_PERMISOS.filter(
      (p) => !p.endsWith(".eliminar") && p !== "cobros.anular" && !p.startsWith("usuarios.") && !p.startsWith("roles."),
    ),
  },
  {
    nombre: "Consulta",
    descripcion: "Sólo puede ver la información.",
    sistema: false,
    permisos: TODOS_LOS_PERMISOS.filter((p) => p.endsWith(".ver") && !p.startsWith("usuarios.")),
  },
];
