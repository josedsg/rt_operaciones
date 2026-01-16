import { getClientesAction } from "@/actions/clientes";
import { Cliente } from "@/types/cliente";

export const getClientes = async (): Promise<Cliente[]> => {
    return await getClientesAction();
};
