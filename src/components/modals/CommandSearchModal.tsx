"use client";

import * as React from "react";
import { Building2, FileText, FolderKanban, Landmark, Search } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GrantDTO, ProjectDTO } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  grants: GrantDTO[];
  projects: ProjectDTO[];
  onSelectGrant: (grantId: string) => void;
  onSelectProject: (projectId: string) => void;
}

export function CommandSearchModal({
  open,
  onClose,
  grants,
  projects,
  onSelectGrant,
  onSelectProject,
}: CommandSearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<"ALL" | "GRANTS" | "PROJECTS">("ALL");

  React.useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  const normalized = query.trim().toLowerCase();

  const matchingGrants = React.useMemo(() => {
    if (tab === "PROJECTS") return [];
    return grants.filter(
      (g) =>
        !normalized ||
        g.title.toLowerCase().includes(normalized) ||
        g.grantingBody.toLowerCase().includes(normalized) ||
        g.status.toLowerCase().includes(normalized)
    );
  }, [grants, normalized, tab]);

  const matchingProjects = React.useMemo(() => {
    if (tab === "GRANTS") return [];
    return projects.filter(
      (p) =>
        !normalized ||
        p.name.toLowerCase().includes(normalized) ||
        p.adminFileNumber.toLowerCase().includes(normalized) ||
        p.budgetModFileNumber.toLowerCase().includes(normalized)
    );
  }, [projects, normalized, tab]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buscador Unificado de Expedientes, Subvenciones y Proyectos"
      description="Localice instantáneamente cualquier subvención o expediente administrativo / presupuestario."
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, organismo, estado, EXP-2025/... o MC-2025/..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setTab("ALL")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({matchingGrants.length + matchingProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("GRANTS")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "GRANTS"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Subvenciones ({matchingGrants.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("PROJECTS")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "PROJECTS"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Proyectos y Expedientes ({matchingProjects.length})
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
          {matchingGrants.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                Subvenciones ({matchingGrants.length})
              </p>
              {matchingGrants.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    onSelectGrant(g.id);
                    onClose();
                  }}
                  className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200/80 bg-white p-2.5 text-left hover:border-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {g.title}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 truncate">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {g.grantingBody}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-mono text-xs font-semibold text-slate-900">
                      {formatCurrency(g.totalAmount)}
                    </span>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      {g.status.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchingProjects.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                Proyectos y Expedientes ({matchingProjects.length})
              </p>
              {matchingProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200/80 bg-white p-2.5 text-left hover:border-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                        <FileText className="h-2.5 w-2.5" />
                        {p.adminFileNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-800">
                        {p.budgetModFileNumber}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-mono text-xs font-semibold text-slate-900">
                      {formatCurrency(p.totalBudget)}
                    </span>
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchingGrants.length === 0 && matchingProjects.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No se encontraron subvenciones ni expedientes que coincidan con «{query}».
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
