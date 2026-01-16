-- CreateTable
CREATE TABLE "tamanos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "tamanos_pkey" PRIMARY KEY ("id")
);
