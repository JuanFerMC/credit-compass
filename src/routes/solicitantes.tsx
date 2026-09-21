import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/page";
import { api, applicantSchema, type ApplicantDetail, type ApplicantInput, ApiRequestError, isApiConfigured } from "@/lib/api";
import { applicants } from "@/lib/demo-data";

export const Route = createFileRoute("/solicitantes")({
  head: () => ({ meta: [
    { title: "Solicitantes — Veridica" }, { name: "description", content: "Registro y consulta de solicitantes para evaluación crediticia." },
    { property: "og:title", content: "Solicitantes — Veridica" }, { property: "og:description", content: "Registro y consulta de solicitantes para evaluación crediticia." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ApplicantsPage,
});

const emptyForm: ApplicantInput = { nombreCompleto: "", numeroDocumento: "", ingresosMensuales: 0, deudasMensuales: 0, numeroMoras: 0, historialCrediticio: "BUENO", antiguedadLaboral: 0 };

function ApplicantsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ApplicantInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [document, setDocument] = useState("");
  const [result, setResult] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ApplicantInput>(key: K, value: ApplicantInput[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setNotice("");
    const parsed = applicantSchema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); return; }
    setErrors({}); setLoading(true);
    try {
      if (isApiConfigured) await api.registerApplicant(parsed.data);
      setNotice(isApiConfigured ? "Solicitante registrado correctamente." : "Validación completada. Conecta la API para guardar el registro.");
      setForm(emptyForm); setOpen(false);
    } catch (error) { setNotice(error instanceof ApiRequestError ? `${error.message}${error.traceId ? ` · Referencia ${error.traceId}` : ""}` : "No fue posible registrar el solicitante."); }
    finally { setLoading(false); }
  }

  async function search(event: FormEvent) {
    event.preventDefault(); setNotice("");
    const valid = z.string().regex(/^\d{6,15}$/).safeParse(document);
    if (!valid.success) { setNotice("El documento debe contener entre 6 y 15 dígitos."); return; }
    setLoading(true);
    try {
      if (isApiConfigured) setResult(await api.findApplicant(document));
      else {
        const found = applicants.find((item) => item.document === document) ?? applicants[0];
        setResult({ idSolicitante: 101, fechaRegistro: "2026-09-18T09:30:00", nombreCompleto: found.name, numeroDocumento: found.document, ingresosMensuales: found.income, deudasMensuales: found.debt, numeroMoras: found.arrears, historialCrediticio: found.history, antiguedadLaboral: 5 });
      }
    } catch (error) { setResult(null); setNotice(error instanceof ApiRequestError && error.status === 404 ? "No encontramos un solicitante con ese documento." : "La consulta no pudo completarse."); }
    finally { setLoading(false); }
  }

  return <>
    <PageHeader eyebrow="Gestión de personas" title="Solicitantes" description="Registra la información financiera y consulta perfiles existentes antes de iniciar una evaluación." action={<Button onClick={() => setOpen(true)}><UserPlus className="size-4" />Nuevo solicitante</Button>} />
    <DemoNotice />
    {notice && <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm" role="status" aria-live="polite">{notice}</div>}
    <Panel className="p-5 sm:p-6">
      <form onSubmit={search} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Field label="Buscar por número de documento" htmlFor="documento" hint="Entre 6 y 15 dígitos, sin puntos ni espacios."><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input id="documento" value={document} onChange={(event) => setDocument(event.target.value.replace(/\D/g, "").slice(0, 15))} className="form-control pl-10" inputMode="numeric" autoComplete="off" /></div></Field>
        <Button type="submit" className="self-start sm:mt-[1.65rem]" disabled={loading}>{loading ? "Consultando…" : "Consultar"}</Button>
      </form>
      {result && <div className="mt-6 border-t border-border pt-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Data label="Solicitante" value={result.nombreCompleto} /><Data label="Documento" value={result.numeroDocumento} /><Data label="Ingresos" value={currency(result.ingresosMensuales)} /><Data label="Deudas" value={currency(result.deudasMensuales)} /><Data label="Moras" value={String(result.numeroMoras)} /><Data label="Historial" value={result.historialCrediticio} /><Data label="Antigüedad laboral" value={`${result.antiguedadLaboral} años`} /><Data label="Registro" value={new Date(result.fechaRegistro).toLocaleDateString("es-CO")} /></div></div>}
    </Panel>
    <Panel className="overflow-hidden"><div className="border-b border-border px-5 py-4"><h2 className="font-display text-lg font-bold">Solicitantes recientes</h2><p className="text-sm text-muted-foreground">Datos demostrativos para anticipar la consulta general pendiente.</p></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Nombre</th><th>Documento</th><th>Ingresos</th><th>Historial</th><th>Moras</th></tr></thead><tbody>{applicants.map((item) => <tr key={item.document}><td className="font-semibold">{item.name}</td><td className="font-mono">{item.document}</td><td>{currency(item.income)}</td><td>{item.history}</td><td>{item.arrears}</td></tr>)}</tbody></table></div></Panel>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4"><div role="dialog" aria-modal="true" aria-labelledby="new-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-surface shadow-xl"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border px-5 py-4"><div><h2 id="new-title" className="font-display text-xl font-bold">Nuevo solicitante</h2><p className="text-sm text-muted-foreground">Todos los campos son obligatorios.</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar"><X className="size-5" /></Button></div><form onSubmit={submit} className="grid gap-5 p-5 sm:grid-cols-2">
      <Field label="Nombre completo" htmlFor="nombre" error={errors["nombreCompleto"]}><input id="nombre" className="form-control" value={form.nombreCompleto} onChange={(e) => update("nombreCompleto", e.target.value)} aria-invalid={Boolean(errors["nombreCompleto"])} /></Field>
      <Field label="Número de documento" htmlFor="numero" error={errors["numeroDocumento"]}><input id="numero" className="form-control" inputMode="numeric" value={form.numeroDocumento} onChange={(e) => update("numeroDocumento", e.target.value.replace(/\D/g, ""))} /></Field>
      <Field label="Ingresos mensuales" htmlFor="ingresos" error={errors["ingresosMensuales"]}><input id="ingresos" className="form-control" type="number" min="0" value={form.ingresosMensuales} onChange={(e) => update("ingresosMensuales", Number(e.target.value))} /></Field>
      <Field label="Deudas mensuales" htmlFor="deudas" error={errors["deudasMensuales"]}><input id="deudas" className="form-control" type="number" min="0" value={form.deudasMensuales} onChange={(e) => update("deudasMensuales", Number(e.target.value))} /></Field>
      <Field label="Número de moras" htmlFor="moras" error={errors["numeroMoras"]}><input id="moras" className="form-control" type="number" min="0" step="1" value={form.numeroMoras} onChange={(e) => update("numeroMoras", Number(e.target.value))} /></Field>
      <Field label="Historial crediticio" htmlFor="historial" error={errors["historialCrediticio"]}><select id="historial" className="form-control" value={form.historialCrediticio} onChange={(e) => update("historialCrediticio", e.target.value as ApplicantInput["historialCrediticio"])}><option value="BUENO">Bueno</option><option value="REGULAR">Regular</option><option value="MALO">Malo</option></select></Field>
      <Field label="Antigüedad laboral (años)" htmlFor="antiguedad" error={errors["antiguedadLaboral"]}><input id="antiguedad" className="form-control" type="number" min="0" step="0.1" value={form.antiguedadLaboral} onChange={(e) => update("antiguedadLaboral", Number(e.target.value))} /></Field>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? "Guardando…" : "Registrar solicitante"}</Button></div>
    </form></div></div>}
  </>;
}

function Data({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function currency(value: number) { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value); }