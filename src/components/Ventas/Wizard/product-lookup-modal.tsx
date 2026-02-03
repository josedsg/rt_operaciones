"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductoMaestroWithRelations } from "@/actions/productos-maestros";
import { Familia } from "@prisma/client";

interface ProductLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ProductoMaestroWithRelations) => void;
    familias: Familia[];
    allProductos: ProductoMaestroWithRelations[];
    allowedProductIds: number[] | null;
}

export function ProductLookupModal({
    isOpen,
    onClose,
    onSelect,
    familias,
    allProductos,
    allowedProductIds
}: ProductLookupModalProps) {
    // Local state for the modal's selection flow
    const [selectedFamiliaId, setSelectedFamiliaId] = useState<number>(0);
    const [selectedProductName, setSelectedProductName] = useState<string>("");
    const [selectedVarianteId, setSelectedVarianteId] = useState<number>(0);
    const [selectedTamanoId, setSelectedTamanoId] = useState<number>(0);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedFamiliaId(0);
            setSelectedProductName("");
            setSelectedVarianteId(0);
            setSelectedTamanoId(0);
        }
    }, [isOpen]);

    // --- Logic copied and adapted from step-lineas.tsx ---

    // 1. Filter Familias
    const filteredFamilias = useMemo(() => {
        if (allowedProductIds !== null) {
            return familias.filter(f => {
                const hasProductsForProvider = allProductos.some(p =>
                    p.familia_id === f.id && allowedProductIds.includes(p.id)
                );
                return hasProductsForProvider;
            });
        }
        return familias;
    }, [familias, allowedProductIds, allProductos]);

    // 2. Filter Products by Family
    const accessableProductos = useMemo(() => {
        if (!selectedFamiliaId) return [];
        return allProductos.filter(p => {
            const matchesFamilia = p.familia_id === selectedFamiliaId;
            const isAllowedByProvider = allowedProductIds === null || allowedProductIds.includes(p.id);
            return matchesFamilia && isAllowedByProvider;
        });
    }, [allProductos, selectedFamiliaId, allowedProductIds]);

    // 3. Unique Names
    const uniqueProductNames = useMemo(() => {
        const names = new Set<string>();
        accessableProductos.forEach(p => names.add(p.nombre));
        return Array.from(names).sort();
    }, [accessableProductos]);

    // 4. Variants
    const availableVariantes = useMemo(() => {
        if (!selectedProductName) return [];
        const variants = new Map<number, any>();
        accessableProductos
            .filter(p => p.nombre === selectedProductName)
            .forEach(p => {
                if (p.variante) variants.set(p.variante.id, p.variante);
            });
        return Array.from(variants.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [accessableProductos, selectedProductName]);

    // 5. Sizes
    const availableTamanos = useMemo(() => {
        if (!selectedProductName || !selectedVarianteId) return [];
        const tamanos = new Map<number, any>();
        accessableProductos
            .filter(p => p.nombre === selectedProductName && p.variante_id === selectedVarianteId)
            .forEach(p => {
                if (p.tamano) tamanos.set(p.tamano.id, p.tamano);
            });
        return Array.from(tamanos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [accessableProductos, selectedProductName, selectedVarianteId]);

    const handleConfirm = () => {
        if (selectedProductName && selectedVarianteId && selectedTamanoId) {
            const match = accessableProductos.find(p =>
                p.nombre === selectedProductName &&
                p.variante_id === selectedVarianteId &&
                p.tamano_id === selectedTamanoId
            );
            if (match) {
                onSelect(match);
                onClose();
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Buscar Producto</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Familia */}
                    <div className="col-span-2">
                        <label className="mb-2 block text-sm font-bold text-black dark:text-white">
                            Familia
                        </label>
                        <select
                            className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 dark:bg-meta-4 focus:border-primary outline-none"
                            value={selectedFamiliaId}
                            onChange={(e) => {
                                setSelectedFamiliaId(Number(e.target.value));
                                setSelectedProductName("");
                                setSelectedVarianteId(0);
                                setSelectedTamanoId(0);
                            }}
                        >
                            <option value={0}>Seleccione Familia</option>
                            {filteredFamilias.map(f => (
                                <option key={f.id} value={f.id}>{f.nombre_cientifico}</option>
                            ))}
                        </select>
                    </div>

                    {/* Producto (Nombre) */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-black dark:text-white">
                            Producto
                        </label>
                        <select
                            className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 dark:bg-meta-4 focus:border-primary outline-none"
                            value={selectedProductName}
                            onChange={(e) => {
                                setSelectedProductName(e.target.value);
                                setSelectedVarianteId(0);
                                setSelectedTamanoId(0);
                            }}
                            disabled={!selectedFamiliaId}
                        >
                            <option value="">Seleccione Producto</option>
                            {uniqueProductNames.map((name, i) => (
                                <option key={i} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Variedad */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-black dark:text-white">
                            Variedad
                        </label>
                        <select
                            className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 dark:bg-meta-4 focus:border-primary outline-none"
                            value={selectedVarianteId}
                            onChange={(e) => {
                                setSelectedVarianteId(Number(e.target.value));
                                setSelectedTamanoId(0);
                            }}
                            disabled={!selectedProductName}
                        >
                            <option value={0}>Seleccione Variedad</option>
                            {availableVariantes.map(v => (
                                <option key={v.id} value={v.id}>{v.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tamaño */}
                    <div className="col-span-2">
                        <label className="mb-2 block text-sm font-bold text-black dark:text-white">
                            Tamaño
                        </label>
                        <select
                            className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 dark:bg-meta-4 focus:border-primary outline-none"
                            value={selectedTamanoId}
                            onChange={(e) => {
                                setSelectedTamanoId(Number(e.target.value));
                            }}
                            disabled={!selectedVarianteId}
                        >
                            <option value={0}>Seleccione Tamaño</option>
                            {availableTamanos.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-meta-4 dark:text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTamanoId}
                        className="px-6 py-2 rounded-md bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Selección
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
