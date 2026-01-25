"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { getExportaciones } from "@/actions/exportaciones";

interface TableExportacionesProps {
    initialData: any;
}

export default function TableExportaciones({ initialData }: TableExportacionesProps) {
    const [data] = useState(initialData.data);

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="mb-6 flex justify-between items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    Exportaciones Recientes
                </h4>
                <Link
                    href="/exportaciones/nuevo"
                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                >
                    Nueva Exportación
                </Link>
            </div>

            <div className="flex flex-col">
                <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
                    <div className="p-2.5 xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">ID</h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Fecha</h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Pedidos</h5>
                    </div>
                    <div className="hidden p-2.5 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Estado</h5>
                    </div>
                    <div className="hidden p-2.5 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Usuario</h5>
                    </div>
                </div>

                {data.map((item: any) => (
                    <div
                        className={`grid grid-cols-3 sm:grid-cols-5 ${item === data[data.length - 1] ? "" : "border-b border-stroke dark:border-strokedark"
                            }`}
                        key={item.id}
                    >
                        <div className="flex items-center gap-3 p-2.5 xl:p-5">
                            <p className="font-medium text-black dark:text-white">#{item.id}</p>
                        </div>

                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                            <p className="text-black dark:text-white">
                                {dayjs(item.fecha).format("DD/MM/YYYY")}
                            </p>
                        </div>

                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                            <p className="text-black dark:text-white">
                                {item._count.pedidos}
                            </p>
                        </div>

                        <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                            <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${item.estado === 'CERRADA' ? 'bg-success text-success' :
                                    item.estado === 'PROCESADA' ? 'bg-primary text-primary' :
                                        'bg-warning text-warning'
                                }`}>
                                {item.estado}
                            </span>
                        </div>

                        <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                            <p className="text-black dark:text-white">
                                {item.usuario?.nombre}
                            </p>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="p-5 text-center text-gray-500">
                        No hay exportaciones registradas.
                    </div>
                )}
            </div>
        </div>
    );
}
