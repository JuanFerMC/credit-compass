import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import type { z } from "zod";
import { describeAuthError } from "@/lib/auth-errors";
import { zodErrors } from "@/lib/forms";

// Después de extraer AuthShell, a SonarCloud le seguía sobrando ~3% de
// líneas duplicadas entre iniciar-sesion.tsx y crear-cuenta.tsx: el bloque
// de estado (form/errors/loading) + submit() era prácticamente idéntico
// carácter por carácter entre los dos archivos, salvo el schema y la
// función de auth.* a invocar. Ese patrón vive acá.
export function useAuthSubmit<Schema extends z.ZodTypeAny>(
  schema: Schema,
  action: (data: z.infer<Schema>) => Promise<unknown>,
  emptyForm: z.infer<Schema>,
  // Adónde ir tras autenticarse (p. ej. la sección que se intentaba abrir).
  // Quien lo pase debe validarlo con safeRedirect().
  redirectTo = "/panel",
) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      await action(parsed.data);
      router.history.replace(redirectTo);
    } catch (error) {
      // Sin este catch, un fallo de auth.* quedaba como promesa rechazada
      // sin manejar y el formulario no mostraba nada.
      setFormError(describeAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return { form, setForm, errors, formError, loading, submit };
}
