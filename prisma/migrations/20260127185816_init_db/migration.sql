-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "agencia" TEXT,
ADD COLUMN     "terminal" TEXT;

-- AlterTable
ALTER TABLE "pedidos_ventas" ADD COLUMN     "agencia" TEXT,
ADD COLUMN     "exportacion_id" INTEGER,
ADD COLUMN     "terminal" TEXT,
ADD COLUMN     "usuario_id" INTEGER;

-- CreateTable
CREATE TABLE "productos_empaques" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "empaque_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_empaques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_empaques" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "empaque_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_empaques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_config" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "ein_number" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "company_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT DEFAULT 'USER',
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exportaciones" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "exportaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productos_empaques_producto_id_empaque_id_key" ON "productos_empaques"("producto_id", "empaque_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empaques_cliente_id_empaque_id_key" ON "clientes_empaques"("cliente_id", "empaque_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "pedidos_ventas" ADD CONSTRAINT "pedidos_ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_ventas" ADD CONSTRAINT "pedidos_ventas_exportacion_id_fkey" FOREIGN KEY ("exportacion_id") REFERENCES "exportaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_empaques" ADD CONSTRAINT "productos_empaques_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_maestros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_empaques" ADD CONSTRAINT "productos_empaques_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_empaques" ADD CONSTRAINT "clientes_empaques_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_empaques" ADD CONSTRAINT "clientes_empaques_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exportaciones" ADD CONSTRAINT "exportaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
