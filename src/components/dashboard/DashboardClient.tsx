"use client";

import * as React from "react";
import { Database } from "lucide-react";
import {
  DashboardInitialData,
  GrantDTO,
  GrantStatusType,
  NoteDTO,
  ProjectDTO,
  UpsertGrantInput,
  UpsertProjectInput,
} from "@/types/domain";
import {
  deleteGrantAction,
  deleteProjectAction,
  reorderGrantsAction,
  saveNoteAction,
  upsertGrantAction,
  upsertProjectAction,
} from "@/actions/subvenciones";
import { HeaderGlobal } from "@/components/dashboard/HeaderGlobal";
import { GrantsColumn } from "@/components/dashboard/GrantsColumn";
import { ProjectsColumn } from "@/components/dashboard/ProjectsColumn";
import { NotesColumn } from "@/components/dashboard/NotesColumn";
import { GrantModal } from "@/components/modals/GrantModal";
import { DeleteGrantDialog } from "@/components/modals/DeleteGrantDialog";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { CommandSearchModal } from "@/components/modals/CommandSearchModal";
import { PASTEL_THEMES, PastelThemeId } from "@/lib/themes";

interface DashboardClientProps {
  initialData: DashboardInitialData;
}

const THEME_STORAGE_KEY = "sigesub-pastel-theme";

