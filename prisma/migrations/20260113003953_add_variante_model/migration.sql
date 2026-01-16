-- CreateTable
CREATE TABLE "variantes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);
