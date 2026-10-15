import { z } from "zod";

// Política de contraseña del Security-Module (12 a 72 caracteres). Se valida al
// crear usuario o cambiar contraseña, NUNCA en el login: usuarios con claves
// antiguas deben poder entrar.
export const passwordSchema = z
  .string()
  .min(12, "Usa al menos 12 caracteres")
  .max(72, "Usa como máximo 72 caracteres");
