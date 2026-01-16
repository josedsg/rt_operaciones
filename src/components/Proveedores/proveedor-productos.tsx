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

            <div className="max-h-60 overflow-y-auto border border-stroke dark:border-strokedark rounded-md mb-4">
                <table className="w-full table-auto">
                    <thead className="sticky top-0 bg-gray-2 dark:bg-meta-4">
                        <tr>
                            <th className="py-2 px-4 text-left font-medium">Asociar</th>
                            <th className="py-2 px-4 text-left font-medium">Familia</th>
                            <th className="py-2 px-4 text-left font-medium">Producto / Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((p) => (
                            <tr key={p.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                <td className="py-2 px-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(p.id)}
                                        onChange={() => handleToggleProduct(p.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="py-2 px-4 text-sm">{p.familia.nombre_cientifico}</td>
                                <td className="py-2 px-4">
                                    <div className="text-sm font-medium">{p.nombre}</div>
                                    <div className="text-xs text-gray-500">{p.descripcion}</div>
                                </td>
                            </tr>
                        ))}
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
