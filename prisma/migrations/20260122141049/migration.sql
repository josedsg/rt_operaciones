/*
  Warnings:

  - You are about to drop the column `canton` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `distrito` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `pais` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `provincia` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `terminos_pago` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_cliente` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_identificacion` on the `clientes` table. All the data in the column will be lost.
  - Added the required column `pais_id` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terminos_pago_id` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_cliente_id` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_identificacion_id` to the `clientes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "canton",
DROP COLUMN "distrito",
DROP COLUMN "pais",
DROP COLUMN "provincia",
DROP COLUMN "terminos_pago",
DROP COLUMN "tipo_cliente",
DROP COLUMN "tipo_identificacion",
ADD COLUMN     "canton_id" INTEGER,
ADD COLUMN     "distrito_id" INTEGER,
ADD COLUMN     "fecha_vencimiento_exoneracion" DATE,
ADD COLUMN     "num_documento_exoneracion" TEXT,
ADD COLUMN     "pais_id" INTEGER NOT NULL,
ADD COLUMN     "provincia_id" INTEGER,
ADD COLUMN     "terminos_pago_id" INTEGER NOT NULL,
ADD COLUMN     "tipo_cliente_id" INTEGER NOT NULL,
ADD COLUMN     "tipo_facturacion" TEXT DEFAULT 'GRAVADO',
ADD COLUMN     "tipo_identificacion_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "tipos_clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "tipos_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_identificaciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "tipos_identificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminos_pago" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "dias" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "terminos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paises" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provincias" (
    "id" SERIAL NOT NULL,
    "pais_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cantones" (
    "id" SERIAL NOT NULL,
    "provincia_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "cantones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distritos" (
    "id" SERIAL NOT NULL,
    "canton_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "identificacion" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_ventas" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "cliente_id" INTEGER NOT NULL,
    "awd" TEXT,
    "moneda" TEXT DEFAULT 'USD',
    "fecha_pedido" DATE NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exonerado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "numero_factura" TEXT,
    "pdf_factura" TEXT,
    "xml_envio" TEXT,
    "xml_respuesta" TEXT,
    "estado_factura" TEXT DEFAULT 'PENDIENTE',
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "pedidos_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_pedidos_ventas" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "familia_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER NOT NULL,
    "tamano_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER,
    "empaque_id" INTEGER,
    "po" TEXT,
    "cajas" INTEGER NOT NULL DEFAULT 0,
    "stems_per_bunch" INTEGER NOT NULL DEFAULT 0,
    "bunches_per_box" INTEGER NOT NULL DEFAULT 0,
    "stems_per_box" INTEGER NOT NULL DEFAULT 0,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "precio_unitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precio_proveedor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impuesto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exoneracion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "awd" TEXT,
    "especificaciones" TEXT,
    "fecha_pedido" DATE,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "lineas_pedidos_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_assorted" (
    "id" SERIAL NOT NULL,
    "linea_pedido_id" INTEGER NOT NULL,
    "variante_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "config_assorted_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_proveedores" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "precio_referencia" DOUBLE PRECISION DEFAULT 0,
    "codigo_proveedor" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "productos_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_empaques" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "tipos_empaques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empaques" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sxb" INTEGER NOT NULL,
    "bxb" INTEGER NOT NULL,
    "st_x_bx" INTEGER NOT NULL,
    "tipo_empaque_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3),

    CONSTRAINT "empaques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_ventas_codigo_key" ON "pedidos_ventas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "productos_proveedores_producto_id_proveedor_id_key" ON "productos_proveedores"("producto_id", "proveedor_id");

-- AddForeignKey
ALTER TABLE "provincias" ADD CONSTRAINT "provincias_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cantones" ADD CONSTRAINT "cantones_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distritos" ADD CONSTRAINT "distritos_canton_id_fkey" FOREIGN KEY ("canton_id") REFERENCES "cantones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipo_identificacion_id_fkey" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "tipos_identificaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipo_cliente_id_fkey" FOREIGN KEY ("tipo_cliente_id") REFERENCES "tipos_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_canton_id_fkey" FOREIGN KEY ("canton_id") REFERENCES "cantones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_terminos_pago_id_fkey" FOREIGN KEY ("terminos_pago_id") REFERENCES "terminos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_ventas" ADD CONSTRAINT "pedidos_ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_maestros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_tamano_id_fkey" FOREIGN KEY ("tamano_id") REFERENCES "tamanos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedidos_ventas" ADD CONSTRAINT "lineas_pedidos_ventas_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_assorted" ADD CONSTRAINT "config_assorted_linea_pedido_id_fkey" FOREIGN KEY ("linea_pedido_id") REFERENCES "lineas_pedidos_ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_assorted" ADD CONSTRAINT "config_assorted_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedores" ADD CONSTRAINT "productos_proveedores_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_maestros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedores" ADD CONSTRAINT "productos_proveedores_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empaques" ADD CONSTRAINT "empaques_tipo_empaque_id_fkey" FOREIGN KEY ("tipo_empaque_id") REFERENCES "tipos_empaques"("id") ON DELETE SET NULL ON UPDATE CASCADE;
