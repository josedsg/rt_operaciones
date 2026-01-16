import { Prisma } from "@prisma/client";

export type Cliente = Prisma.ClienteGetPayload<{
    include: {
        tipo_identificacion: true;
        tipo_cliente: true;
        terminos_pago: true;
        pais: true;
        provincia: true;
        canton: true;
        distrito: true;
    };
}>;
