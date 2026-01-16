-- CreateTable
CREATE TABLE "configuraciones_permitidas" (
    "id" SERIAL NOT NULL,
    "familia_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "tamano_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "configuraciones_permitidas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "configuraciones_permitidas" ADD CONSTRAINT "configuraciones_permitidas_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones_permitidas" ADD CONSTRAINT "configuraciones_permitidas_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones_permitidas" ADD CONSTRAINT "configuraciones_permitidas_tamano_id_fkey" FOREIGN KEY ("tamano_id") REFERENCES "tamanos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
