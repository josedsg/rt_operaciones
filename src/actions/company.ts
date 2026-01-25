"use server";

import { prisma } from "@/lib/prisma";
import { CompanyConfig } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type CompanyConfigInput = {
    id?: number;
    nombre: string;
    direccion: string;
    telefono?: string;
    email?: string;
    website?: string;
    ein_number?: string;
    logo_url?: string;
};

export async function getCompanyConfigAction() {
    try {
        return await prisma.companyConfig.findFirst();
    } catch (error) {
        console.error("Error fetching company config:", error);
        return null;
    }
}

export async function updateCompanyConfigAction(data: CompanyConfigInput) {
    try {
        const existing = await prisma.companyConfig.findFirst();

        let result;
        if (existing) {
            result = await prisma.companyConfig.update({
                where: { id: existing.id },
                data: {
                    nombre: data.nombre,
                    direccion: data.direccion,
                    telefono: data.telefono,
                    email: data.email,
                    website: data.website,
                    ein_number: data.ein_number,
                    logo_url: data.logo_url,
                }
            });
        } else {
            result = await prisma.companyConfig.create({
                data: {
                    nombre: data.nombre,
                    direccion: data.direccion,
                    telefono: data.telefono,
                    email: data.email,
                    website: data.website,
                    ein_number: data.ein_number,
                    logo_url: data.logo_url,
                }
            });
        }

        revalidatePath("/");
        return { success: true, data: result };
    } catch (error) {
        console.error("Error updating company config:", error);
        return { success: false, error: "Error al actualizar la configuración" };
    }
}
