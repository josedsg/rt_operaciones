"use client";

import { useState, useEffect } from "react";
import { Proveedor } from "@prisma/client";
import { createProveedorAction, updateProveedorAction } from "@/actions/proveedores";
import toast from "react-hot-toast";
import ProveedorProductos from "./proveedor-productos";

interface ProveedorFormProps {
    proveedor?: Proveedor | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ProveedorForm({ proveedor, onSuccess, onCancel }: ProveedorFormProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "products">("general");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            if (proveedor) {
                formData.append("id", proveedor.id.toString());
                await updateProveedorAction(formData);
                toast.success("Proveedor actualizado correctamente");
            } else {
                await createProveedorAction(formData);
                toast.success("Proveedor creado correctamente");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Error al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            {proveedor && (
                <div className="flex border-b border-stroke dark:border-strokedark mb-4">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === "general" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
                            }`}
                    >
                        Datos Generales
                    </button>
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === "products" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
                            }`}
                    >
                        Productos Permitidos
                    </button>
                </div>
            )}

            {activeTab === "general" ? (
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Nombre / Razón Social <span className="text-meta-1">*</span>
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                required
                                defaultValue={proveedor?.nombre || ""}
                                placeholder="Ingrese nombre del proveedor"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Código Interno
                            </label>
                            <input
                                type="text"
                                name="codigo"
                                defaultValue={proveedor?.codigo || ""}
                                placeholder="Ej: PROV-001"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Identificación / RUC
                            </label>
                            <input
                                type="text"
                                name="identificacion"
                                defaultValue={proveedor?.identificacion || ""}
                                placeholder="Número de cédula o RUC"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Persona de Contacto
                            </label>
                            <input
                                type="text"
                                name="contacto"
                                defaultValue={proveedor?.contacto || ""}
                                placeholder="Nombre del contacto principal"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                defaultValue={proveedor?.email || ""}
                                placeholder="ejemplo@correo.com"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Teléfono
                            </label>
                            <input
                                type="text"
                                name="telefono"
                                defaultValue={proveedor?.telefono || ""}
                                placeholder="Número de contacto"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="es_principal"
                                    defaultChecked={proveedor?.es_principal || false}
                                    className="form-checkbox h-5 w-5 text-primary border-stroke rounded focus:ring-primary"
                                />
                                <span className="text-black dark:text-white font-medium">
                                    Es Proveedor Principal
                                </span>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2.5 block text-black dark:text-white font-medium">
                                Dirección Física
                            </label>
                            <textarea
                                name="direccion"
                                rows={3}
                                defaultValue={proveedor?.direccion || ""}
                                placeholder="Ingrese la dirección completa"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                        >
                            {loading ? "Procesando..." : proveedor ? "Actualizar Proveedor" : "Guardar Proveedor"}
                        </button>
                    </div>
                </form>
            ) : (
                <ProveedorProductos proveedorId={proveedor!.id} />
            )}
        </div>
    );
}
