'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { toUpperCaseFields } from "@/lib/utils";

export async function getUsuariosAction() {
    try {
        return await prisma.usuario.findMany({
            orderBy: { id: 'asc' }
        });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return [];
    }
}

export async function createUsuarioAction(data: any) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        await prisma.usuario.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                email: data.email,
                password: hashedPassword,
                rol: data.rol
            }
        });
        revalidatePath("/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return { success: false, error: "Error al crear usuario. El email podría estar duplicado." };
    }
}

export async function updateUsuarioAction(id: number, data: any) {
    try {
        const updateData: any = {
            nombre: data.nombre.toUpperCase(),
            email: data.email,
            rol: data.rol
        };

        // Update password only if provided
        if (data.password && data.password.trim() !== "") {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        await prisma.usuario.update({
            where: { id },
            data: updateData
        });
        revalidatePath("/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return { success: false, error: "Error al actualizar usuario" };
    }
}

export async function deleteUsuarioAction(id: number) {
    try {
        // Prevent deleting the last admin or self (logic can be improved)
        await prisma.usuario.delete({ where: { id } });
        revalidatePath("/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return { success: false, error: "No se puede eliminar el usuario" };
    }
}
