"use client";

import { CompanyConfigInput, updateCompanyConfigAction } from "@/actions/company";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CompanyFormProps {
    initialData?: CompanyConfigInput | null;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CompanyConfigInput>({
        nombre: "",
        direccion: "",
        telefono: "",
        email: "",
        website: "",
        ein_number: "",
        logo_url: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || "",
                direccion: initialData.direccion || "",
                telefono: initialData.telefono || "",
                email: initialData.email || "",
                website: initialData.website || "",
                ein_number: initialData.ein_number || "",
                logo_url: initialData.logo_url || ""
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await updateCompanyConfigAction(formData);
            if (res.success) {
                toast.success("Configuración actualizada correctamente");
            } else {
                toast.error(res.error || "Error al actualizar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Datos de la Empresa
                </h3>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6.5">
                    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Nombre de la Compañía
                            </label>
                            <input
                                name="nombre"
                                type="text"
                                placeholder="Ej. Rio Tapezco Corp"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                EIN / Tax ID
                            </label>
                            <input
                                name="ein_number"
                                type="text"
                                placeholder="Ej. 33-Miami FL"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.ein_number}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Dirección
                        </label>
                        <textarea
                            name="direccion"
                            rows={3}
                            placeholder="Dirección completa"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.direccion}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Teléfono
                            </label>
                            <input
                                name="telefono"
                                type="text"
                                placeholder="+1 234 567 890"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.telefono}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Email de Contacto
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="contacto@empresa.com"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Sitio Web
                            </label>
                            <input
                                name="website"
                                type="text"
                                placeholder="https://www.ejemplo.com"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.website}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full xl:w-1/2">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Logo URL (Imagen)
                            </label>
                            <input
                                name="logo_url"
                                type="text"
                                placeholder="/path/to/logo.png"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                value={formData.logo_url}
                                onChange={handleChange}
                            />
                            <p className="mt-1 text-xs text-gray-500">De momento ingrese una URL o Ruta relativa (ej. /assets/logos/logo.png).</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
