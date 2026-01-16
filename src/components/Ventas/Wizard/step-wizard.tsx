"use client";

interface StepWizardProps {
    currentStep: number;
}

export function StepWizard({ currentStep, onStepClick }: { currentStep: number; onStepClick?: (step: number) => void }) {
    const steps = [
        { number: 1, title: "Datos del Pedido" },
        { number: 2, title: "Líneas y Detalles" },
        { number: 3, title: "Resumen y Confirmación" },
    ];

    return (
        <div className="relative flex justify-between">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -z-1 h-1 w-full -translate-y-1/2 bg-gray-200 dark:bg-meta-4"></div>
            <div
                className="absolute left-0 top-1/2 -z-1 h-1 -translate-y-1/2 bg-primary transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step) => (
                <div
                    key={step.number}
                    className={`flex flex-col items-center bg-white dark:bg-boxdark px-2 z-10 ${onStepClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => onStepClick && onStepClick(step.number)}
                >
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-colors ${currentStep >= step.number
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-gray-500 dark:border-strokedark dark:bg-meta-4"
                            }`}
                    >
                        {currentStep > step.number ? "✓" : step.number}
                    </div>
                    <span className="mt-2 text-sm font-medium text-black dark:text-white sm:text-base">
                        {step.title}
                    </span>
                </div>
            ))}
        </div>
    );
}
