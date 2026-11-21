import { useState, type FormEvent, type ReactNode } from "react";
import { Download, FileSpreadsheet, FileText, Plus, Trash2 } from "lucide-react";
import { api, type ApplicantDetail, ApiRequestError } from "@/api/client";
import {
  evaluationQueryApi,
  type ExportReportFormat,
} from "@/api/evaluation-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SelectedApplicant = Pick<
  ApplicantDetail,
  "idSolicitante" | "nombreCompleto" | "numeroDocumento"
>;
type ReportFormat = ExportReportFormat | "both";

const MAX_APPLICANTS = 50;

export function ExportReportsDialog({
  currentApplicant,
}: {
  currentApplicant?: ApplicantDetail;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedApplicant[]>([]);
  const [document, setDocument] = useState("");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelected(currentApplicant ? [toSelectedApplicant(currentApplicant)] : []);
      setDocument("");
      setFormat("pdf");
      setError("");
      setNotice("");
    }
  }

  async function addApplicant(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\d{6,15}$/.test(document)) {
      setError("Ingresa un documento válido de entre 6 y 15 dígitos.");
      return;
    }
    if (selected.length >= MAX_APPLICANTS) {
      setError(`Puedes incluir como máximo ${MAX_APPLICANTS} solicitantes por reporte.`);
      return;
    }

    setSearching(true);
    try {
      const applicant = await api.findApplicant(document);
      if (selected.some((item) => item.idSolicitante === applicant.idSolicitante)) {
        setError("Este solicitante ya está incluido en el reporte.");
        return;
      }
      setSelected((current) => [...current, toSelectedApplicant(applicant)]);
      setDocument("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError && requestError.status === 404
          ? "No encontramos un solicitante con ese documento."
          : errorText(requestError, "No fue posible consultar el solicitante."),
      );
    } finally {
      setSearching(false);
    }
  }

  async function exportReports() {
    if (!selected.length) {
      setError("Agrega al menos un solicitante al reporte.");
      return;
    }
    setExporting(true);
    setError("");
    setNotice("");
    const ids = selected.map((item) => item.idSolicitante);
    const formats: ExportReportFormat[] =
      format === "both" ? ["pdf", "excel"] : [format];

    try {
      for (const reportFormat of formats) {
        const report = await evaluationQueryApi.exportReport(reportFormat, ids);
        const url = URL.createObjectURL(report.blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = report.filename;
        link.style.display = "none";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setNotice(
        formats.length === 2
          ? "Se generaron las descargas PDF y Excel."
          : `Se generó la descarga ${format.toUpperCase()}.`,
      );
    } catch (requestError) {
      setError(errorText(requestError, "No fue posible completar la exportación."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Download className="size-4" />
          Exportar reportes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Exportar reportes</DialogTitle>
          <DialogDescription>
            Selecciona los solicitantes y el formato para descargar su historial de evaluaciones.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Solicitantes incluidos</h3>
            <p className="text-xs text-muted-foreground">
              Puedes agregar hasta {MAX_APPLICANTS} solicitantes buscando por documento.
            </p>
          </div>
          <form onSubmit={addApplicant} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="export-applicant-document">
              Documento del solicitante
            </label>
            <input
              id="export-applicant-document"
              className="form-control"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Número de documento"
              value={document}
              onChange={(event) =>
                setDocument(event.target.value.replace(/\D/g, "").slice(0, 15))
              }
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={searching || !/^\d{6,15}$/.test(document)}
            >
              <Plus className="size-4" />
              {searching ? "Buscando…" : "Agregar"}
            </Button>
          </form>

          <ul
            className="max-h-48 space-y-2 overflow-y-auto"
            aria-label="Solicitantes seleccionados"
          >
            {selected.map((applicant) => (
              <li
                key={applicant.idSolicitante}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{applicant.nombreCompleto}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {applicant.numeroDocumento}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label={`Quitar a ${applicant.nombreCompleto}`}
                  onClick={() =>
                    setSelected((current) =>
                      current.filter((item) => item.idSolicitante !== applicant.idSolicitante),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
            {selected.length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No hay solicitantes seleccionados.
              </li>
            )}
          </ul>
          <p className="text-right text-xs text-muted-foreground">
            {selected.length} de {MAX_APPLICANTS} solicitantes
          </p>
        </section>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Formato del reporte</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            <FormatOption
              value="pdf"
              selected={format}
              onSelect={setFormat}
              label="PDF"
              description="Documento PDF"
              icon={<FileText className="size-5" />}
            />
            <FormatOption
              value="excel"
              selected={format}
              onSelect={setFormat}
              label="Excel"
              description="Libro de cálculo"
              icon={<FileSpreadsheet className="size-5" />}
            />
            <FormatOption
              value="both"
              selected={format}
              onSelect={setFormat}
              label="Ambos"
              description="PDF y Excel"
              icon={<Download className="size-5" />}
            />
          </div>
        </fieldset>

        {error && (
          <p className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-border p-3 text-sm" role="status">
            {notice}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={exporting}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={() => void exportReports()}
            disabled={exporting || selected.length === 0}
          >
            <Download className="size-4" />
            {exporting ? "Generando…" : "Generar reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormatOption({
  value,
  selected,
  onSelect,
  label,
  description,
  icon,
}: {
  value: ReportFormat;
  selected: ReportFormat;
  onSelect: (value: ReportFormat) => void;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  const active = selected === value;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${active ? "border-primary bg-accent-soft" : "border-border hover:bg-surface"}`}
    >
      <input
        type="radio"
        name="export-format"
        value={value}
        checked={active}
        onChange={() => onSelect(value)}
        className="accent-primary"
      />
      <span className="text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function toSelectedApplicant(applicant: ApplicantDetail): SelectedApplicant {
  return {
    idSolicitante: applicant.idSolicitante,
    nombreCompleto: applicant.nombreCompleto,
    numeroDocumento: applicant.numeroDocumento,
  };
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
