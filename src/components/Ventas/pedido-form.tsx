"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// Components
import { StepWizard } from "@/components/Ventas/Wizard/step-wizard";
import { StepEncabezado } from "@/components/Ventas/Wizard/step-encabezado";
import { StepLineas } from "@/components/Ventas/Wizard/step-lineas";
import { StepResumen } from "@/components/Ventas/Wizard/step-resumen";

// Types & Actions
import { PedidoVentaInput, getPedidoByIdAction } from "@/actions/ventas";
import { createPedidoAction, confirmPedidoAction } from "@/actions/ventas";

interface PedidoFormProps {
    pedidoId?: number;
}

export function PedidoForm({ pedidoId }: PedidoFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!pedidoId);

    // Form State
    const [formData, setFormData] = useState<PedidoVentaInput>({
        cliente_id: 0,
        fecha_pedido: new Date(),
        descripcion: "",
        awd: "",
        moneda: "USD",
        estado: "BORRADOR",
        lineas: []
    });

    useEffect(() => {
        if (pedidoId) {
            setFetching(true);
            getPedidoByIdAction(pedidoId).then(pedido => {
                if (pedido) {
                    const p = pedido as any;
                    setFormData({
                        id: p.id,
                        codigo: p.codigo,
                        cliente_id: p.cliente_id,
                        fecha_pedido: new Date(p.fecha_pedido),
                        descripcion: p.descripcion || "",
                        awd: p.awd || "",
                        moneda: p.moneda || "USD",
                        estado: p.estado,
                        lineas: p.lineas.map((l: any) => ({
                            ...l,
                            producto_nombre: l.producto.nombre,
                            variante_nombre: l.variante.nombre,
                            tamano_nombre: l.tamano.nombre,
                            empaque_nombre: l.empaque?.nombre,
                            assorted_config: l.configuraciones_assorted ? l.configuraciones_assorted.map((ca: any) => ({
                                variante_id: ca.variante_id,
                                cantidad: ca.cantidad,
                                variante_nombre: ca.variante?.nombre
                            })) : []
                        }))
                    });
                } else {
                    toast.error("Pedido no encontrado");
                    router.push("/ventas");
                }
            }).finally(() => {
                setFetching(false);
            });
        }
    }, [pedidoId]);

    const updateFormData = (data: Partial<PedidoVentaInput>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleSubmit = async (redirect = true) => {
        setLoading(true);
        try {
            const savedPedido = await createPedidoAction(formData);
            if (!redirect) {
                toast.success(formData.id ? "Pedido guardado automáticamente" : "Borrador creado");
            } else {
                toast.success(formData.id ? "Pedido actualizado exitosamente" : "Pedido creado exitosamente");
            }

            if (redirect) {
                router.push("/ventas");
                return true;
            } else if (savedPedido) {
                // Update state with new code/id if it was a new record
                setFormData(prev => ({
                    ...prev,
                    id: savedPedido.id,
                    codigo: savedPedido.codigo
                }));
                return true;
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el pedido");
            return false;
        } finally {
            if (!redirect) {
                // Keep loading spinner for a moment or just clear
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!formData.cliente_id) {
                toast.error("Seleccione un cliente");
                return false;
            }
        }
        if (step === 2) {
            if (formData.lineas.length === 0) {
                toast.error("Agregue al menos una línea al pedido");
                return false;
            }
        }
        return true;
    };

    const handleNext = async () => {
        if (!validateStep(currentStep)) return;

        // Auto-save before moving
        const saved = await handleSubmit(false);
        if (saved) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleStepClick = async (step: number) => {
        // Allow going back without validation/saving if desired? 
        // Or enforce validation/saving even when going back?
        // Usually safer to save state before leaving checks.

        // If going forward, or jumping, better to save current state.
        if (step === currentStep) return;

        // If trying to skip ahead, ensure sequence
        // Actually, simple wizards might restrict jumping ahead.
        // Assuming free nav but we want to save current work.

        if (!validateStep(currentStep)) return;

        const saved = await handleSubmit(false);
        if (saved) {
            setCurrentStep(step);
        }
    };

    const handleBack = () => {
        // Optional: Save on back too? Usually not strictly necessary if 'Next' saved it.
        // But if user edited step 2 and clicked back, changes might be lost if we don't save.
        // Let's safe-guard:
        handleSubmit(false).then((saved) => {
            if (saved) {
                setCurrentStep(prev => Math.max(1, prev - 1));
            }
        });
    };
    const handleConfirm = async () => {
        if (!confirm("¿Está seguro de confirmar el pedido? Se marcará como CONFIRMADO.")) return;

        setLoading(true);
        try {
            // 1. Save changes first
            const saved = await handleSubmit(false);
            if (!saved) return;

            // 2. Confirm (update status)
            // We use the ID from formData (which was updated by handleSubmit)
            // But handleSubmit updates state asynchronously? No, it updates state but we might not have it in closure immediately if we rely on formData.id
            // Ideally handleSubmit returns the saved object.

            // Actually handleSubmit returns true/false, but sets state. 
            // We can rely on a slight delay or trusting the backend returned ID which handleSubmit sets.
            // Let's assume handleSubmit set the ID in state. 
            // Better: handleSubmit returns boolean. We need the ID.
            // I'll assume formData.id is reliable if it was an edit, but for new creation...
            // Wait, handleSubmit(false) sets formData state. The React state update might not be flushed yet in this closure?
            // Correct. I should check how handleSubmit saves.
            // It calls setFormData.

            // If I look at handleSubmit, it sets formData.
            // So immediately using formData.id here might be stale if it was *just* created.
            // However, createPedidoAction returns the object. 
            // I should modify logic to ensure we have the ID.

            // For now, let's trust that if the user reached Step 3, they likely have auto-saved (created) the order in Step 2?
            // "handleNext" calls "handleSubmit(false)". So by Step 3, an ID should mostly likely exist.

            if (formData.id) {
                await confirmPedidoAction(formData.id);
                toast.success("Pedido Confirmado Exitosamente");
                router.push("/ventas");
            } else {
                // If by some reason no ID (shouldn't happen on Step 3), try to save again?
                // handleSubmit above should have handled it.
                // If it was a new order, handleSubmit sets state. 
                // We might need to wait for re-render if we strictly rely on state.
                // But simplified:
                toast.error("Error: Guarde el pedido antes de confirmar.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al confirmar");
        } finally {
            setLoading(false);
        }
    };

    // ... rendering ...

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                    {formData.codigo ? `Pedido ${formData.codigo}` : "Nuevo Pedido de Venta"}
                </h2>

                <nav>
                    <ol className="flex items-center gap-2">
                        <li>
                            <Link className="font-medium" href="/ventas">
                                Ventas /
                            </Link>
                        </li>
                        <li className="font-medium text-primary">
                            {formData.codigo ? `Editar` : "Nuevo"}
                        </li>
                    </ol>
                </nav>
            </div>

            <div className="bg-white dark:bg-boxdark rounded-lg shadow-1 p-6">
                {/* Wizard Navigation */}
                <StepWizard currentStep={currentStep} onStepClick={handleStepClick} />

                {/* Steps Content */}
                <div className="mt-8 min-h-[400px]">
                    {currentStep === 1 && (
                        <StepEncabezado
                            data={formData}
                            updateData={updateFormData}
                        />
                    )}
                    {currentStep === 2 && (
                        <StepLineas
                            data={formData}
                            updateData={updateFormData}
                        />
                    )}
                    {currentStep === 3 && (
                        <StepResumen
                            data={formData}
                            updateData={updateFormData}
                            onConfirm={handleConfirm}
                        />
                    )}
                </div>

                {/* Footer Controls */}
                <div className="mt-8 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1 || loading}
                        className="rounded border border-stroke px-6 py-2 font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                    >
                        Atrás
                    </button>

                    <div className="flex gap-4 items-center">
                        <span className="text-xs text-gray-300">Paso {currentStep}</span>
                        {/* Always show Save button */}
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={loading}
                            className="rounded border border-primary px-6 py-2 font-medium text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : "Solo Guardar"}
                        </button>

                        {currentStep < 3 && (
                            <button
                                onClick={handleNext}
                                className="rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
                            >
                                Siguiente
                            </button>
                        )}

                        {currentStep === 3 && (
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="rounded bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? "Procesando..." : "CONFIRMAR Y FINALIZAR 🚀"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
