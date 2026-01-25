"use client";

import { PedidoForm } from "@/components/Ventas/pedido-form";
import { useParams } from "next/navigation";

export default function EditarPedidoPage() {
    const params = useParams();
    const id = Number(params.id);

    return <PedidoForm pedidoId={id} />;
}
