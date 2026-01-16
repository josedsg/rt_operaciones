-- CreateTable
CREATE TABLE "productos_maestros" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "familia_id" INTEGER NOT NULL,
    "variante_id" INTEGER NOT NULL,
    "tamano_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "productos_maestros_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "productos_maestros" ADD CONSTRAINT "productos_maestros_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_maestros" ADD CONSTRAINT "productos_maestros_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_maestros" ADD CONSTRAINT "productos_maestros_tamano_id_fkey" FOREIGN KEY ("tamano_id") REFERENCES "tamanos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
