-- CreateTable
CREATE TABLE "familias" (
    "id" SERIAL NOT NULL,
    "nombre_cientifico" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "grupo_id" INTEGER NOT NULL,
    "codigo_cabys" TEXT,
    "partida_arancelaria" TEXT,
    "foto" TEXT,
    "ficha_tecnica" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
