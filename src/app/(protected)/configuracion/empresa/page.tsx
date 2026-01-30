import { getCompanyConfigAction } from "@/actions/company";
import { CompanyForm } from "@/components/Configuracion/company-form";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Configuración Empresa | RT Operaciones",
    description: "Configuración de datos generales de la empresa",
};

export default async function CompanyConfigPage() {
    const companyData = await getCompanyConfigAction();

    return (
        <>
            <Breadcrumb pageName="Datos Empresa" />
            <div className="mx-auto max-w-270">
                <CompanyForm
                    initialData={companyData ? {
                        ...companyData,
                        telefono: companyData.telefono ?? undefined,
                        email: companyData.email ?? undefined,
                        website: companyData.website ?? undefined,
                        ein_number: companyData.ein_number ?? undefined,
                        logo_url: companyData.logo_url ?? undefined,
                    } : undefined}
                />
            </div>
        </>
    );
}
