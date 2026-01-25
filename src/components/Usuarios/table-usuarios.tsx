'use client';

import { useState } from 'react';
import { PencilSquareIcon, TrashIcon } from '@/assets/icons';
import { useRouter } from 'next/navigation';
import { Usuario } from '@prisma/client';
import { createUsuarioAction, deleteUsuarioAction, updateUsuarioAction } from '@/actions/usuarios';
import toast from 'react-hot-toast';

interface TableUsuariosProps {
    initialData: Usuario[];
}

export default function TableUsuarios({ initialData }: TableUsuariosProps) {
    const router = useRouter();
    // const [data, setData] = useState(initialData); // Removed redundant state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        password: "",
        rol: "USER"
    });

    const openModal = (user: Usuario | null = null) => {
        setEditingUser(user);
        if (user) {
            setFormData({
                nombre: user.nombre,
                email: user.email,
                password: "", // Don't show hash
                rol: user.rol || "USER"
            });
        } else {
            setFormData({ nombre: "", email: "", password: "", rol: "USER" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let result;
            if (editingUser) {
                result = await updateUsuarioAction(editingUser.id, formData);
            } else {
                result = await createUsuarioAction(formData);
            }

            if (result.success) {
                toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
                closeModal();
                router.refresh();
            } else {
                toast.error(result.error || "Ocurrió un error");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este usuario?")) {
            const result = await deleteUsuarioAction(id);
            if (result.success) {
                toast.success("Usuario eliminado");
                router.refresh();
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        }
    }

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    Lista de Usuarios
                </h4>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                >
                    Nuevo Usuario
                </button>
            </div>

            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
                <div className="col-span-3 flex items-center">
                    <p className="font-medium">Nombre</p>
                </div>
                <div className="col-span-3 hidden items-center sm:flex">
                    <p className="font-medium">Email</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="font-medium">Rol</p>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                    <p className="font-medium">Acciones</p>
                </div>
            </div>

            {initialData.map((user) => (
                <div
                    className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
                    key={user.id}
                >
                    <div className="col-span-3 flex items-center">
                        <p className="text-sm text-black dark:text-white capitalize">
                            {user.nombre.toLowerCase()}
                        </p>
                    </div>
                    <div className="col-span-3 hidden items-center sm:flex">
                        <p className="text-sm text-black dark:text-white">
                            {user.email}
                        </p>
                    </div>
                    <div className="col-span-1 flex items-center">
                        <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${user.rol === 'ADMIN' ? 'bg-danger text-danger' :
                            user.rol === 'VENDEDOR' ? 'bg-success text-success' :
                                user.rol === 'EXPORTACIONES' ? 'bg-primary text-primary' :
                                    'bg-warning text-warning'
                            }`}>
                            {user.rol}
                        </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => openModal(user)} className="hover:text-primary" title="Editar">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="hover:text-danger" title="Eliminar">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-8 dark:bg-boxdark shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white">
                            {editingUser ? "Editar Usuario" : "Crear Usuario"}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="mb-2.5 block font-medium text-black dark:text-white">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2.5 block font-medium text-black dark:text-white">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    disabled={!!editingUser} // Optional: allow email edit? Maybe better locked if ID
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2.5 block font-medium text-black dark:text-white">
                                    {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    placeholder={editingUser ? "Dejar vacío para mantener" : "****"}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="mb-2.5 block font-medium text-black dark:text-white">Rol</label>
                                <select
                                    value={formData.rol}
                                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="USER">USER (Restringido)</option>
                                    <option value="VENDEDOR">VENDEDOR (Operativo)</option>
                                    <option value="EXPORTACIONES">EXPORTACIONES (Logística)</option>
                                    <option value="ADMIN">ADMIN (Total)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90"
                                >
                                    {editingUser ? "Actualizar" : "Crear"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
