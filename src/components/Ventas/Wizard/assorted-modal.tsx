"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfiguracionAssortedInput } from "@/actions/ventas";
import toast from "react-hot-toast";

interface AssortedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ConfiguracionAssortedInput[]) => void;
    variantesDisponibles: any[]; // List of available variants for the current product/family
    initialConfig?: ConfiguracionAssortedInput[];
    totalTarget: number; // Target quantity (boxes or bunches) to validate against
}

export function AssortedModal({ isOpen, onClose, onSave, variantesDisponibles, initialConfig, totalTarget }: AssortedModalProps) {
    const [config, setConfig] = useState<ConfiguracionAssortedInput[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialConfig && initialConfig.length > 0) {
                setConfig([...initialConfig]);
            } else {
                setConfig([{ variante_id: 0, cantidad: 0 }]);
            }
        }
    }, [isOpen, initialConfig]);

    const addRow = () => {
        setConfig([...config, { variante_id: 0, cantidad: 0 }]);
    };

    const removeRow = (index: number) => {
        const newConfig = [...config];
        newConfig.splice(index, 1);
        setConfig(newConfig);
    };

    const updateRow = (index: number, field: keyof ConfiguracionAssortedInput, value: any) => {
        const newConfig = [...config];
        // @ts-ignore
        newConfig[index][field] = value;

        if (field === 'variante_id') {
            const variant = variantesDisponibles.find(v => v.id === Number(value));
            if (variant) {
                newConfig[index].variante_nombre = variant.nombre;
            }
        }

        setConfig(newConfig);
    };

    const totalConfigured = useMemo(() => {
        return config.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    }, [config]);

    const handleSave = () => {
        // Validate
        const isValid = config.every(c => c.variante_id > 0 && c.cantidad > 0);
        if (!isValid) {
            toast.error("Complete todas las variantes y cantidades");
            return;
        }

        // Optional: Validate total against target
        // if (totalConfigured !== totalTarget) {
        //     toast.error(`La suma debe ser igual a ${totalTarget}`);
        //     return;
        // }

        onSave(config);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Configurar Surtido (Assorted)</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium border-b pb-2">
                        <span>Variante</span>
                        <span>Cantidad</span>
                        <span className="w-8"></span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {config.map((row, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <select
                                    className="flex-1 rounded border border-stroke p-2 text-sm dark:bg-boxdark dark:border-strokedark"
                                    value={row.variante_id}
                                    onChange={(e) => updateRow(idx, 'variante_id', Number(e.target.value))}
                                >
                                    <option value={0}>Seleccionar...</option>
                                    {variantesDisponibles.map(v => (
                                        <option key={v.id} value={v.id}>{v.nombre}</option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    className="w-24 rounded border border-stroke p-2 text-sm text-center dark:bg-boxdark dark:border-strokedark"
                                    placeholder="Cant."
                                    value={row.cantidad || ""}
                                    onChange={(e) => updateRow(idx, 'cantidad', Number(e.target.value))}
                                />

                                <button
                                    onClick={() => removeRow(idx)}
                                    className="p-2 text-danger hover:bg-danger/10 rounded"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addRow}
                        className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                        + Agregar Variante
                    </button>

                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                        <span className="font-bold">Total Configurado:</span>
                        <span className={`font-bold ${totalConfigured === totalTarget ? 'text-success' : 'text-warning'}`}>
                            {totalConfigured} / {totalTarget}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 text-sm font-medium"
                    >
                        Guardar Configuración
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
