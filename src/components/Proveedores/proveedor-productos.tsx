"use client";

import { useEffect, useState } from "react";
import { ProductoMaestroWithRelations, getProductosMaestrosAction } from "@/actions/productos-maestros";
import { getProductosByProveedorAction, updateProductosProveedorAction } from "@/actions/proveedores";
import toast from "react-hot-toast";

interface ProveedorProductosProps {
    proveedorId: number;
}

export default function ProveedorProductos({ proveedorId }: ProveedorProductosProps) {
    const [allProducts, setAllProducts] = useState<ProductoMaestroWithRelations[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [prodsRes, currentProds] = await Promise.all([
                    getProductosMaestrosAction({ limit: 1000 }),
                    getProductosByProveedorAction(proveedorId)
                ]);
                setAllProducts(prodsRes.data);
                setSelectedProductIds(currentProds.map((p: any) => p.producto_id));
            } catch (error) {
                console.error("Error loading provider products:", error);
                toast.error("Error al cargar productos");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [proveedorId]);

    const handleToggleProduct = (productId: number) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProductosProveedorAction(proveedorId, selectedProductIds);
            toast.success("Productos actualizados correctamente");
        } catch (error) {
            toast.error("Error al guardar productos");
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = allProducts.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        p.familia.nombre_cientifico.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-4">Cargando productos...</div>;

    return (
        <div className="p-4 border-t border-stroke dark:border-strokedark mt-4">
            <h4 className="text-xl font-semibold text-black dark:text-white mb-4">
                Productos Permitidos
            </h4>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar producto para asociar..."
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const allIds = filteredProducts.map(p => p.id);
                            const allSelected = allIds.every(id => selectedProductIds.includes(id));
                            if (allSelected) {
                                setSelectedProductIds(prev => prev.filter(id => !allIds.includes(id)));
                            } else {
                                const newIds = allIds.filter(id => !selectedProductIds.includes(id));
                                setSelectedProductIds(prev => [...prev, ...newIds]);
                            }
                        }}
                        className="text-sm text-primary font-medium hover:underline"
                    >
                        {filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))
                            ? "Deseleccionar Todos"
                            : "Seleccionar Todos"}
                    </button>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500">{filteredProducts.length} filtrados</span>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-stroke dark:border-strokedark rounded-md mb-4">
                <table className="w-full table-auto">
                    <thead className="sticky top-0 bg-gray-2 dark:bg-meta-4 z-10">
                        <tr>
                            <th className="py-2 px-4 text-left font-medium w-16">
                                <input
                                    type="checkbox"
                                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))}
                                    onChange={() => {
                                        const allIds = filteredProducts.map(p => p.id);
                                        const allSelected = allIds.every(id => selectedProductIds.includes(id));
                                        if (allSelected) {
                                            setSelectedProductIds(prev => prev.filter(id => !allIds.includes(id)));
                                        } else {
                                            const newIds = allIds.filter(id => !selectedProductIds.includes(id));
                                            setSelectedProductIds(prev => [...prev, ...newIds]);
                                        }
                                    }}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="py-2 px-4 text-left font-medium">Familia / Producto</th>
                            <th className="py-2 px-4 text-left font-medium">Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(
                            filteredProducts.reduce((acc, curr) => {
                                const fam = curr.familia.nombre_cientifico;
                                if (!acc[fam]) acc[fam] = [];
                                acc[fam].push(curr);
                                return acc;
                            }, {} as Record<string, typeof filteredProducts>)
                        ).sort((a, b) => a[0].localeCompare(b[0])).map(([familiaName, products]) => {
                            const allFamilySelected = products.every(p => selectedProductIds.includes(p.id));
                            const someFamilySelected = products.some(p => selectedProductIds.includes(p.id));

                            return (
                                <>
                                    {/* Header de Familia */}
                                    <tr key={`fam-${familiaName}`} className="bg-gray-100 dark:bg-meta-4 font-bold">
                                        <td className="py-2 px-4">
                                            <input
                                                type="checkbox"
                                                checked={allFamilySelected}
                                                ref={input => {
                                                    if (input) {
                                                        input.indeterminate = someFamilySelected && !allFamilySelected;
                                                    }
                                                }}
                                                onChange={() => {
                                                    const familyIds = products.map(p => p.id);
                                                    if (allFamilySelected) {
                                                        setSelectedProductIds(prev => prev.filter(id => !familyIds.includes(id)));
                                                    } else {
                                                        const newIds = familyIds.filter(id => !selectedProductIds.includes(id));
                                                        setSelectedProductIds(prev => [...prev, ...newIds]);
                                                    }
                                                }}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td colSpan={2} className="py-2 px-4 text-primary">
                                            {familiaName} <span className="text-xs text-gray-500 font-normal">({products.length} productos)</span>
                                        </td>
                                    </tr>
                                    {/* Productos de la Familia */}
                                    {products.map(p => (
                                        <tr key={p.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4/50">
                                            <td className="py-2 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProductIds.includes(p.id)}
                                                    onChange={() => handleToggleProduct(p.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ml-1"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-sm pl-8">
                                                {p.nombre}
                                            </td>
                                            <td className="py-2 px-4 text-xs text-gray-500">
                                                {p.descripcion}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            );
                        })}

                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-4 text-center text-gray-500">
                                    No se encontraron productos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center bg-gray-50 dark:bg-meta-4 p-3 rounded">
                <div className="text-sm font-medium">
                    {selectedProductIds.length} productos seleccionados
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar Cambios de Productos"}
                </button>
            </div>
        </div>
    );
}
