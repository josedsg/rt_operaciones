import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { getDashboardDataAction } from "@/actions/dashboard";

export async function TopClientes({ className }: { className?: string }) {
    const data = await getDashboardDataAction();
    const topClientes = data.topClientes;

    return (
        <div
            className={cn(
                "grid rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
                className,
            )}
        >
            <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
                Principales Clientes
            </h2>

            <Table>
                <TableHeader>
                    <TableRow className="border-none uppercase [&>th]:text-center">
                        <TableHead className="min-w-[150px] !text-left">Cliente</TableHead>
                        <TableHead>Pedidos</TableHead>
                        <TableHead className="!text-right">Total Ventas</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {topClientes.map((cliente, i) => (
                        <TableRow
                            className="text-center text-base font-medium text-dark dark:text-white"
                            key={cliente.name + i}
                        >
                            <TableCell className="text-left font-bold uppercase">
                                {cliente.name}
                            </TableCell>

                            <TableCell>{cliente.ordersCount}</TableCell>

                            <TableCell className="!text-right text-green-light-1">
                                ${standardFormat(cliente.total)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {topClientes.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-gray-400">
                                No hay datos disponibles
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
