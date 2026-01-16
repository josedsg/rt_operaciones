import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recorre recursivamente un objeto y convierte todos los valores de tipo string a MAYÚSCULAS.
 * Ignora campos que no deben ser convertidos (como IDs, fechas, correos electrónicos si se desea, etc.)
 * Por ahora, convertiremos todos los strings excepto correos electrónicos para ser seguros.
 */
export function toUpperCaseFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toUpperCaseFields(item)) as any;
  }

  const newObj: any = {};
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      // Excluimos campos que usualmente no deben ser uppercase (opcional)
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('url') ||
        lowerKey.includes('sitio_web') ||
        lowerKey.includes('foto') ||
        lowerKey.includes('ficha') ||
        lowerKey.includes('path') ||
        lowerKey.includes('file')
      ) {
        newObj[key] = value;
      } else {
        newObj[key] = value.toUpperCase();
      }
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      newObj[key] = toUpperCaseFields(value);
    } else {
      newObj[key] = value;
    }
  }

  return newObj as T;
}
