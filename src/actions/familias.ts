"use server";

import { prisma } from "@/lib/prisma";
import { saveFile, deleteFile } from "@/lib/file-upload";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function getFamiliasAction() {
    try {
        const familias = await prisma.familia.findMany({
            include: {
                grupo: true,
            },
            orderBy: {
                id: "asc",
            },
        });
        return familias;
    } catch (error) {
        console.error("Error al obtener familias:", error);
        return [];
    }
}

export async function createFamiliaAction(formData: FormData) {
    try {
        const nombre_cientifico = formData.get("nombre_cientifico") as string;
        const descripcion = formData.get("descripcion") as string;
        const grupo_id = parseInt(formData.get("grupo_id") as string);
        const codigo_cabys = formData.get("codigo_cabys") as string;
        const partida_arancelaria = formData.get("partida_arancelaria") as string;

        const fotoFile = formData.get("foto") as File;
        const fichaFile = formData.get("ficha_tecnica") as File;

        let fotoPath = null;
        let fichaPath = null;

        if (fotoFile && fotoFile.size > 0) {
            fotoPath = await saveFile(fotoFile);
        }

        if (fichaFile && fichaFile.size > 0) {
            fichaPath = await saveFile(fichaFile);
        }

        const rawData = {
            nombre_cientifico,
            descripcion,
            grupo_id,
            codigo_cabys,
            partida_arancelaria,
            foto: fotoPath,
            ficha_tecnica: fichaPath,
        };

        const familyData = toUpperCaseFields(rawData);

        await prisma.familia.create({
            data: familyData,
        });

        revalidatePath("/productos/configuracion/familias");
    } catch (error) {
        console.error("Error al crear familia:", error);
        throw new Error("No se pudo crear la familia");
    }
}

export async function updateFamiliaAction(formData: FormData) {
    try {
        const id = parseInt(formData.get("id") as string);
        const nombre_cientifico = formData.get("nombre_cientifico") as string;
        const descripcion = formData.get("descripcion") as string;
        const grupo_id = parseInt(formData.get("grupo_id") as string);
        const codigo_cabys = formData.get("codigo_cabys") as string;
        const partida_arancelaria = formData.get("partida_arancelaria") as string;

        const fotoFile = formData.get("foto") as File;
        const fichaFile = formData.get("ficha_tecnica") as File;

        // Obtener datos actuales para ver si hay que borrar archivos viejos
        const familiaActual = await prisma.familia.findUnique({ where: { id } });

        let fotoPath = familiaActual?.foto;
        let fichaPath = familiaActual?.ficha_tecnica;

        if (fotoFile && fotoFile.size > 0) {
            // Borrar anterior si existe
            if (familiaActual?.foto) await deleteFile(familiaActual.foto);
            fotoPath = await saveFile(fotoFile);
        }

        if (fichaFile && fichaFile.size > 0) {
            // Borrar anterior si existe
            if (familiaActual?.ficha_tecnica) await deleteFile(familiaActual.ficha_tecnica);
            fichaPath = await saveFile(fichaFile);
        }

        const rawData = {
            nombre_cientifico,
            descripcion,
            grupo_id,
            codigo_cabys,
            partida_arancelaria,
            foto: fotoPath,
            ficha_tecnica: fichaPath
        };

        const familyData = toUpperCaseFields(rawData);

        await prisma.familia.update({
            where: { id },
            data: familyData
        });

        revalidatePath("/productos/configuracion/familias");
    } catch (error) {
        console.error("Error al actualizar familia:", error);
        throw new Error("No se pudo actualizar la familia");
    }
}

export async function deleteFamiliaAction(id: number) {
    try {
        const familia = await prisma.familia.findUnique({ where: { id } });
        if (familia) {
            if (familia.foto) await deleteFile(familia.foto);
            if (familia.ficha_tecnica) await deleteFile(familia.ficha_tecnica);

            await prisma.familia.delete({ where: { id } });
            revalidatePath("/productos/configuracion/familias");
        }
    } catch (error) {
        console.error("Error eliminando familia:", error);
        throw new Error("No se pudo eliminar la familia");
    }
}
