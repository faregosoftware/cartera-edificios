# Cartera de Edificios

App web para administrar una cartera de edificios: unidades, inquilinos, contratos de alquiler y un panel de resumen, con **login propio** y **permisos por rol** verificados en el servidor.

## Tecnología

| Parte | Elección |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js 15 (App Router, componentes y acciones de servidor) |
| Base de datos | PostgreSQL 16 con Prisma ORM |
| Login | Correo y contraseña. Las contraseñas se guardan con bcrypt y las sesiones en la base de datos, con cookie httpOnly |
| Validación | zod |
| Pruebas | `node:test`, sin dependencias extra |

## Funciones

- **Panel:** ocupación, renta mensual en RD$ y US$, contratos por vencer en los próximos 60 días y vencidos, unidades libres.
- **Edificios, unidades, inquilinos:** alta, edición, eliminación (protegida si tiene registros relacionados) y búsqueda.
- **Contratos:** registrar, editar, **renovar** (crea el contrato nuevo y finaliza el anterior en una transacción), **finalizar** con fecha de salida y eliminar. No permite dos contratos que se crucen en fechas para la misma unidad.
- **Cobros:** cada contrato genera sola su cuota mensual. El período empieza el mismo día que el contrato y vence el día de pago. Desde el estado de cuenta se registran pagos totales o parciales (efectivo, transferencia, QR, depósito o cheque) y se emite un **recibo numerado e imprimible**, con el monto en letras. Los recibos se pueden anular dejando registrado el motivo, y las cuotas se pueden ajustar por descuentos o prorrateos.
- **Vencidos:** cuotas impagas cuyo día de pago ya pasó, agrupadas por inquilino y por tramo de atraso (1–30, 31–60, 61–90 y más de 90 días), con las que vencen en los próximos 7 días.
- **Recibos:** historial por rango de fechas y forma de pago, con totales para cuadrar caja.
- **Usuarios:** el administrador crea usuarios con una contraseña temporal, que se debe cambiar al primer ingreso. También puede asignar rol, desactivar, restablecer la contraseña y desbloquear.
- **Roles y permisos:** roles con los permisos que elijas, por función.
- **Seguridad:** 5 intentos fallidos bloquean la cuenta 15 minutos. Al cambiar o restablecer una contraseña se cierran las demás sesiones. Siempre debe quedar al menos un administrador activo.

## Permisos

Cada página y cada acción del servidor llama a `requirePermiso(...)`. Ocultar un botón no es la única protección.

| Módulo | Permisos |
|---|---|
| Panel | `panel.ver` |
| Edificios / Unidades / Inquilinos | `.ver` `.crear` `.editar` `.eliminar` |
| Contratos | `.ver` `.crear` `.editar` `.renovar` `.finalizar` `.eliminar` |
| Cobros | `cobros.ver` `cobros.registrar` `cobros.anular` (anular recibos y ajustar cuotas) |
| Usuarios | `usuarios.ver` `usuarios.administrar` |
| Roles | `roles.administrar` |

Roles iniciales:

- **Administrador:** todos los permisos. Es un rol del sistema y no se puede editar ni eliminar.
- **Operador:** crea y edita todo y cobra, pero no elimina, no anula recibos ni administra usuarios.
- **Consulta:** solo puede ver.

El catálogo está en `src/lib/permisos.ts`. Para agregar un permiso nuevo se añade ahí y se exige con `requirePermiso`.

## Puesta en marcha (local)

Requisitos: Node.js 22.6 o superior y Docker (o un PostgreSQL propio).

```bash
cp .env.example .env          # edita ADMIN_EMAIL y ADMIN_PASSWORD
docker compose up -d          # levanta PostgreSQL en el puerto 5432
npm install
npm run db:migrate            # crea las tablas
npm run db:seed               # roles + primer administrador (SEED_DEMO=1 agrega datos de ejemplo)
npm run dev                   # http://localhost:3000
```

Ingresa con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La app te pedirá cambiar la contraseña.

## Despliegue en Hostinger (Business Web Hosting o Cloud)

La base de datos sigue en **Neon**: los planes Web y Cloud de Hostinger no ofrecen PostgreSQL.

1. En hPanel ve a **Websites → Create site → Web App** y elige el dominio o subdominio (por ejemplo `app.tuempresa.com`). Un subdominio se crea como su propio sitio, no como subcarpeta.
2. Elige **Import your Git repository**, conecta GitHub y selecciona `cartera-edificios`, rama `main`.
3. En **Build and output settings**:
   - Framework: **Next.js**
   - Node version: **22.x**
   - Package manager: **npm**
   - Build command: `npm run build:hostinger` (genera Prisma, aplica las migraciones pendientes y compila)
4. Variables de entorno: `DATABASE_URL` (la de Neon), `APP_TZ=America/Santo_Domingo`, `NOMBRE_EMPRESA` y, si quieres, `RECIBO_RNC`, `RECIBO_DIRECCION` y `RECIBO_TELEFONO`.
5. Haz clic en **Deploy**. Cada push a `main` vuelve a publicar la app. Si un deploy falla, sigue en línea la versión anterior.
6. Activa el SSL del dominio, porque la cookie de sesión exige HTTPS en producción.

## Despliegue en Vercel (alternativa)

1. Crea una base PostgreSQL administrada (Neon, Supabase, Railway…) y copia su `DATABASE_URL`.
2. Despliega el repositorio en Vercel o Railway con estas variables: `DATABASE_URL` y `APP_TZ=America/Santo_Domingo`. Agrega `ADMIN_*` solo para la carga inicial.
3. Ejecuta una vez `npm run db:migrate && npm run db:seed` contra esa base.
4. En Vercel, cada deploy de producción aplica las migraciones pendientes (`vercel-build`).
5. Opcional: `NOMBRE_EMPRESA` (menú, ingreso y recibos), y `RECIBO_RNC`, `RECIBO_DIRECCION` y `RECIBO_TELEFONO` para el encabezado de los recibos.
6. Usa siempre HTTPS. En producción la cookie de sesión se marca como `secure`.

## Estructura

```
prisma/            esquema, migraciones y seed
src/lib/           auth, permisos, reglas de negocio, acceso a datos
src/app/login/     pantalla de ingreso
src/app/(app)/     pantallas protegidas (panel, edificios, unidades, inquilinos, contratos, usuarios, roles, cuenta)
src/components/    piezas de interfaz
tests/             pruebas de reglas de negocio y permisos (npm test)
prototipo/         primera versión de una sola página (sin servidor)
```

## Próximos pasos

- Bitácora de auditoría: quién cambió qué y cuándo.
- Recuperación de contraseña por correo.
