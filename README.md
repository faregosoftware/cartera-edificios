# Cartera de Edificios

App web para administrar una cartera de edificios: unidades, inquilinos, contratos de alquiler y un panel de resumen.

## Funciones

- **Panel**: ocupación, renta mensual contratada en Bs y US$, contratos por vencer (60 días) y vencidos, unidades libres.
- **Edificios**: alta, edición y resumen de ocupación por edificio.
- **Unidades**: departamentos, locales, oficinas, parqueos y depósitos, con estado libre u ocupada.
- **Inquilinos**: personas o empresas, con CI o NIT y datos de contacto.
- **Contratos**: vigencia, renta, moneda, garantía y día de pago. Se pueden renovar o finalizar, y la app impide que dos contratos se crucen en la misma unidad.

## Tecnología

- Una sola página: `index.html`, con HTML, CSS y JavaScript sin frameworks.
- Datos: la base de documentos de Claude Artifacts, con las colecciones `edificios`, `unidades`, `inquilinos` y `contratos`.
- Sin esa base, por ejemplo al abrir el archivo localmente, la app funciona en **modo sin conexión** y guarda los datos solo en el navegador (`localStorage`).

## Uso local

Abre `index.html` en el navegador. No necesita instalación.

## Modelo de datos

| Colección   | Campos principales |
|-------------|--------------------|
| edificios   | nombre, direccion, ciudad, notas |
| unidades    | edificioId, codigo, tipo, piso, superficie, dormitorios, rentaReferencia, monedaReferencia |
| inquilinos  | nombre, tipoDoc, documento, telefono, email |
| contratos   | unidadId, inquilinoId, inicio, fin, renta, moneda (BOB/USD), garantia, diaPago, finalizado, fechaSalida |

## Próximos pasos

- Módulo de cobros: generar las rentas mensuales, registrar pagos y ver la mora.
- Migrar a Next.js + TypeScript + PostgreSQL si se necesitan usuarios propios o reportes.
