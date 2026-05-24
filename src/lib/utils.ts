import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combina clases de Tailwind sin conflictos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Etiquetas legibles para los estados del activo
export const STATUS_LABELS: Record<string, string> = {
  OPERATIVO:         "Operativo",
  EN_MANTENIMIENTO:  "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
  DADO_DE_BAJA:      "Dado de baja",
};

// Colores Tailwind para cada estado
export const STATUS_COLORS: Record<string, string> = {
  OPERATIVO:         "bg-green-500/15 text-green-400 border border-green-500/30",
  EN_MANTENIMIENTO:  "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  FUERA_DE_SERVICIO: "bg-red-500/15 text-red-400 border border-red-500/30",
  DADO_DE_BAJA:      "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};