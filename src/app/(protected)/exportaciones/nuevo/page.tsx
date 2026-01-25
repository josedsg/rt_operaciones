"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

// Steps
import { StepGeneralInfo } from "@/components/Exportaciones/Wizard/step-general";
import { StepPackingList } from "@/components/Exportaciones/Wizard/step-packing";
import { StepAssorted } from "@/components/Exportaciones/Wizard/step-assorted";
import { StepConfirmation } from "@/components/Exportaciones/Wizard/step-confirmation";

export default function NewExportacionPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Global Wizard State
    const [wizardData, setWizardData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        usuario_id: session?.user?.id, // Will set later if not avail immediately
        pedidos_seleccionados: [] as any[], // Orders selected in Step 1
        estado: "BORRADOR"
    });

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const steps = [
        { number: 1, title: "Información General" },
        { number: 2, title: "Packing List" },
        { number: 3, title: "Configuración Surtidos" },
        { number: 4, title: "Confirmación" }
    ];

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Nueva Exportación
                </h2>
                <nav>
                    <ol className="flex items-center gap-2">
                        <li><a className="font-medium" href="/dashboard">Dashboard /</a></li>
                        <li><a className="font-medium" href="/exportaciones">Exportaciones /</a></li>
                        <li className="font-medium text-primary">Nueva</li>
                    </ol>
                </nav>
            </div>

            {/* Stepper Header */}
            <div className="mb-8 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {steps.map((step) => (
                        <div key={step.number} className={`flex items-center ${currentStep === step.number ? 'text-primary' : 'text-body'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep === step.number ? 'border-primary font-bold' : (currentStep > step.number ? 'border-success bg-success text-white' : 'border-gray-500')} mr-2`}>
                                {currentStep > step.number ? '✓' : step.number}
                            </div>
                            <span className={`hidden sm:inline ${currentStep === step.number ? 'font-bold' : ''}`}>{step.title}</span>
                            {step.number < steps.length && (
                                <div className="mx-4 hidden h-0.5 w-10 bg-gray-300 sm:block"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {currentStep === 1 && (
                    <StepGeneralInfo
                        data={wizardData}
                        updateData={setWizardData}
                        onNext={nextStep}
                    />
                )}
                {/* Placeholders for future steps */}
                {currentStep === 2 && (
                    <StepPackingList
                        data={wizardData}
                        updateData={setWizardData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                )}


                {currentStep === 3 && (
                    <StepAssorted
                        data={wizardData}
                        updateData={setWizardData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                )}
                {currentStep === 4 && (
                    <StepConfirmation
                        data={wizardData}
                        onPrev={prevStep}
                        currentUserId={session?.user && (session.user as any).id ? parseInt((session.user as any).id) : undefined}
                    />
                )}
            </div>
        </div>
    );
}
