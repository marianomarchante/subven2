"use client";

import * as React from "react";
import {
  Check,
  Command,
  FileSearch,
  Landmark,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrantStatusType } from "@/types/domain";
import { PASTEL_THEMES, PastelThemeId } from "@/lib/themes";

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
  activeTheme: PastelThemeId;
  onThemeChange: (theme: PastelThemeId) => void;
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
  activeTheme,
  onThemeChange,
}: HeaderGlobalProps) {
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentThemeMeta =
    PASTEL_THEMES.find((t) => t.id === activeTheme) ?? PASTEL_THEMES[0];

  return (
    <header className="pastel-header shrink-0 border-b px-4 py-2.5 transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Identidad Institucional */}
        <div className="flex items-center gap-2.5">
          <div className="pastel-accent-bg flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs transition-colors">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-800">
                SIGESUB · Control de Subvenciones y Expedientes
              </h1>
              <span className="pastel-accent-pill hidden xl:inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Intervención Pública
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
          <div className="flex flex-1 items-center gap-1 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1 shadow-2xs focus-within:border-slate-400 focus-within:bg-white">
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
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 shadow-2xs focus-within:border-slate-400 focus-within:bg-white">
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
            className="hidden md:inline-flex items-center gap-1 rounded-lg border border-white/90 bg-white/90 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 shadow-2xs shrink-0"
            title="Abrir buscador rápido global (Ctrl+K / Cmd+K)"
          >
            <Command className="h-3 w-3" />
            <span>K</span>
          </button>
        </div>

        {/* Selector de Estilo Visual en Tonos Pastel + Botones de Acción Rápida */}
        <div className="flex items-center gap-2">
          {/* Selector desplegable de Paletas Pastel */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/90 bg-white/95 px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-white transition-all"
              title="Cambiar combinación de estilo visual en tonos pastel"
            >
              <Palette className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">{currentThemeMeta.name}</span>
              <span className="flex items-center -space-x-1">
                {currentThemeMeta.swatches.map((hex, i) => (
                  <span
                    key={i}
                    className="h-3 w-3 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Combinaciones en Tonos Pastel
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Elija la paleta visual para las 3 columnas
                  </p>
                </div>

                <div className="space-y-1">
                  {PASTEL_THEMES.map((theme) => {
                    const isSelected = theme.id === activeTheme;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          onThemeChange(theme.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-slate-100/90 font-semibold text-slate-900"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span>{theme.name}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {theme.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {theme.swatches.map((hex, i) => (
                            <span
                              key={i}
                              className="h-4 w-4 rounded-full border border-slate-200/80 shadow-2xs"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
