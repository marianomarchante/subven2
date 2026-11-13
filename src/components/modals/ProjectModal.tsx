"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  FileText,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GrantDTO,
  ProjectDTO,
  ProjectGrantAssignmentInput,
  ProjectStatusType,
  UpsertProjectInput,
} from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  initialProject?: ProjectDTO | null;
  grants: GrantDTO[];
  preselectedGrantId?: string | null;
  onSubmit: (data: UpsertProjectInput) => Promise<{ success: boolean; error?: string }>;
}

const PROJECT_STATUS_OPTIONS: { value: ProjectStatusType; label: string }[] = [
  { value: "PLANIFICADO", label: "Planificado" },
  { value: "EN_CURSO", label: "En Curso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

export function ProjectModal({
  open,
  onClose,
  initialProject,
  grants,
  preselectedGrantId,
  onSubmit,
}: ProjectModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [totalBudget, setTotalBudget] = React.useState("");
  const [ownFundsAmount, setOwnFundsAmount] = React.useState("0");
  const [adminFileNumber, setAdminFileNumber] = React.useState("");
  const [budgetModFileNumber, setBudgetModFileNumber] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatusType>("PLANIFICADO");
  const [allocations, setAllocations] = React.useState<
    { grantId: string; allocatedAmount: string }[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);

    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description ?? "");
      setTotalBudget(String(initialProject.totalBudget));
      setOwnFundsAmount(String(initialProject.ownFundsAmount));
      setAdminFileNumber(initialProject.adminFileNumber);
      setBudgetModFileNumber(initialProject.budgetModFileNumber);
      setStatus(initialProject.status);
      setAllocations(
        initialProject.allocations.map((a) => ({
          grantId: a.grantId,
          allocatedAmount: String(a.allocatedAmount),
        }))
      );
    } else {
      setName("");
      setDescription("");
      setTotalBudget("");
      setOwnFundsAmount("0");
      setAdminFileNumber("");
      setBudgetModFileNumber("");
      setStatus("PLANIFICADO");
      if (preselectedGrantId) {
        setAllocations([{ grantId: preselectedGrantId, allocatedAmount: "" }]);
      } else {
        setAllocations([]);
      }
    }
  }, [open, initialProject, preselectedGrantId]);

  // Calcula el crédito disponible de una subvención excluyendo lo asignado en este mismo proyecto
  const getGrantAvailableForThisProject = React.useCallback(
    (grantId: string): number => {
      const grant = grants.find((g) => g.id === grantId);
      if (!grant) return 0;
      const usedByOtherProjects = grant.allocations
        .filter((a) => a.projectId !== initialProject?.id)
        .reduce((acc, item) => acc + item.allocatedAmount, 0);
      return Math.max(0, Math.round((grant.totalAmount - usedByOtherProjects) * 100) / 100);
    },
    [grants, initialProject?.id]
  );

  const parsedTotalBudget = Math.round((Number(totalBudget) || 0) * 100) / 100;
  const parsedOwnFunds = Math.round((Number(ownFundsAmount) || 0) * 100) / 100;

  const parsedAllocations: ProjectGrantAssignmentInput[] = allocations
    .filter((a) => a.grantId && Number(a.allocatedAmount) > 0)
    .map((a) => ({
      grantId: a.grantId,
      allocatedAmount: Math.round((Number(a.allocatedAmount) || 0) * 100) / 100,
    }));

  const sumGrantsAllocated =
    Math.round(
      parsedAllocations.reduce((acc, a) => acc + a.allocatedAmount, 0) * 100
    ) / 100;

  const totalCovered = Math.round((sumGrantsAllocated + parsedOwnFunds) * 100) / 100;
  const budgetDifference = Math.round((parsedTotalBudget - totalCovered) * 100) / 100;
  const isBudgetBalanced =
    parsedTotalBudget > 0 && Math.abs(budgetDifference) < 0.01;

  // Detectar si alguna subvención supera su crédito disponible
  const overAllocatedGrants = allocations
    .map((row) => {
      const grant = grants.find((g) => g.id === row.grantId);
      if (!grant) return null;
      const amount = Number(row.allocatedAmount) || 0;
      const maxAvailable = getGrantAvailableForThisProject(row.grantId);
      if (amount - maxAvailable >= 0.01) {
        return {
          grantTitle: grant.title,
          amount,
          maxAvailable,
        };
      }
      return null;
    })
    .filter(Boolean) as { grantTitle: string; amount: number; maxAvailable: number }[];

  const handleAddAllocationRow = () => {
    const usedGrantIds = new Set(allocations.map((a) => a.grantId));
    const nextGrant = grants.find((g) => !usedGrantIds.has(g.id));
    setAllocations((prev) => [
      ...prev,
      {
        grantId: nextGrant?.id || (grants[0]?.id ?? ""),
        allocatedAmount: budgetDifference > 0 ? String(budgetDifference) : "",
      },
    ]);
  };

  const handleRemoveAllocationRow = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (
    index: number,
    field: "grantId" | "allocatedAmount",
    value: string
  ) => {
    setAllocations((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAutoBalanceOwnFunds = () => {
    const remaining = Math.max(
      0,
      Math.round((parsedTotalBudget - sumGrantsAllocated) * 100) / 100
    );
    setOwnFundsAmount(String(remaining));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }

    if (!adminFileNumber.trim() || !budgetModFileNumber.trim()) {
      setError(
        "Tanto el Nº de Expediente Administrativo como el Nº de Expediente de Modificación Presupuestaria son obligatorios."
      );
      return;
    }

    if (parsedTotalBudget <= 0) {
      setError("El presupuesto total del proyecto debe ser mayor que 0 €.");
      return;
    }

    if (overAllocatedGrants.length > 0) {
      const first = overAllocatedGrants[0];
      setError(
        `La asignación a "${first.grantTitle}" (${formatCurrency(
          first.amount
        )}) supera su crédito disponible (${formatCurrency(first.maxAvailable)}).`
      );
      return;
    }

    if (!isBudgetBalanced) {
      setError(
        `El desglose de financiación (${formatCurrency(
          totalCovered
        )}) debe cuadrar exactamente con el Presupuesto Total (${formatCurrency(
          parsedTotalBudget
        )}). Diferencia: ${formatCurrency(budgetDifference)}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        id: initialProject?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        totalBudget: parsedTotalBudget,
        ownFundsAmount: parsedOwnFunds,
        adminFileNumber: adminFileNumber.trim(),
        budgetModFileNumber: budgetModFileNumber.trim(),
        status,
        allocations: parsedAllocations,
      });

      if (!res.success) {
        setError(res.error || "Error al guardar el proyecto.");
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
      title={initialProject ? "Editar Proyecto y Financiación" : "Nuevo Proyecto y Expedientes"}
      description="Configure los expedientes vinculados y el cuadro de financiación (Subvenciones + Fondos Propios)."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Nombre del Proyecto de Inversión / Gasto *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Renovación Integral de Sede Electrónica y Carpeta Ciudadana"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Estado *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatusType)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
            Objeto / Descripción Técnica (Opcional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalle técnico de las actuaciones o contrato..."
            rows={2}
            className="min-h-[60px]"
          />
        </div>

        {/* Trazabilidad de Expedientes Obligatorios */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              Nº Expediente Administrativo *
            </label>
            <Input
              value={adminFileNumber}
              onChange={(e) => setAdminFileNumber(e.target.value)}
              placeholder="Ej: EXP-2025/00412-CONT"
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600" />
              Nº Exp. Modificación Presupuestaria *
            </label>
            <Input
              value={budgetModFileNumber}
              onChange={(e) => setBudgetModFileNumber(e.target.value)}
              placeholder="Ej: MC-2025/00019-INT"
              className="font-mono text-xs"
              required
            />
          </div>
        </div>

        {/* Presupuesto Total y Fondos Propios */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Presupuesto Total del Proyecto (€) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="0.00"
              className="font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Aportación Fondos Propios (€)
              </label>
              {parsedTotalBudget > 0 && (
                <button
                  type="button"
                  onClick={handleAutoBalanceOwnFunds}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900"
                  title="Ajustar Fondos Propios automáticamente al resto pendiente de financiar"
                >
                  <Sparkles className="h-3 w-3" />
                  Cuadrar resto
                </button>
              )}
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={ownFundsAmount}
              onChange={(e) => setOwnFundsAmount(e.target.value)}
              placeholder="0.00"
              className="font-mono"
            />
          </div>
        </div>

        {/* Asignación N:M de Subvenciones */}
        <div className="space-y-2.5 rounded-lg border border-slate-200 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-slate-600" />
                Subvenciones Vinculadas (Financiación Externa)
              </h3>
              <p className="text-[11px] text-slate-500">
                Asigne una o varias subvenciones sin superar su remanente disponible.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllocationRow}
              disabled={grants.length === 0}
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir Subvención
            </Button>
          </div>

          {allocations.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 py-4 text-center text-xs text-slate-500">
              Proyecto sin subvenciones asignadas (100% Fondos Propios) o pulse «Añadir Subvención».
            </div>
          ) : (
            <div className="space-y-2">
              {allocations.map((row, idx) => {
                const available = getGrantAvailableForThisProject(row.grantId);
                const rowAmount = Number(row.allocatedAmount) || 0;
                const isExceeded = rowAmount - available >= 0.01;

                return (
                  <div
                    key={idx}
                    className={`rounded-md border p-2.5 transition-colors ${
                      isExceeded
                        ? "border-red-300 bg-red-50/50"
                        : "border-slate-200 bg-slate-50/40"
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center">
                      <div className="sm:col-span-7">
                        <select
                          value={row.grantId}
                          onChange={(e) =>
                            handleAllocationChange(idx, "grantId", e.target.value)
                          }
                          className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          {grants.map((g) => {
                            const avail = getGrantAvailableForThisProject(g.id);
                            return (
                              <option key={g.id} value={g.id}>
                                {g.title} (Disp: {formatCurrency(avail)})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="sm:col-span-4 flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.allocatedAmount}
                          onChange={(e) =>
                            handleAllocationChange(idx, "allocatedAmount", e.target.value)
                          }
                          placeholder="Importe €"
                          className="h-8 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAllocationChange(
                              idx,
                              "allocatedAmount",
                              String(
                                Math.min(
                                  available,
                                  Math.max(
                                    0,
                                    Math.round(
                                      (parsedTotalBudget -
                                        parsedOwnFunds -
                                        (sumGrantsAllocated - rowAmount)) *
                                        100
                                    ) / 100
                                  ) || available
                                )
                              )
                            )
                          }
                          className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                          title="Asignar saldo necesario o máximo disponible"
                        >
                          Máx
                        </button>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocationRow(idx)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Quitar subvención"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Disponible en subvención:{" "}
                        <strong className="font-mono text-slate-700">
                          {formatCurrency(available)}
                        </strong>
                      </span>
                      {isExceeded && (
                        <span className="font-semibold text-red-600">
                          Excede disponible en {formatCurrency(rowAmount - available)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel de Control Presupuestario en Tiempo Real */}
        <div
          className={`rounded-lg border p-3 text-xs transition-colors ${
            isBudgetBalanced && overAllocatedGrants.length === 0
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-amber-200 bg-amber-50/80 text-amber-950"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              {isBudgetBalanced && overAllocatedGrants.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <span>
                {isBudgetBalanced && overAllocatedGrants.length === 0
                  ? "Control Presupuestario Verificado (Cuadre 100%)"
                  : "Control Presupuestario: Pendiente de Cuadre Exacto"}
              </span>
            </div>

            <Badge
              variant={
                isBudgetBalanced && overAllocatedGrants.length === 0 ? "success" : "warning"
              }
              className="font-mono"
            >
              {formatCurrency(totalCovered)} / {formatCurrency(parsedTotalBudget)}
            </Badge>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-black/5 pt-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block font-sans">Subvenciones:</span>
              <strong>{formatCurrency(sumGrantsAllocated)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Fondos Propios:</span>
              <strong>{formatCurrency(parsedOwnFunds)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Desfase:</span>
              <strong
                className={
                  Math.abs(budgetDifference) < 0.01 ? "text-emerald-700" : "text-red-600"
                }
              >
                {formatCurrency(budgetDifference)}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || !isBudgetBalanced || overAllocatedGrants.length > 0
            }
          >
            {isSubmitting
              ? "Guardando..."
              : initialProject
              ? "Guardar Proyecto"
              : "Crear Proyecto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
