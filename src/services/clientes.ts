import { getClientesAction } from "@/actions/clientes";
import { Cliente } from "@/types/cliente";

export const getClientes = async (): Promise<Cliente[]> => {
    const res = await getClientesAction(1, 1000);
    return res.data;
};
