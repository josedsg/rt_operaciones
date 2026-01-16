import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "familias");

// Asegurar que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    // Retornar ruta relativa para guardar en DB
    return `/uploads/familias/${fileName}`;
}

export async function deleteFile(relativePath: string) {
    if (!relativePath) return;
    const filePath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
