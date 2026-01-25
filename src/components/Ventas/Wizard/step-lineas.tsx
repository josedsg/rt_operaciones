"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { PedidoVentaInput, LineaPedidoInput, getProveedoresAction, ConfiguracionAssortedInput } from "@/actions/ventas";
import { getFamiliasAction } from "@/actions/familias";
import { getProductosMaestrosAction, ProductoMaestroWithRelations } from "@/actions/productos-maestros";
import { getClienteByIdAction } from "@/actions/clientes";
import { getProductosByProveedorAction } from "@/actions/proveedores";
import { getEmpaquesAction } from "@/actions/empaques";
import { Familia, Proveedor } from "@prisma/client";
import toast from "react-hot-toast";
import { AssortedModal } from "./assorted-modal";

interface StepLineasProps {
    data: PedidoVentaInput;
    updateData: (data: Partial<PedidoVentaInput>) => void;
    isReadOnly?: boolean;
}

export function StepLineas({ data, updateData, isReadOnly = false }: StepLineasProps) {
    // Catalogs
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [familias, setFamilias] = useState<Familia[]>([]);
    const [allProductos, setAllProductos] = useState<ProductoMaestroWithRelations[]>([]);
    const [empaques, setEmpaques] = useState<any[]>([]);
    const [currentCliente, setCurrentCliente] = useState<any>(null);

    const monedaSimbolo = data.moneda === 'CRC' ? '₡' : '$';

    // UI State for Filters/Search
    const [searchFamilia, setSearchFamilia] = useState("");
    const [searchProducto, setSearchProducto] = useState("");
    const [selectedTipoEmpaque, setSelectedTipoEmpaque] = useState<number>(0);
    const [selectedEmpaqueId, setSelectedEmpaqueId] = useState<number>(0);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [allowedProductIds, setAllowedProductIds] = useState<number[] | null>(null);

    // Refs for focus management
    const proveedorRef = useRef<HTMLSelectElement>(null);

    // Focus initial on mount
    useEffect(() => {
        // Pequeño timeout para asegurar que el DOM esté listo
        const timer = setTimeout(() => {
            proveedorRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Initial load
    useEffect(() => {
        Promise.all([
            getProveedoresAction(),
            getFamiliasAction(),
            getProductosMaestrosAction({ page: 1, limit: 1000 }),
            getEmpaquesAction()
        ]).then(([provs, fams, prodRes, emps]) => {
            setProveedores(provs);
            setFamilias(fams);
            setAllProductos(prodRes.data);
            setEmpaques(emps);
        });
    }, []);

    // ... (rest of the logic remains similar, but now we have empaques)

    const tiposEmpaque = useMemo(() => {
        const unique = new Set();
        const list: any[] = [];
        empaques.forEach(e => {
            if (e.tipo_empaque && !unique.has(e.tipo_empaque.id)) {
                unique.add(e.tipo_empaque.id);
                list.push(e.tipo_empaque);
            }
        });
        return list;
    }, [empaques]);



    // ...

    // Line Form State
    const [newLine, setNewLine] = useState<LineaPedidoInput>({
        familia_id: 0,
        producto_id: 0,
        variante_id: 0,
        tamano_id: 0,
        proveedor_id: 0,
        cantidad: 0,
        precio_unitario: 0,
        precio_proveedor: 0,
        impuesto: 13,
        especificaciones: "",
        exoneracion: 0,
        cajas: 0,
        stems_per_bunch: 0,
        bunches_per_box: 0,
        stems_per_box: 0
    });

    // Cargar productos permitidos por proveedor
    useEffect(() => {
        if (newLine.proveedor_id) {
            getProductosByProveedorAction(newLine.proveedor_id).then(res => {
                setAllowedProductIds(res.map((rp: any) => rp.producto_id));
            });
        } else {
            setAllowedProductIds(null);
        }
    }, [newLine.proveedor_id]);

    // Memoized filtered lists
    const filteredFamilias = useMemo(() => {
        return familias.filter(f => {
            const matchesSearch = f.nombre_cientifico.toLowerCase().includes(searchFamilia.toLowerCase());

            // Si hay un proveedor seleccionado, solo mostrar familias que tengan productos de ese proveedor
            if (allowedProductIds !== null) {
                const hasProductsForProvider = allProductos.some(p =>
                    p.familia_id === f.id && allowedProductIds.includes(p.id)
                );
                return matchesSearch && hasProductsForProvider;
            }

            return matchesSearch;
        });
    }, [familias, searchFamilia, allowedProductIds, allProductos]);

    // State for cascading selection
    const [selectedProductName, setSelectedProductName] = useState<string>("");
    const [selectedVarianteId, setSelectedVarianteId] = useState<number>(0);
    const [selectedTamanoId, setSelectedTamanoId] = useState<number>(0);
    const [isAssortedModalOpen, setIsAssortedModalOpen] = useState(false);

    // Initial filtered products (by Family + Provider)
    const accessableProductos = useMemo(() => {
        if (!newLine.familia_id) return [];
        return allProductos.filter(p => {
            const matchesFamilia = p.familia_id === newLine.familia_id;
            const isAllowedByProvider = allowedProductIds === null || allowedProductIds.includes(p.id);
            return matchesFamilia && isAllowedByProvider;
        });
    }, [allProductos, newLine.familia_id, allowedProductIds]);

    // 1. Unique Product Names
    const uniqueProductNames = useMemo(() => {
        const names = new Set<string>();
        accessableProductos.forEach(p => names.add(p.nombre));
        return Array.from(names).sort();
    }, [accessableProductos]);

    // 2. Available Variantes for selected Name
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

    // 3. Available Tamanos for selected Name + Variety
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

    // Effect: Resolve final Product ID when all 3 are selected
    useEffect(() => {
        if (selectedProductName && selectedVarianteId && selectedTamanoId) {
            const match = accessableProductos.find(p =>
                p.nombre === selectedProductName &&
                p.variante_id === selectedVarianteId &&
                p.tamano_id === selectedTamanoId
            );
            if (match) {
                setNewLine(prev => ({ ...prev, producto_id: match.id }));
            }
        }
    }, [selectedProductName, selectedVarianteId, selectedTamanoId, accessableProductos]);

    // Effect: Partial Reset logic
    // When Familia changes, everything resets (handled by newLine.familia_id change implicitly effectively clearing accessableProductos)
    // Make sure we clear local state when switching families if needed, OR just rely on UI state.

    // When editing: populate local state from newLine.producto_id
    useEffect(() => {
        if (newLine.producto_id) {
            const p = allProductos.find(prod => prod.id === newLine.producto_id);
            if (p) {
                // Only update if different (to avoid loops, though strict equality check simplifies)
                if (p.nombre !== selectedProductName) setSelectedProductName(p.nombre);
                if (p.variante_id !== selectedVarianteId) setSelectedVarianteId(p.variante_id);
                if (p.tamano_id !== selectedTamanoId) setSelectedTamanoId(p.tamano_id);
            }
        } else if (!isEditing) {
            // If we are ADDING and there is no product ID, we might want to clear, 
            // BUT we don't want to clear if the user is in the middle of selecting logic.
            // Usually, when 'newLine' is reset (after add), producto_id becomes 0.
            if (newLine.producto_id === 0 && !selectedProductName && !selectedVarianteId) {
                // Already cleared or initial
            }
        }
    }, [newLine.producto_id, allProductos, isEditing]);

    // Helper to clear local selection when adding new line
    useEffect(() => {
        if (newLine.producto_id === 0 && !isEditing) {
            // We can check if we need to reset. 
            // If we just added a line, newLine resets.
            // We should reset selection state too.
            // But we need to distinguishes between "Start typing" and "Reset".
            // Let's rely on the parent clearing newLine.
        }
    }, [newLine]);

    const filteredProductos = useMemo(() => {
        // Keep this strictly for compatibility if used elsewhere, 
        // OR replace its usage. 
        // The original code used this for the single Combobox. 
        // We will replace the Combobox, so this might be obsolete, 
        // BUT we might want to keep it valid just in case.
        if (!newLine.familia_id) return [];
        return accessableProductos.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(searchProducto.toLowerCase());
            return matchesSearch;
        });
    }, [accessableProductos, searchProducto]);

    const selectedProduct = useMemo(() => {
        return allProductos.find(p => p.id === newLine.producto_id) || null;
    }, [allProductos, newLine.producto_id]);

    const filteredEmpaques = useMemo(() => {
        let available = empaques;

        // 1. Client Restrictions
        if (currentCliente?.allowed_empaques?.length > 0) {
            const allowedIds = new Set(currentCliente.allowed_empaques.map((ae: any) => ae.empaque_id));
            available = available.filter(e => allowedIds.has(e.id));
        }

        // 2. Product Restrictions
        const productAllowed = selectedProduct?.allowed_empaques;
        if (productAllowed && productAllowed.length > 0) {
            const allowedIds = new Set(productAllowed.map((ae: any) => ae.empaque_id));
            available = available.filter(e => allowedIds.has(e.id));
        }

        // 3. Filter by Type (UI)
        if (selectedTipoEmpaque) {
            available = available.filter(e => e.tipo_empaque_id === selectedTipoEmpaque);
        }

        return available;
    }, [empaques, selectedTipoEmpaque, currentCliente, selectedProduct]);

    // Reset product when familia changes
    useEffect(() => {
        if (newLine.familia_id && selectedProduct && selectedProduct.familia_id !== newLine.familia_id) {
            setNewLine(prev => ({ ...prev, producto_id: 0, variante_id: 0, tamano_id: 0 }));
            setSearchProducto("");
        }
    }, [newLine.familia_id]);

    // Reset family/product when provider changes if not allowed anymore
    useEffect(() => {
        if (allowedProductIds !== null && newLine.producto_id !== 0) {
            if (!allowedProductIds.includes(newLine.producto_id)) {
                setNewLine(prev => ({ ...prev, familia_id: 0, producto_id: 0, variante_id: 0, tamano_id: 0 }));
                setSearchFamilia("");
                setSearchProducto("");
            }
        }
    }, [allowedProductIds]);

    // Calcula cantidad total basado en cajas * (stems_per_bunch * bunches_per_box)
    useEffect(() => {
        const stemsPerBox = (newLine.bunches_per_box || 0) * (newLine.stems_per_bunch || 0);
        const totalAmount = (newLine.cajas || 0) * stemsPerBox;

        if (stemsPerBox !== newLine.stems_per_box || totalAmount !== newLine.cantidad) {
            setNewLine(prev => ({
                ...prev,
                stems_per_box: stemsPerBox,
                cantidad: totalAmount
            }));
        }
    }, [newLine.cajas, newLine.bunches_per_box, newLine.stems_per_bunch]);

    const handleAction = () => {
        if (!newLine.producto_id || !newLine.cantidad || !newLine.proveedor_id) {
            toast.error("Complete los datos requeridos");
            return;
        }

        // Validación: Precio Proveedor <= Precio Venta
        // Esta regla NO aplica si el proveedor es "principal"
        const proveedorSeleccionado = proveedores.find(p => p.id === newLine.proveedor_id);
        const esProveedorPrincipal = proveedorSeleccionado?.es_principal;

        if (!esProveedorPrincipal && newLine.precio_proveedor > newLine.precio_unitario) {
            toast.error("El precio del proveedor no puede ser mayor al precio de venta");
            return;
        }

        const newLines = [...data.lineas];
        const lineWithNames = {
            ...newLine,
            // Ensure IDs are correct from selected product (critical for Foreign Keys)
            variante_id: selectedProduct?.variante_id || newLine.variante_id,
            tamano_id: selectedProduct?.tamano_id || newLine.tamano_id,
            // Names for UI
            producto_nombre: selectedProduct?.nombre,
            variante_nombre: selectedProduct?.variante?.nombre,
            tamano_nombre: selectedProduct?.tamano?.nombre,
        };

        if (isEditing !== null) {
            newLines[isEditing] = lineWithNames;
            toast.success("Línea actualizada");
        } else {
            newLines.push(lineWithNames);
            toast.success("Línea agregada");
        }

        updateData({ lineas: newLines });

        // Reset
        setNewLine({
            familia_id: 0,
            producto_id: 0,
            variante_id: 0,
            tamano_id: 0,
            proveedor_id: 0,
            cantidad: 0,
            precio_unitario: 0,
            precio_proveedor: 0,
            impuesto: 13,
            especificaciones: "",
            exoneracion: 0,
            cajas: 0,
            stems_per_bunch: 0,
            bunches_per_box: 0,
            stems_per_box: 0,
            empaque_nombre: "",
            po: ""
        });
        // We don't need to manually reset search terms anymore as Combobox handles display via 'value'
        // setSearchFamilia(""); 
        // setSearchProducto("");
        setSelectedEmpaqueId(0);
        setIsEditing(null);

        // Return focus to start
        setTimeout(() => {
            proveedorRef.current?.focus();
        }, 50);
    };

    const editLine = (index: number) => {
        const line = data.lineas[index];
        setNewLine({ ...line });
        setIsEditing(index);
        // Desplazar hacia arriba para ver el formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const removeLine = (index: number) => {
        const newLines = [...data.lineas];
        newLines.splice(index, 1);
        updateData({ lineas: newLines });
        if (isEditing === index) setIsEditing(null);
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setNewLine({
            familia_id: 0,
            producto_id: 0,
            variante_id: 0,
            tamano_id: 0,
            proveedor_id: 0,
            cantidad: 0,
            precio_unitario: 0,
            precio_proveedor: 0,
            impuesto: 13,
            especificaciones: "",
            exoneracion: 0,
            cajas: 0,
            stems_per_bunch: 0,
            bunches_per_box: 0,
            stems_per_box: 0,
            empaque_nombre: "",
            po: ""
        });
        setSelectedEmpaqueId(0);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Formulario de Linea Rediseñado */}
            {!isReadOnly && (
                <div className={`rounded-xl border shadow-sm p-8 transition-all duration-300 ${isEditing !== null ? 'bg-blue-50 dark:bg-meta-4 border-primary shadow-md' : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark'}`}>
                    <div className="flex items-center justify-between mb-6 border-b border-stroke dark:border-strokedark pb-4">
                        <h4 className="font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isEditing !== null ? 'bg-primary animate-pulse' : 'bg-success'}`}></div>
                            {isEditing !== null ? 'Editando Línea' : 'Agregar Nuevo Producto'}
                        </h4>
                        {isEditing !== null && (
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-danger transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Fila 1: Origen y Familia */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">1</span>
                                    Proveedor Origen
                                </label>
                                <select
                                    ref={proveedorRef}
                                    className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 dark:bg-meta-4 dark:border-strokedark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm"
                                    value={newLine.proveedor_id || 0}
                                    onChange={(e) => setNewLine({ ...newLine, proveedor_id: Number(e.target.value) })}
                                >
                                    <option value={0}>Seleccione Proveedor</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-7">
                                <Combobox
                                    label={<><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">2</span>Familia / Tipo de Flor</>}
                                    labelClassName="text-sm font-bold text-black dark:text-white" // Custom prominent style
                                    placeholder="Buscar familia..."
                                    options={filteredFamilias.map(f => ({
                                        value: f.id,
                                        label: f.nombre_cientifico,
                                        secondaryLabel: ""
                                    }))}
                                    value={newLine.familia_id}
                                    onChange={(val) => setNewLine({ ...newLine, familia_id: Number(val) })}
                                />
                            </div>
                        </div>


                        {/* Fila 2: Selección en Cascada */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    <span className="mr-2 inline-flex items-center justify-center rounded-full bg-primary h-5 w-5 text-xs text-white">3</span>
                                    Producto
                                </label>
                                <div className="relative z-20 bg-transparent dark:bg-form-input">
                                    <select
                                        className="w-full rounded-md border border-stroke bg-gray-50 py-2 px-4 dark:bg-meta-4 focus:border-primary outline-none text-xs font-bold"
                                        value={selectedProductName}
                                        onChange={(e) => {
                                            setSelectedProductName(e.target.value);
                                            setSelectedVarianteId(0);
                                            setSelectedTamanoId(0);
                                            setNewLine(prev => ({ ...prev, producto_id: 0 }));
                                        }}
                                        disabled={!newLine.familia_id}
                                    >
                                        <option value="">Seleccionar Producto</option>
                                        {uniqueProductNames.map((name, i) => (
                                            <option key={i} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    Variedad
                                </label>
                                <div className="relative z-20 bg-transparent dark:bg-form-input">
                                    <select
                                        className="w-full rounded-md border border-stroke bg-gray-50 py-2 px-4 dark:bg-meta-4 focus:border-primary outline-none text-xs font-bold"
                                        value={selectedVarianteId}
                                        onChange={(e) => {
                                            setSelectedVarianteId(Number(e.target.value));
                                            setSelectedTamanoId(0);
                                            setNewLine(prev => ({ ...prev, producto_id: 0 }));
                                        }}
                                        disabled={!selectedProductName}
                                    >
                                        <option value={0}>Seleccionar Variedad</option>
                                        {availableVariantes.map((v) => (
                                            <option key={v.id} value={v.id}>{v.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    Tamaño
                                </label>
                                <div className="relative z-20 bg-transparent dark:bg-form-input">
                                    <select
                                        className="w-full rounded-md border border-stroke bg-gray-50 py-2 px-4 dark:bg-meta-4 focus:border-primary outline-none text-xs font-bold"
                                        value={selectedTamanoId}
                                        onChange={(e) => {
                                            setSelectedTamanoId(Number(e.target.value));
                                        }}
                                        disabled={!selectedVarianteId}
                                    >
                                        <option value={0}>Seleccionar Tamaño</option>
                                        {availableTamanos.map((t) => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Fila 3: Selección de Empaque Operativo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stroke dark:border-strokedark pt-4">
                            <div>
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">4</span>
                                    Tipo de Empaque
                                </label>
                                <select
                                    className="w-full rounded-md border border-stroke bg-gray-50 py-2 px-4 dark:bg-meta-4 focus:border-primary outline-none text-xs font-bold"
                                    value={selectedTipoEmpaque}
                                    onChange={(e) => {
                                        const tid = Number(e.target.value);
                                        setSelectedTipoEmpaque(tid);
                                        setSelectedEmpaqueId(0);
                                        setNewLine(prev => ({
                                            ...prev,
                                            stems_per_bunch: 0,
                                            bunches_per_box: 0,
                                            empaque_nombre: ""
                                        }));
                                    }}
                                >
                                    <option value={0}>Todos los tipos</option>
                                    {tiposEmpaque.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-3 block text-sm font-bold text-black dark:text-white uppercase tracking-wide">
                                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">5</span>
                                    Configuración de Caja (Empaque)
                                </label>
                                <select
                                    className="w-full rounded-md border border-stroke bg-gray-50 py-2 px-4 dark:bg-meta-4 focus:border-primary outline-none text-xs font-bold uppercase"
                                    value={selectedEmpaqueId}
                                    onChange={(e) => {
                                        const eid = Number(e.target.value);
                                        setSelectedEmpaqueId(eid);
                                        const emp = empaques.find(em => em.id === eid);
                                        if (emp) {
                                            setNewLine(prev => ({
                                                ...prev,
                                                empaque_id: eid,
                                                stems_per_bunch: emp.sxb,
                                                bunches_per_box: emp.bxb,
                                                empaque_nombre: emp.nombre
                                            }));
                                        } else {
                                            setNewLine(prev => ({
                                                ...prev,
                                                empaque_id: 0,
                                                stems_per_bunch: 0,
                                                bunches_per_box: 0,
                                                empaque_nombre: ""
                                            }));
                                        }
                                    }}
                                >
                                    <option value={0}>— Seleccionar Empaque —</option>
                                    {filteredEmpaques.map(e => (
                                        <option key={e.id} value={e.id}>{e.nombre} ({e.sxb}x{e.bxb})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Fila 4: Detalles de Bultos y Precios */}
                        {/* Fila 4: Detalles de Bultos y Precios - IMPROVED LAYOUT */}
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-6 pt-4">
                            {/* Empaque */}

                            <div className="col-span-2 md:col-span-2">
                                <label className="mb-2 block text-xs font-black text-gray-500 uppercase tracking-wider">PO</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-2 border-stroke bg-white py-3 px-4 dark:bg-boxdark focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xl font-black text-center text-black dark:text-white transition-all shadow-sm"
                                    value={newLine.po || ""}
                                    onChange={(e) => setNewLine({ ...newLine, po: e.target.value })}
                                    placeholder="PO#"
                                />
                            </div>

                            {/* Empaque  (Ya estaba el div wrapper, lo reutilizamos para Cajas o lo dividimos) */}
                            <div className="col-span-2 md:col-span-2">


                                <label className="mb-2 block text-xs font-black text-primary uppercase tracking-wider">Cajas</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border-2 border-stroke bg-white py-3 px-4 dark:bg-boxdark focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xl font-black text-center text-black dark:text-white transition-all shadow-sm"
                                    value={newLine.cajas}
                                    onChange={(e) => setNewLine({ ...newLine, cajas: Number(e.target.value) })}
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-tighter">Stems/Bun</label>
                                <input
                                    type="number"
                                    readOnly
                                    tabIndex={-1}
                                    className="w-full rounded-lg border-2 border-primary/30 bg-primary/5 py-3 px-2 dark:bg-meta-4 outline-none text-lg font-bold text-center text-primary cursor-not-allowed"
                                    value={newLine.stems_per_bunch}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-tighter">Bun/Box</label>
                                <input
                                    type="number"
                                    readOnly
                                    tabIndex={-1}
                                    className="w-full rounded-lg border-2 border-primary/30 bg-primary/5 py-3 px-2 dark:bg-meta-4 outline-none text-lg font-bold text-center text-primary cursor-not-allowed"
                                    value={newLine.bunches_per_box}
                                />
                            </div>

                            {/* Precios */}
                            <div className="col-span-2 md:col-span-2">
                                <label className="mb-2 block text-xs font-black text-success uppercase tracking-wider">Precio Unitario</label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-success transition-colors">{monedaSimbolo}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-lg border-2 border-stroke bg-white py-3 pl-8 pr-4 dark:bg-boxdark focus:border-success focus:ring-4 focus:ring-success/10 outline-none text-xl font-black text-success transition-all shadow-sm"
                                        value={newLine.precio_unitario}
                                        onChange={(e) => setNewLine({ ...newLine, precio_unitario: Number(e.target.value) })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="mb-2 block text-xs font-black text-gray-500 uppercase tracking-wider">P. Prov</label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-primary transition-colors">{monedaSimbolo}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-lg border-2 border-stroke bg-white py-3 pl-8 pr-4 dark:bg-boxdark focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xl font-black text-gray-700 dark:text-white transition-all shadow-sm"
                                        value={newLine.precio_proveedor}
                                        onChange={(e) => setNewLine({ ...newLine, precio_proveedor: Number(e.target.value) })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-tighter">IVA %</label>
                                <input
                                    type="number"
                                    readOnly
                                    tabIndex={-1}
                                    className="w-full rounded-lg border-2 border-primary/30 bg-primary/5 py-3 px-2 dark:bg-meta-4 outline-none text-lg font-bold text-center text-primary cursor-not-allowed"
                                    value={newLine.impuesto}
                                />
                            </div>

                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <div>
                                <label className="mb-2 block text-xs font-bold text-black dark:text-white uppercase tracking-wide">
                                    Especificaciones del Producto (Opción Libre)
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full rounded-lg border border-stroke bg-white py-3 px-4 dark:bg-boxdark focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-black dark:text-white transition-all shadow-sm resize-y"
                                    value={newLine.especificaciones || ""}
                                    onChange={(e) => setNewLine({ ...newLine, especificaciones: e.target.value })}
                                    placeholder="Escriba aquí cualquier detalle adicional, instrucciones especiales o notas largas..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-10 gap-6 pt-0">
                            {/* Botón rápido */}
                            <div className="col-span-2 md:col-span-2 flex items-end">
                                {/* Placeholder or secondary action if needed */}
                                <div className="w-full h-full flex items-center justify-center pt-6">
                                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest text-center">
                                        {newLine.cantidad > 0 ? `${newLine.cantidad.toLocaleString()} Tallos` : 'Ingrese Cajas'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fila 5: Resumen Detallado y Acción Principal */}
                        <div className="bg-gray-50 dark:bg-meta-4 p-6 rounded-xl border border-dashed border-gray-300 dark:border-strokedark mt-4">
                            <h5 className="font-bold text-black dark:text-white uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-gray-200 dark:bg-gray-700 text-[10px] px-2 py-0.5 rounded">Vista Previa</span>
                                Detalles de la Línea
                            </h5>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {/* Producto */}
                                <div className="p-3 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Producto</label>
                                    <div className="text-sm font-bold text-black dark:text-white truncate">
                                        {selectedProduct?.nombre || "—"} {selectedProduct?.tamano?.nombre ? `- ${selectedProduct.tamano.nombre}` : ""}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate">{selectedProduct?.variante?.nombre}</div>
                                </div>

                                {/* Volumen */}
                                <div className="p-3 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Volumen</label>
                                    <div className="text-sm font-black text-black dark:text-white">
                                        {newLine.cajas} <span className="text-[10px] font-normal text-gray-500">Cajas</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium truncate">{newLine.empaque_nombre}</div>
                                    <div className="text-[10px] text-gray-500">{(newLine.cantidad || 0).toLocaleString()} Tallos</div>
                                </div>

                                {/* Precio */}
                                <div className="p-3 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio Unit.</label>
                                    <div className="text-sm font-black text-success">
                                        {monedaSimbolo}{(newLine.precio_unitario || 0).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-gray-500">Mas impuestos</div>
                                </div>

                                {/* Total Linea */}
                                <div className="p-3 bg-primary/5 dark:bg-primary/20 rounded-lg shadow-sm border border-primary/20">
                                    <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Total Estimado</label>
                                    <div className="text-lg font-black text-primary">
                                        {monedaSimbolo}{((newLine.cantidad || 0) * (newLine.precio_unitario || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-primary/70">Subtotal Línea</div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 w-full">
                                {selectedProduct && selectedProduct.variante.nombre.toUpperCase().includes("ASSORTED") && (
                                    <button
                                        onClick={() => setIsAssortedModalOpen(true)}
                                        className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border-2 transition-all uppercase tracking-wider ${newLine.assorted_config && newLine.assorted_config.length > 0
                                            ? 'bg-success/10 text-success border-success'
                                            : 'bg-warning/10 text-warning border-warning animate-pulse'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                        {newLine.assorted_config && newLine.assorted_config.length > 0 ? 'Surtido Configurado' : 'Configurar Surtido'}
                                    </button>
                                )}
                                {isEditing !== null ? (
                                    <>
                                        <button
                                            onClick={cancelEdit}
                                            className="rounded-lg border-2 border-stroke bg-white px-8 py-3 font-bold text-black hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white transition-all text-xs uppercase tracking-widest"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleAction}
                                            className="rounded-lg bg-primary px-10 py-3 font-black text-white hover:bg-opacity-90 shadow-lg shadow-primary/20 transition-all text-sm uppercase tracking-wider"
                                        >
                                            Actualizar Línea
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleAction}
                                        className="w-full md:w-auto rounded-lg bg-green-600 px-12 py-4 font-black text-white hover:bg-green-700 shadow-xl shadow-green-700/20 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        AGREGAR A LA LISTA
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )} {/* Tabla de Lineas */}
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4 shadow-sm border-b border-stroke dark:border-strokedark">
                            <th className="py-3 px-4 text-xs font-bold uppercase text-black dark:text-white">Prov.</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-black dark:text-white">Producto</th>
                            <th className="py-3 px-2 text-xs font-bold uppercase text-black dark:text-white">Variedad</th>
                            <th className="py-3 px-2 text-xs font-bold uppercase text-black dark:text-white">Tamaño</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">Cjs.</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">SxB</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">BxB</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">St x Bx</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">Total St.</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-black dark:text-white text-right">P.U.</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">IVA</th>
                            <th className="py-3 px-1 text-xs font-bold uppercase text-black dark:text-white text-center">Exo</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-black dark:text-white text-right">Total</th>
                            <th className="py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.lineas.map((linea, idx) => {
                            const prov = proveedores.find(p => p.id === linea.proveedor_id);
                            const prod = allProductos.find(p => p.id === linea.producto_id);
                            const lineSubtotal = (linea.cantidad || 0) * (linea.precio_unitario || 0);
                            const netTaxRate = Math.max(0, (linea.impuesto || 0) - (linea.exoneracion || 0));
                            const lineTotal = lineSubtotal * (1 + netTaxRate / 100);

                            const isAssorted = (linea.variante_nombre || prod?.variante?.nombre || "").toUpperCase().includes("ASSORTED");
                            const isAssortedMissingConfig = isAssorted && (!linea.assorted_config || linea.assorted_config.length === 0);

                            return (
                                <tr key={idx} className={`border-b border-stroke dark:border-strokedark transition-colors 
                                    ${isEditing === idx ? 'bg-blue-50 dark:bg-meta-4' : ''}
                                    ${isAssortedMissingConfig ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-danger' : 'hover:bg-gray-50 dark:hover:bg-boxdark-2'}
                                `}>
                                    <td className="py-4 px-4 text-xs font-medium">{prov?.nombre || "N/A"}</td>
                                    <td className="py-4 px-4 text-xs font-bold uppercase text-black dark:text-white">
                                        {linea.producto_nombre || prod?.nombre}
                                    </td>
                                    <td className="py-4 px-2 text-xs text-black dark:text-white uppercase text-center flex items-center justify-center gap-1">
                                        {linea.variante_nombre || prod?.variante?.nombre}
                                        {isAssortedMissingConfig && (
                                            <span className="text-danger animate-pulse" title="Surtido no configurado">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                            </span>
                                        )}
                                        {!isAssortedMissingConfig && isAssorted && (
                                            <span className="text-success" title="Surtido configurado">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2 text-xs text-black dark:text-white uppercase text-center">
                                        {linea.tamano_nombre || prod?.tamano?.nombre} {linea.empaque_nombre ? `/ ${linea.empaque_nombre}` : ""}
                                    </td>
                                    <td className="py-4 px-1 text-xs text-center font-semibold">{linea.cajas}</td>
                                    <td className="py-4 px-1 text-xs text-center text-gray-600 dark:text-gray-400">{linea.stems_per_bunch}</td>
                                    <td className="py-4 px-1 text-xs text-center text-gray-600 dark:text-gray-400">{linea.bunches_per_box}</td>
                                    <td className="py-4 px-1 text-xs text-center text-gray-600 dark:text-gray-400">{linea.stems_per_box}</td>
                                    <td className="py-4 px-1 text-xs text-center font-bold text-black dark:text-white">{linea.cantidad}</td>
                                    <td className="py-4 px-4 text-xs text-right text-gray-700 dark:text-gray-300">{monedaSimbolo}{linea.precio_unitario.toFixed(2)}</td>
                                    <td className="py-4 px-1 text-xs text-center text-gray-500">{linea.impuesto}%</td>
                                    <td className="py-4 px-1 text-xs text-center text-danger">{linea.exoneracion}%</td>
                                    <td className="py-4 px-4 font-extrabold text-primary text-xs text-right">{monedaSimbolo}{lineTotal.toFixed(2)}</td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => !isReadOnly && editLine(idx)}
                                                disabled={isReadOnly}
                                                className={`p-1 rounded transition-colors ${isReadOnly ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-white hover:bg-primary'}`}
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => !isReadOnly && removeLine(idx)}
                                                disabled={isReadOnly}
                                                className={`p-1 rounded transition-colors ${isReadOnly ? 'text-gray-400 cursor-not-allowed' : 'text-danger hover:text-white hover:bg-danger'}`}
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {data.lineas.length === 0 && (
                    <div className="text-center py-10 bg-white dark:bg-boxdark border border-t-0 border-stroke dark:border-strokedark rounded-b-sm">
                        <span className="text-gray-400 text-sm">No hay líneas en este pedido. Agregue un producto arriba.</span>
                    </div>
                )}
            </div>

            {/* Totales Section */}
            {
                data.lineas.length > 0 && (
                    <div className="flex justify-end mt-4">
                        <div className="w-full max-w-sm bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-sm p-5 shadow-sm">
                            <h4 className="border-b border-stroke dark:border-strokedark mb-4 pb-2 font-bold text-black dark:text-white uppercase text-xs tracking-wider">
                                Desglose del Pedido
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span className="font-semibold text-black dark:text-white">
                                        {monedaSimbolo}{data.lineas.reduce((acc, l) => acc + (l.cantidad * l.precio_unitario), 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Impuestos (IVA - Exon):</span>
                                    <span className="font-semibold text-black dark:text-white">
                                        {monedaSimbolo}{data.lineas.reduce((acc, l) => {
                                            const sub = l.cantidad * l.precio_unitario;
                                            const netTax = Math.max(0, (l.impuesto || 0) - (l.exoneracion || 0));
                                            return acc + (sub * (netTax / 100));
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg pt-3 border-t border-stroke dark:border-strokedark">
                                    <span className="font-bold text-black dark:text-white">TOTAL FINAL:</span>
                                    <span className="font-black text-primary">
                                        {monedaSimbolo}{data.lineas.reduce((acc, l) => {
                                            const sub = l.cantidad * l.precio_unitario;
                                            const netTax = Math.max(0, (l.impuesto || 0) - (l.exoneracion || 0));
                                            return acc + (sub * (1 + netTax / 100));
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase">
                                    <span>Total Cajas:</span>
                                    <span>{data.lineas.reduce((acc, l) => acc + (l.cajas || 0), 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Panel de Resumen de Especificaciones (Abajo) */}
            <div className="mt-8 border-t border-stroke dark:border-strokedark pt-6">
                <div className="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
                    <div className="bg-gray-100 dark:bg-meta-4 px-6 py-4 border-b border-stroke dark:border-strokedark">
                        <h3 className="font-bold text-black dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Resumen de Notas y Especificaciones
                        </h3>
                    </div>

                    {data.lineas.filter(l => l.especificaciones && l.especificaciones.trim().length > 0).length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No hay notas especiales registradas.
                        </div>
                    ) : (
                        <div className="p-0">
                            {/* Grid layout for notes to save space */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x border-stroke dark:border-strokedark">
                                {data.lineas.map((linea, idx) => {
                                    if (!linea.especificaciones?.trim()) return null;
                                    const prod = allProductos.find(p => p.id === linea.producto_id);
                                    return (
                                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-boxdark-2 transition-colors relative group border-b md:border-b-0 border-stroke">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                                                        Línea #{idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold text-black dark:text-white uppercase line-clamp-1" title={linea.producto_nombre || prod?.nombre}>
                                                        {linea.producto_nombre || prod?.nombre}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => editLine(idx)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-primary hover:bg-primary/10 rounded transition-all"
                                                    title="Editar esta línea"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 italic bg-yellow-50/50 dark:bg-yellow-900/10 p-2 rounded-md border border-yellow-100 dark:border-yellow-900/20">
                                                {linea.especificaciones}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                {selectedProduct && (
                    <AssortedModal
                        isOpen={isAssortedModalOpen}
                        onClose={() => setIsAssortedModalOpen(false)}
                        variantesDisponibles={availableVariantes}
                        initialConfig={newLine.assorted_config}
                        totalTarget={newLine.stems_per_box || 0}
                        onSave={(config) => setNewLine(prev => ({ ...prev, assorted_config: config }))}
                    />
                )}
            </div>
        </div>
    );
}
