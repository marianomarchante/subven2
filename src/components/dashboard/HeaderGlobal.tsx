"use client";

import * as React from "react";
import {
  Command,
  FileSearch,
  Landmark,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrantStatusType } from "@/types/domain";

interface HeaderGlobalProps {
  grantSearch: string;
  onGrantSearchChange: (value: string) => void;
  grantStatusFilter: GrantStatusType | "ALL";
  onGrantStatusFilterChange: (value: GrantStatusType | "ALL") => void;
  projectSearch: string;
  onProjectSearchChange: (value: string) => void;
  onOpenNewGrant: () => void;
  onOpenNewProject: () => void;
  onOpenCommandModal: () => void;
  totalGrantsAmount: number;
  totalAllocatedAmount: number;
}

export function HeaderGlobal({
  grantSearch,
  onGrantSearchChange,
  grantStatusFilter,
  onGrantStatusFilterChange,
  projectSearch,
  onProjectSearchChange,
  onOpenNewGrant,
  onOpenNewProject,
  onOpenCommandModal,
}: HeaderGlobalProps) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Identidad Institucional */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                SIGESUB · Control de Subvenciones y Expedientes
              </h1>
              <span className="hidden xl:inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Intervención y Gestión Pública
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Trazabilidad financiera de subvenciones concedidas, proyectos y expedientes vinculados
            </p>
          </div>
        </div>

        {/* Buscadores Rápidos Dual + Modal Cmd+K */}
        <div className="flex flex-1 items-center justify-center gap-2 max-w-3xl">
          {/* Buscador rápido 1: Subvenciones (nombre, organismo, estado) */}
          <div className="flex flex-1 items-center gap-1 rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 focus-within:border-slate-400 focus-within:bg-white">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={grantSearch}
              onChange={(e) => onGrantSearchChange(e.target.value)}
              placeholder="Buscar subvención u organismo..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              aria-label="Buscar subvenciones"
            />
            {grantSearch && (
              <button
                type="button"
                onClick={() => onGrantSearchChange("")}
                className="text-slate-400 hover:text-slate-600"
                title="Limpiar búsqueda de subvenciones"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <SlidersHorizontal className="h-3 w-3 text-slate-400 shrink-0" />
            <select
              value={grantStatusFilter}
              onChange={(e) =>
                onGrantStatusFilterChange(e.target.value as GrantStatusType | "ALL")
              }
              className="bg-transparent text-[11px] font-medium text-slate-600 focus:outline-none cursor-pointer"
              aria-label="Filtrar por estado de subvención"
            >
              <option value="ALL">Todos estados</option>
              <option value="CONCEDIDA">Concedida</option>
              <option value="EN_EJECUCION">En Ejecución</option>
              <option value="JUSTIFICADA">Justificada</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </div>

          {/* Buscador rápido 2: Proyectos y Expedientes */}
          <div className="flex flex-1 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 focus-within:border-slate-400 focus-within:bg-white">
            <FileSearch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => onProjectSearchChange(e.target.value)}
              placeholder="Proyecto, Exp. Admin o Exp. Mod. Presup..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              aria-label="Buscar proyectos por nombre o número de expediente"
            />
            {projectSearch && (
              <button
                type="button"
                onClick={() => onProjectSearchChange("")}
                className="text-slate-400 hover:text-slate-600"
                title="Limpiar búsqueda de proyectos"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Botón Buscador Global Cmd+K */}
          <button
            type="button"
            onClick={onOpenCommandModal}
            className="hidden md:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs shrink-0"
            title="Abrir buscador rápido global (Ctrl+K / Cmd+K)"
          >
            <Command className="h-3 w-3" />
            <span>K</span>
          </button>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenNewGrant}>
            <Plus className="h-3.5 w-3.5" />
            Nueva Subvención
          </Button>
          <Button variant="default" size="sm" onClick={onOpenNewProject}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>
    </header>
  );
}
