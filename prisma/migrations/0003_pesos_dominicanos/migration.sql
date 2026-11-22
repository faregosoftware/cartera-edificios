-- Moneda local: de bolivianos (BOB) a pesos dominicanos (DOP).
-- Renombrar el valor del enum conserva todos los registros; los montos NO se convierten.
ALTER TYPE "Moneda" RENAME VALUE 'BOB' TO 'DOP';
ALTER TABLE "Unidad" ALTER COLUMN "monedaReferencia" SET DEFAULT 'DOP';
ALTER TABLE "Contrato" ALTER COLUMN "moneda" SET DEFAULT 'DOP';

-- Documentos de identidad de República Dominicana
ALTER TABLE "Inquilino" ALTER COLUMN "tipoDoc" SET DEFAULT 'Cédula';
UPDATE "Inquilino" SET "tipoDoc" = 'Cédula' WHERE "tipoDoc" = 'CI';
UPDATE "Inquilino" SET "tipoDoc" = 'RNC' WHERE "tipoDoc" = 'NIT';