function recomputeDerivedState(
  grantsList: GrantDTO[],
  projectsList: ProjectDTO[]
): { grants: GrantDTO[]; projects: ProjectDTO[] } {
  const grantsMap = new Map<string, GrantDTO>();
  for (const g of grantsList) {
    grantsMap.set(g.id, { ...g, allocations: [] });
  }

  const updatedProjects: ProjectDTO[] = projectsList.map((proj) => {
    const validAllocations = proj.allocations
      .map((a) => {
        const g = grantsMap.get(a.grantId);
        if (!g) return null;
        return {
          ...a,
          grantTitle: g.title,
          grantingBody: g.grantingBody,
          grantStatus: g.status,
        };
      })
      .filter(Boolean) as ProjectDTO["allocations"];

    const grantsAllocatedTotal =
      Math.round(
        validAllocations.reduce((acc, item) => acc + item.allocatedAmount, 0) * 100
      ) / 100;
    const coveredBudgetTotal =
      Math.round((grantsAllocatedTotal + proj.ownFundsAmount) * 100) / 100;
    const isBudgetBalanced = Math.abs(proj.totalBudget - coveredBudgetTotal) < 0.01;

    for (const alloc of validAllocations) {
      const targetGrant = grantsMap.get(alloc.grantId);
      if (targetGrant) {
        targetGrant.allocations.push({
          id: alloc.id,
          projectId: proj.id,
          projectName: proj.name,
          adminFileNumber: proj.adminFileNumber,
          allocatedAmount: alloc.allocatedAmount,
        });
      }
    }

    return {
      ...proj,
      allocations: validAllocations,
      grantsAllocatedTotal,
      coveredBudgetTotal,
      isBudgetBalanced,
    };
  });

  const updatedGrants: GrantDTO[] = Array.from(grantsMap.values())
    .map((g) => {
      const allocatedTotal =
        Math.round(
          g.allocations.reduce((acc, a) => acc + a.allocatedAmount, 0) * 100
        ) / 100;
      const availableAmount = Math.max(
        0,
        Math.round((g.totalAmount - allocatedTotal) * 100) / 100
      );
      const allocatedPercentage =
        g.totalAmount > 0
          ? Math.min(100, Math.round((allocatedTotal / g.totalAmount) * 10000) / 100)
          : 0;
      return {
        ...g,
        allocatedTotal,
        availableAmount,
        allocatedPercentage,
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { grants: updatedGrants, projects: updatedProjects };
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [grants, setGrants] = React.useState<GrantDTO[]>(initialData.grants);
  const [projects, setProjects] = React.useState<ProjectDTO[]>(initialData.projects);
  const [notes, setNotes] = React.useState<NoteDTO[]>(initialData.notes);
  const [isFallbackMode] = React.useState(Boolean(initialData.isFallbackMode));

  // Estado del tema pastel activo (con persistencia en localStorage)
  const [activeTheme, setActiveTheme] = React.useState<PastelThemeId>("nordic-breeze");

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as PastelThemeId | null;
      if (saved && PASTEL_THEMES.some((t) => t.id === saved)) {
        setActiveTheme(saved);
      }
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, []);

  const handleThemeChange = (newTheme: PastelThemeId) => {
    setActiveTheme(newTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignorar
    }
  };

  // Sincronizar cuando Next.js revalida los Server Components
  React.useEffect(() => {
    setGrants(initialData.grants);
    setProjects(initialData.projects);
    setNotes(initialData.notes);
  }, [initialData]);

  // Filtros de búsqueda rápida en la Barra Superior
  const [grantSearch, setGrantSearch] = React.useState("");
  const [grantStatusFilter, setGrantStatusFilter] = React.useState<
    GrantStatusType | "ALL"
  >("ALL");
  const [projectSearch, setProjectSearch] = React.useState("");

  // Selección y Contexto (Filtro de columna central + Contexto del Panel de Notas)
  const [selectedGrantId, setSelectedGrantId] = React.useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(
    null
  );
  const [noteContextMode, setNoteContextMode] = React.useState<
    "GENERAL" | "GRANT" | "PROJECT"
  >("GENERAL");

  // Estados de Modales
  const [grantModalOpen, setGrantModalOpen] = React.useState(false);
  const [editingGrant, setEditingGrant] = React.useState<GrantDTO | null>(null);
  const [deletingGrant, setDeletingGrant] = React.useState<GrantDTO | null>(null);

  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<ProjectDTO | null>(
    null
  );

  const [commandModalOpen, setCommandModalOpen] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);

  // Atajo global Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Selección de Subvención: filtra proyectos y cambia contexto de notas a esa subvención
  const handleSelectGrant = (grantId: string | null) => {
    setSelectedGrantId(grantId);
    if (grantId) {
      setSelectedProjectId(null);
      setNoteContextMode("GRANT");
    } else {
      setNoteContextMode(selectedProjectId ? "PROJECT" : "GENERAL");
    }
  };

  // Selección de Proyecto: cambia contexto de notas a ese proyecto
  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      setNoteContextMode("PROJECT");
    } else {
      setNoteContextMode(selectedGrantId ? "GRANT" : "GENERAL");
    }
  };

  // Filtrado reactivo de Subvenciones
  const filteredGrants = React.useMemo(() => {
    const q = grantSearch.trim().toLowerCase();
    return grants.filter((g) => {
      const matchesStatus =
        grantStatusFilter === "ALL" || g.status === grantStatusFilter;
      const matchesQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.grantingBody.toLowerCase().includes(q) ||
        g.status.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [grants, grantSearch, grantStatusFilter]);

  // Filtrado reactivo de Proyectos (por búsqueda de nombre/expedientes y por subvención seleccionada)
  const filteredProjects = React.useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesGrant =
        !selectedGrantId ||
        p.allocations.some((a) => a.grantId === selectedGrantId);
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.adminFileNumber.toLowerCase().includes(q) ||
        p.budgetModFileNumber.toLowerCase().includes(q);
      return matchesGrant && matchesQuery;
    });
  }, [projects, selectedGrantId, projectSearch]);

  const selectedGrantObj = React.useMemo(
    () => grants.find((g) => g.id === selectedGrantId) ?? null,
    [grants, selectedGrantId]
  );

  const selectedProjectObj = React.useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  // Drag & Drop con actualización optimista inmediata + persistencia en PostgreSQL
  const handleReorderGrants = async (reorderedFiltered: GrantDTO[]) => {
    const filteredIds = new Set(reorderedFiltered.map((g) => g.id));
    const reorderedMap = new Map(reorderedFiltered.map((g, idx) => [g.id, idx]));

    const nextGrants = [...grants]
      .sort((a, b) => {
        if (filteredIds.has(a.id) && filteredIds.has(b.id)) {
          return (reorderedMap.get(a.id) ?? 0) - (reorderedMap.get(b.id) ?? 0);
        }
        return a.displayOrder - b.displayOrder;
      })
      .map((item, idx) => ({ ...item, displayOrder: idx }));

    setGrants(nextGrants);

    if (!isFallbackMode) {
      setIsReordering(true);
      try {
        await reorderGrantsAction(nextGrants.map((g) => g.id));
      } finally {
        setIsReordering(false);
      }
    }
  };

  // CRUD Subvención
  const handleUpsertGrant = async (input: UpsertGrantInput) => {
    if (!isFallbackMode) {
      const res = await upsertGrantAction(input);
      if (!res.success) return res;
    }

    const nowIso = new Date().toISOString();
    let nextGrantsList: GrantDTO[];

    if (input.id) {
      nextGrantsList = grants.map((g) =>
        g.id === input.id
          ? {
              ...g,
              title: input.title,
              grantingBody: input.grantingBody,
              totalAmount: input.totalAmount,
              resolutionDate: new Date(input.resolutionDate).toISOString(),
              justificationDeadline: new Date(
                input.justificationDeadline
              ).toISOString(),
              status: input.status,
              updatedAt: nowIso,
            }
          : g
      );
    } else {
      const newGrant: GrantDTO = {
        id: crypto.randomUUID(),
        title: input.title,
        grantingBody: input.grantingBody,
        totalAmount: input.totalAmount,
        allocatedTotal: 0,
        availableAmount: input.totalAmount,
        allocatedPercentage: 0,
        resolutionDate: new Date(input.resolutionDate).toISOString(),
        justificationDeadline: new Date(input.justificationDeadline).toISOString(),
        status: input.status,
        displayOrder: grants.length,
        createdAt: nowIso,
        updatedAt: nowIso,
        allocations: [],
      };
      nextGrantsList = [...grants, newGrant];
    }

    const recomputed = recomputeDerivedState(nextGrantsList, projects);
    setGrants(recomputed.grants);
    setProjects(recomputed.projects);
    return { success: true };
  };

  const handleConfirmDeleteGrant = async (
    grantId: string,
    forceUnlink: boolean
  ) => {
    if (!isFallbackMode) {
      const res = await deleteGrantAction(grantId, forceUnlink);
      if (!res.success) return res;
    }

    const nextGrantsList = grants.filter((g) => g.id !== grantId);
    const nextProjectsList = projects.map((p) => ({
      ...p,
      allocations: p.allocations.filter((a) => a.grantId !== grantId),
    }));

    const recomputed = recomputeDerivedState(nextGrantsList, nextProjectsList);
    setGrants(recomputed.grants);
    setProjects(recomputed.projects);
    if (selectedGrantId === grantId) {
      setSelectedGrantId(null);
      setNoteContextMode("GENERAL");
    }
    return { success: true };
  };

  // CRUD Proyecto
  const handleUpsertProject = async (input: UpsertProjectInput) => {
    if (!isFallbackMode) {
      const res = await upsertProjectAction(input);
      if (!res.success) return res;
    }

    const nowIso = new Date().toISOString();
    const projectId = input.id ?? crypto.randomUUID();

    const mappedAllocations: ProjectDTO["allocations"] = input.allocations.map(
      (a) => {
        const grant = grants.find((g) => g.id === a.grantId);
        return {
          id: crypto.randomUUID(),
          grantId: a.grantId,
          grantTitle: grant?.title ?? "Subvención",
          grantingBody: grant?.grantingBody ?? "",
          grantStatus: grant?.status ?? "CONCEDIDA",
          allocatedAmount: a.allocatedAmount,
        };
      }
    );

    const newProjectObj: ProjectDTO = {
      id: projectId,
      name: input.name,
      description: input.description ?? null,
      totalBudget: input.totalBudget,
      ownFundsAmount: input.ownFundsAmount,
      grantsAllocatedTotal: 0,
      coveredBudgetTotal: 0,
      isBudgetBalanced: true,
      adminFileNumber: input.adminFileNumber,
      budgetModFileNumber: input.budgetModFileNumber,
      status: input.status,
      createdAt: nowIso,
      updatedAt: nowIso,
      allocations: mappedAllocations,
    };

    const nextProjectsList = input.id
      ? projects.map((p) => (p.id === input.id ? newProjectObj : p))
      : [newProjectObj, ...projects];

    const recomputed = recomputeDerivedState(grants, nextProjectsList);
    setGrants(recomputed.grants);
    setProjects(recomputed.projects);
    return { success: true };
  };

  const handleDeleteProject = async (project: ProjectDTO) => {
    const confirmed = window.confirm(
      `¿Confirma la eliminación del proyecto "${project.name}" (${project.adminFileNumber})? Se liberarán los importes asignados de las subvenciones vinculadas.`
    );
    if (!confirmed) return;

    if (!isFallbackMode) {
      const res = await deleteProjectAction(project.id);
      if (!res.success) {
        window.alert(res.error || "No se pudo eliminar el proyecto.");
        return;
      }
    }

    const nextProjectsList = projects.filter((p) => p.id !== project.id);
    const recomputed = recomputeDerivedState(grants, nextProjectsList);
    setGrants(recomputed.grants);
    setProjects(recomputed.projects);
    if (selectedProjectId === project.id) {
      setSelectedProjectId(null);
      setNoteContextMode(selectedGrantId ? "GRANT" : "GENERAL");
    }
  };

  // Guardado de Notas
  const handleSaveNote = React.useCallback(
    async (payload: {
      content: string;
      grantId: string | null;
      projectId: string | null;
    }) => {
      const nowIso = new Date().toISOString();

      if (!isFallbackMode) {
        const res = await saveNoteAction(payload);
        if (res.success && res.data) {
          setNotes((prev) => {
            const exists = prev.some(
              (n) =>
                (n.grantId ?? null) === payload.grantId &&
                (n.projectId ?? null) === payload.projectId
            );
            if (exists) {
              return prev.map((n) =>
                (n.grantId ?? null) === payload.grantId &&
                (n.projectId ?? null) === payload.projectId
                  ? res.data!
                  : n
              );
            }
            return [res.data!, ...prev];
          });
          return { success: true, updatedAt: res.data.updatedAt };
        }
      }

      setNotes((prev) => {
        const exists = prev.some(
          (n) =>
            (n.grantId ?? null) === payload.grantId &&
            (n.projectId ?? null) === payload.projectId
        );
        if (exists) {
          return prev.map((n) =>
            (n.grantId ?? null) === payload.grantId &&
            (n.projectId ?? null) === payload.projectId
              ? { ...n, content: payload.content, updatedAt: nowIso }
              : n
          );
        }
        return [
          {
            id: crypto.randomUUID(),
            content: payload.content,
            grantId: payload.grantId,
            projectId: payload.projectId,
            updatedAt: nowIso,
          },
          ...prev,
        ];
      });

      return { success: true, updatedAt: nowIso };
    },
    [isFallbackMode]
  );

  const activeNoteContext = React.useMemo(() => {
    if (noteContextMode === "PROJECT" && selectedProjectObj) {
      return {
        type: "PROJECT" as const,
        project: selectedProjectObj,
        grant: null,
      };
    }
    if (noteContextMode === "GRANT" && selectedGrantObj) {
      return {
        type: "GRANT" as const,
        grant: selectedGrantObj,
        project: null,
      };
    }
    return {
      type: "GENERAL" as const,
      grant: null,
      project: null,
    };
  }, [noteContextMode, selectedGrantObj, selectedProjectObj]);

  const totalGrantsAmount = grants.reduce((acc, g) => acc + g.totalAmount, 0);
  const totalAllocatedAmount = grants.reduce(
    (acc, g) => acc + g.allocatedTotal,
    0
  );

  return (
    <div
      data-theme={activeTheme}
      className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200"
    >
      {/* Aviso sutil si aún no se ha conectado DATABASE_URL */}
      {isFallbackMode && (
        <div className="flex shrink-0 items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-1 text-[11px] text-amber-900">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-amber-700" />
            <span>
              <strong>Modo Demostración Interactiva:</strong> Base de datos PostgreSQL no detectada
              en <code className="rounded bg-amber-100 px-1 font-mono">DATABASE_URL</code>.
            </span>
          </div>
        </div>
      )}

      {/* Barra Superior Institucional con Selector de Temas Pastel */}
      <HeaderGlobal
        grantSearch={grantSearch}
        onGrantSearchChange={setGrantSearch}
        grantStatusFilter={grantStatusFilter}
        onGrantStatusFilterChange={setGrantStatusFilter}
        projectSearch={projectSearch}
        onProjectSearchChange={setProjectSearch}
        onOpenNewGrant={() => {
          setEditingGrant(null);
          setGrantModalOpen(true);
        }}
        onOpenNewProject={() => {
          setEditingProject(null);
          setProjectModalOpen(true);
        }}
        onOpenCommandModal={() => setCommandModalOpen(true)}
        totalGrantsAmount={totalGrantsAmount}
        totalAllocatedAmount={totalAllocatedAmount}
        activeTheme={activeTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Layout Principal de 3 Columnas Independientes con Scroll Interno */}
      <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Columna Izquierda: Subvenciones (30% ancho) */}
        <GrantsColumn
          grants={filteredGrants}
          selectedGrantId={selectedGrantId}
          onSelectGrant={handleSelectGrant}
          onReorderGrants={handleReorderGrants}
          onEditGrant={(grant) => {
            setEditingGrant(grant);
            setGrantModalOpen(true);
          }}
          onDeleteGrant={(grant) => setDeletingGrant(grant)}
          onOpenNoteForGrant={(grantId) => {
            setSelectedGrantId(grantId);
            setSelectedProjectId(null);
            setNoteContextMode("GRANT");
          }}
          isReordering={isReordering}
        />

        {/* Columna Central: Proyectos y Expedientes (45% ancho) */}
        <ProjectsColumn
          projects={filteredProjects}
          selectedGrant={selectedGrantObj}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onClearGrantFilter={() => handleSelectGrant(null)}
          onCreateProject={() => {
            setEditingProject(null);
            setProjectModalOpen(true);
          }}
          onEditProject={(proj) => {
            setEditingProject(proj);
            setProjectModalOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          onOpenNoteForProject={(projectId) => {
            setSelectedProjectId(projectId);
            setNoteContextMode("PROJECT");
          }}
          onSelectGrantFilter={(grantId) => handleSelectGrant(grantId)}
        />

        {/* Columna Derecha: Panel de Notas Contextual (25% ancho) */}
        <NotesColumn
          notes={notes}
          activeContext={activeNoteContext}
          onSwitchToGeneral={() => {
            setNoteContextMode("GENERAL");
          }}
          onSaveNote={handleSaveNote}
        />
      </main>

      {/* Modales CRUD y Buscador Unificado */}
      <GrantModal
        open={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        initialGrant={editingGrant}
        onSubmit={handleUpsertGrant}
      />

      <DeleteGrantDialog
        grant={deletingGrant}
        open={Boolean(deletingGrant)}
        onClose={() => setDeletingGrant(null)}
        onConfirmDelete={handleConfirmDeleteGrant}
      />

      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        initialProject={editingProject}
        grants={grants}
        preselectedGrantId={selectedGrantId}
        onSubmit={handleUpsertProject}
      />

      <CommandSearchModal
        open={commandModalOpen}
        onClose={() => setCommandModalOpen(false)}
        grants={grants}
        projects={projects}
        onSelectGrant={(grantId) => handleSelectGrant(grantId)}
        onSelectProject={(projectId) => handleSelectProject(projectId)}
      />
    </div>
  );
}
