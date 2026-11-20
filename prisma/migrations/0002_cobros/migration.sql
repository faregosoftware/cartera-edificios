-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE NOT NULL,
    "vencimiento" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "nota" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "metodo" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anuladoMotivo" TEXT,
    "anuladoEl" TIMESTAMP(3),
    "anuladoPorId" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cuota_vencimiento_idx" ON "Cuota"("vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_contratoId_periodo_key" ON "Cuota"("contratoId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_numero_key" ON "Pago"("numero");

-- CreateIndex
CREATE INDEX "Pago_cuotaId_idx" ON "Pago"("cuotaId");

-- CreateIndex
CREATE INDEX "Pago_fecha_idx" ON "Pago"("fecha");

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Permisos nuevos para los roles iniciales que ya existen
-- (el Administrador recibe todos los permisos automáticamente).
UPDATE "Rol" SET "permisos" = array_cat("permisos", ARRAY['cobros.ver','cobros.registrar']), "actualizado" = CURRENT_TIMESTAMP
  WHERE "nombre" = 'Operador' AND NOT ('cobros.ver' = ANY("permisos"));
UPDATE "Rol" SET "permisos" = array_append("permisos", 'cobros.ver'), "actualizado" = CURRENT_TIMESTAMP
  WHERE "nombre" = 'Consulta' AND NOT ('cobros.ver' = ANY("permisos"));
UPDATE "Rol" SET "permisos" = array_cat("permisos", ARRAY['cobros.ver','cobros.registrar','cobros.anular']), "actualizado" = CURRENT_TIMESTAMP
  WHERE "sistema" = true AND NOT ('cobros.ver' = ANY("permisos"));
