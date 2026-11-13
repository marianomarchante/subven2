"use client";

import * as React from "react";
import { AlertCircle, Building2, Calendar, Euro, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrantDTO, GrantStatusType, UpsertGrantInput } from "@/types/domain";
import { formatCurrency, toInputDateValue } from "@/lib/utils";

interface GrantModalProps {
  open: boolean;
  onClose: () => void;
  initialGrant?: GrantDTO | null;
  onSubmit: (data: UpsertGrantInput) => Promise<{ success: boolean; error?: string }>;
}

const GRANT_STATUS_OPTIONS: { value: GrantStatusType; label: string }[] = [
  { value: "CONCEDIDA", label: "Concedida" },
  { value: "EN_EJECUCION", label: "En Ejecución" },
  { value: "JUSTIFICADA", label: "Justificada" },
  { value: "CERRADA", label: "Cerrada" },
];

const BODY_PRESETS = [
  "Administración General del Estado (PRTR / NextGenerationEU)",
  "Unión Europea (FEDER / FSE+)",
  "Comunidad Autónoma - Consejería de Hacienda",
  "Diputación Provincial - Plan de Cooperación Municipal",
];

export function GrantModal({
  open,
  onClose,
  initialGrant,
  onSubmit,
}: GrantModalProps) {
  const [title, setTitle] = React.useState("");
  const [grantingBody, setGrantingBody] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState("");
  const [resolutionDate, setResolutionDate] = React.useState("");
  const [justificationDeadline, setJustificationDeadline] = React.useState("");
  const [status, setStatus] = React.useState<GrantStatusType>("CONCEDIDA");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setError(null);
      if (initialGrant) {
        setTitle(initialGrant.title);
        setGrantingBody(initialGrant.grantingBody);
        setTotalAmount(String(initialGrant.totalAmount));
        setResolutionDate(toInputDateValue(initialGrant.resolutionDate));
        setJustificationDeadline(toInputDateValue(initialGrant.justificationDeadline));
        setStatus(initialGrant.status);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        setTitle("");
        setGrantingBody("");
        setTotalAmount("");
        setResolutionDate(today);
        setJustificationDeadline(nextYear);
        setStatus("CONCEDIDA");
      }
    }
  }, [open, initialGrant]);

  const parsedAmount = Number(totalAmount) || 0;
  const minAllowedAmount = initialGrant?.allocatedTotal ?? 0;
  const isBelowAllocated =
    Boolean(initialGrant) && parsedAmount > 0 && parsedAmount + 0.005 < minAllowedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !grantingBody.trim()) {
      setError("Complete el nombre de la subvención y la administración otorgante.");
      return;
    }

    if (parsedAmount <= 0) {
      setError("El importe concedido debe ser mayor que 0 €.");
      return;
    }

    if (isBelowAllocated) {
      setError(
        `El importe no puede ser inferior a ${formatCurrency(
          minAllowedAmount
        )} (actualmente asignado a proyectos).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        id: initialGrant?.id,
        title: title.trim(),
        grantingBody: grantingBody.trim(),
        totalAmount: parsedAmount,
        resolutionDate,
        justificationDeadline,
        status,
      });

      if (!result.success) {
        setError(result.error || "Error al guardar la subvención.");
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialGrant ? "Editar Subvención" : "Registrar Nueva Subvención"}
      description="Defina los datos oficiales de concesión, importe otorgado y plazos de justificación."
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
            Nombre / Convocatoria de la Subvención *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: PRTR Componente 11 - Digitalización de las AA.PP."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
            Administración / Organismo Otorgante *
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={grantingBody}
              onChange={(e) => setGrantingBody(e.target.value)}
              placeholder="Ej: Ministerio para la Transformación Digital / Diputación..."
              className="pl-9"
              required
            />
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {BODY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGrantingBody(preset)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {preset.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Importe Concedido (€) *
            </label>
            <div className="relative">
              <Euro className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9 font-mono"
                required
              />
            </div>
            {initialGrant && minAllowedAmount > 0 && (
              <p
                className={`text-[11px] ${
                  isBelowAllocated ? "text-red-600 font-medium" : "text-slate-500"
                }`}
              >
                Ya asignado a proyectos: {formatCurrency(minAllowedAmount)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Estado de Tramitación *
            </label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GrantStatusType)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                {GRANT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Fecha de Concesión / Resolución *
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Fecha Límite de Justificación *
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={justificationDeadline}
                onChange={(e) => setJustificationDeadline(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isBelowAllocated}>
            {isSubmitting
              ? "Guardando..."
              : initialGrant
              ? "Guardar Cambios"
              : "Crear Subvención"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
