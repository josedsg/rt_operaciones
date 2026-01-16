-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "tipo_identificacion" INTEGER NOT NULL,
    "identificacion" TEXT NOT NULL,
    "tipo_cliente" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "email_notificacion" TEXT,
    "telefono" TEXT,
    "sitio_web" TEXT,
    "pais" INTEGER NOT NULL,
    "provincia" INTEGER NOT NULL,
    "canton" INTEGER NOT NULL,
    "distrito" INTEGER NOT NULL,
    "direccion" TEXT,
    "terminos_pago" INTEGER NOT NULL,
    "latitud" TEXT,
    "longitud" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);
