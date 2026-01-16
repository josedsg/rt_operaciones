"use client";

import React, { useEffect, useState } from "react";
import { Provincia, Canton, Distrito } from "@prisma/client";
import { getProvinciasAction, getCantonesAction, getDistritosAction } from "@/actions/clientes";

export default function GridGeografia() {
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [selectedProvincia, setSelectedProvincia] = useState<number | null>(null);
    const [cantones, setCantones] = useState<Canton[]>([]);
    const [selectedCanton, setSelectedCanton] = useState<number | null>(null);
    const [distritos, setDistritos] = useState<Distrito[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProvinciasAction().then((data) => {
            setProvincias(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedProvincia) {
            getCantonesAction(selectedProvincia).then(setCantones);
            setSelectedCanton(null);
            setDistritos([]);
        }
    }, [selectedProvincia]);

    useEffect(() => {
        if (selectedCanton) {
            getDistritosAction(selectedCanton).then(setDistritos);
        }
    }, [selectedCanton]);

    if (loading) return <div>Cargando geografía...</div>;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Provincias Column */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">Provincias</h3>
                </div>
                <div className="flex flex-col h-[500px] overflow-y-auto p-4 gap-2">
                    {provincias.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProvincia(p.id)}
                            className={`text-left px-4 py-2 rounded transition-colors ${selectedProvincia === p.id
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white'
                                }`}
                        >
                            {p.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cantones Column */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        {selectedProvincia ? 'Cantones' : 'Seleccione Provincia'}
                    </h3>
                </div>
                <div className="flex flex-col h-[500px] overflow-y-auto p-4 gap-2">
                    {cantones.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCanton(c.id)}
                            className={`text-left px-4 py-2 rounded transition-colors ${selectedCanton === c.id
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white'
                                }`}
                        >
                            {c.nombre}
                        </button>
                    ))}
                    {selectedProvincia && cantones.length === 0 && (
                        <p className="text-gray-500 text-sm">No hay cantones cargados.</p>
                    )}
                </div>
            </div>

            {/* Distritos Column */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        {selectedCanton ? 'Distritos' : 'Seleccione Cantón'}
                    </h3>
                </div>
                <div className="flex flex-col h-[500px] overflow-y-auto p-4 gap-2">
                    {distritos.map(d => (
                        <div
                            key={d.id}
                            className="px-4 py-2 text-black dark:text-white border-b border-gray-100 dark:border-strokedark last:border-0"
                        >
                            {d.nombre} <span className="text-xs text-gray-500">({d.codigo || 'S/C'})</span>
                        </div>
                    ))}
                    {selectedCanton && distritos.length === 0 && (
                        <p className="text-gray-500 text-sm">No hay distritos cargados.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
