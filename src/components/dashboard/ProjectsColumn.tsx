"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Edit3,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderKanban,
  Landmark,
  NotebookPen,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { GrantDTO, ProjectDTO, ProjectStatusType } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ProjectsColumnProps {
  projects: ProjectDTO[];
  selectedGrant: GrantDTO | null;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onClearGrantFilter: () => void;
  onCreateProject: () => void;
  onEditProject: (project: ProjectDTO) => void;
  onDeleteProject: (project: ProjectDTO) => void;
  onOpenNoteForProject: (projectId: string) => void;
  onSelectGrantFilter: (grantId: string) => void;
}

const PROJECT_STATUS_MAP: Record<
  ProjectStatusType,
  { label: string; variant: "secondary" | "info" | "success" }
> = {
  PLANIFICADO: { label: "Planificado", variant: "secondary" },
  EN_CURSO: { label: "En Curso", variant: "info" },
  FINALIZADO: { label: "Finalizado", variant: "success" },
};

export function ProjectsColumn({
  projects,
  selectedGrant,
  selectedProjectId,
  onSelectProject,
  onClearGrantFilter,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onOpenNoteForProject,
  onSelectGrantFilter,
}: ProjectsColumnProps) {
  const totalBudgetSum = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalOwnFundsSum = projects.reduce((acc, p) => acc + p.ownFundsAmount, 0);

  return (
    <section
      aria-label="Columna Central de Proyectos y Expedientes"
      className="pastel-col-projects flex h-full w-full lg:w-[45%] flex-col border-r overflow-hidden transition-colors duration-200"
    >
      {/* Cabecera de Columna */}
      <div className="pastel-col-header shrink-0 border-b px-4 py-3 space-y-2 transition-colors duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Proyectos y Expedientes ({projects.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {selectedGrant && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearGrantFilter}
                className="h-7 px-2.5 text-xs"
              >
                Ver todos los proyectos
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateProject}
              className="h-7 px-2.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear Proyecto
            </Button>
          </div>
        </div>

        {/* Banner de Filtro Activo por Subvención */}
        {selectedGrant ? (
          <div className="pastel-accent-pill flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Filtrando por subvención:{" "}
                <strong className="font-semibold">{selectedGrant.title}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onClearGrantFilter}
              className="shrink-0 font-semibold hover:underline text-[11px]"
            >
              Quitar filtro
            </button>
          </div>
        ) : (
          <div className="pastel-subtle-box flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] border">
            <span className="text-slate-500">
              Presupuesto Total Proyectos:{" "}
              <strong className="font-mono text-slate-800">
                {formatCurrency(totalBudgetSum)}
              </strong>
            </span>
            <span className="text-slate-500">
              Fondos Propios Comprometidos:{" "}
              <strong className="font-mono text-slate-800">
                {formatCurrency(totalOwnFundsSum)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Listado de Tarjetas de Proyectos con Scroll Interno */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {projects.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/80 p-6 text-center">
            <FolderKanban className="h-7 w-7 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {selectedGrant
                ? "Esta subvención aún no tiene proyectos vinculados"
                : "No se encontraron proyectos con los criterios actuales"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              {selectedGrant
                ? "Puede vincular esta subvención creando un nuevo proyecto o editando uno existente."
                : "Cree un nuevo proyecto indicando su expediente administrativo y modificación presupuestaria."}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {selectedGrant && (
                <Button variant="outline" size="sm" onClick={onClearGrantFilter}>
                  Ver todos los proyectos
                </Button>
              )}
              <Button variant="default" size="sm" onClick={onCreateProject}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo Proyecto
              </Button>
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const statusInfo = PROJECT_STATUS_MAP[project.status];
            const isSelected = selectedProjectId === project.id;

            return (
              <article
                key={project.id}
                onClick={() =>
                  onSelectProject(isSelected ? null : project.id)
                }
                className={`rounded-xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? "pastel-card-selected"
                    : "pastel-card hover:shadow-xs"
                }`}
              >
                {/* Fila 1: Estado, Validación Presupuestaria y Acciones CRUD */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {project.isBudgetBalanced ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50/90 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200/80"
                        title="La suma de subvenciones + fondos propios cuadra con el presupuesto total"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Cuadre 100%
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200"
                        title="Atención: Existe una diferencia entre la financiación asignada y el presupuesto total"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        Revisar Financiación ({formatCurrency(project.coveredBudgetTotal)})
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenNoteForProject(project.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Abrir notas de este proyecto / expediente"
                    >
                      <NotebookPen className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar proyecto y asignaciones de subvenciones"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(project)}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fila 2: Nombre del Proyecto y Presupuesto Total */}
                <div className="mt-2.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="pastel-accent-pill text-right shrink-0 rounded-xl border px-3 py-1.5">
                    <span className="block text-[10px] uppercase tracking-wider opacity-75">
                      Presupuesto Total
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {formatCurrency(project.totalBudget)}
                    </span>
                  </div>
                </div>

                {/* Fila 3: Trazabilidad Administrativa (Badges de Expedientes Obligatorios) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                  <div className="pastel-subtle-box inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs">
                    <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    <span className="text-[11px] text-slate-500">Exp. Administrativo:</span>
                    <strong className="font-mono text-xs text-slate-800">
                      {project.adminFileNumber}
                    </strong>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-200/80 bg-sky-50/70 px-2.5 py-1 text-xs">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                    <span className="text-[11px] text-sky-700">Exp. Mod. Presupuestaria:</span>
                    <strong className="font-mono text-xs text-sky-950">
                      {project.budgetModFileNumber}
                    </strong>
                  </div>
                </div>

                {/* Fila 4: Desglose de Financiación (Subvenciones Vinculadas + Fondos Propios) */}
                <div className="pastel-subtle-box mt-3 rounded-lg border p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600 flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Desglose de Financiación
                    </span>
                    <span className="font-mono">
                      Subvenciones: {formatCurrency(project.grantsAllocatedTotal)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {project.allocations.map((alloc) => {
                      const isHighlighted = selectedGrant?.id === alloc.grantId;
                      return (
                        <button
                          key={alloc.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGrantFilter(alloc.grantId);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                            isHighlighted
                              ? "pastel-accent-bg border-transparent text-white"
                              : "border-teal-200/90 bg-teal-50/80 text-teal-950 hover:bg-teal-100/70"
                          }`}
                          title={`Subvención otorgada por: ${alloc.grantingBody}`}
                        >
                          <Landmark className="h-3 w-3 shrink-0 opacity-80" />
                          <span className="max-w-[210px] truncate font-medium">
                            {alloc.grantTitle}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 font-mono text-[11px] font-bold ${
                              isHighlighted
                                ? "bg-white/25 text-white"
                                : "bg-white text-teal-900"
                            }`}
                          >
                            {formatCurrency(alloc.allocatedAmount)}
                          </span>
                        </button>
                      );
                    })}

                    {/* Etiqueta de Fondos Propios (si > 0 €) */}
                    {project.ownFundsAmount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/90 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-950">
                        <Wallet className="h-3 w-3 text-amber-700 shrink-0" />
                        <span>Fondos Propios</span>
                        <strong className="rounded bg-white px-1.5 font-mono text-[11px] text-amber-900">
                          {formatCurrency(project.ownFundsAmount)}
                        </strong>
                      </span>
                    )}

                    {project.allocations.length === 0 && project.ownFundsAmount <= 0 && (
                      <span className="text-xs text-slate-400 italic">
                        Sin desglose de financiación registrado
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
