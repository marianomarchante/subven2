"use client";

import * as React from "react";
import {
  Check,
  Clock,
  FolderKanban,
  Globe,
  Landmark,
  Loader2,
  NotebookPen,
  Save,
} from "lucide-react";
import { GrantDTO, NoteDTO, ProjectDTO } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotesColumnProps {
  notes: NoteDTO[];
  activeContext: {
    type: "GENERAL" | "GRANT" | "PROJECT";
    grant?: GrantDTO | null;
    project?: ProjectDTO | null;
  };
  onSwitchToGeneral: () => void;
  onSaveNote: (payload: {
    content: string;
    grantId: string | null;
    projectId: string | null;
  }) => Promise<{ success: boolean; updatedAt?: string; error?: string }>;
}

export function NotesColumn({
  notes,
  activeContext,
  onSwitchToGeneral,
  onSaveNote,
}: NotesColumnProps) {
  const currentGrantId =
    activeContext.type === "GRANT" && activeContext.grant
      ? activeContext.grant.id
      : null;
  const currentProjectId =
    activeContext.type === "PROJECT" && activeContext.project
      ? activeContext.project.id
      : null;

  const matchingNote = React.useMemo(() => {
    return notes.find(
      (n) =>
        (n.grantId ?? null) === currentGrantId &&
        (n.projectId ?? null) === currentProjectId
    );
  }, [notes, currentGrantId, currentProjectId]);

  const [content, setContent] = React.useState(matchingNote?.content ?? "");
  const [saveState, setSaveState] = React.useState<
    "IDLE" | "TYPING" | "SAVING" | "SAVED" | "ERROR"
  >("IDLE");
  const [lastSavedTime, setLastSavedTime] = React.useState<string | null>(
    matchingNote?.updatedAt ?? null
  );

  const contextKey = `${activeContext.type}:${currentGrantId ?? "none"}:${
    currentProjectId ?? "none"
  }`;
  const lastContextKeyRef = React.useRef(contextKey);

  React.useEffect(() => {
    if (lastContextKeyRef.current !== contextKey) {
      lastContextKeyRef.current = contextKey;
      setContent(matchingNote?.content ?? "");
      setLastSavedTime(matchingNote?.updatedAt ?? null);
      setSaveState("IDLE");
    }
  }, [contextKey, matchingNote]);

  // Autoguardado con debounce de 1 segundo (1000ms)
  React.useEffect(() => {
    if (saveState !== "TYPING") return;

    const timer = setTimeout(async () => {
      setSaveState("SAVING");
      const res = await onSaveNote({
        content,
        grantId: currentGrantId,
        projectId: currentProjectId,
      });
      if (res.success) {
        setSaveState("SAVED");
        setLastSavedTime(res.updatedAt ?? new Date().toISOString());
      } else {
        setSaveState("ERROR");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, saveState, currentGrantId, currentProjectId, onSaveNote]);

  const handleManualSave = async () => {
    setSaveState("SAVING");
    const res = await onSaveNote({
      content,
      grantId: currentGrantId,
      projectId: currentProjectId,
    });
    if (res.success) {
      setSaveState("SAVED");
      setLastSavedTime(res.updatedAt ?? new Date().toISOString());
    } else {
      setSaveState("ERROR");
    }
  };

  const formattedTime = React.useMemo(() => {
    if (!lastSavedTime) return null;
    const d = new Date(lastSavedTime);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastSavedTime]);

  return (
    <aside
      aria-label="Columna Derecha de Bloc de Notas Contextual"
      className="pastel-col-notes flex h-full w-full lg:w-[25%] flex-col overflow-hidden transition-colors duration-200"
    >
      {/* Cabecera Contextual del Panel de Notas */}
      <div className="pastel-col-header shrink-0 border-b px-4 py-3 space-y-2 transition-colors duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bloc de Notas y Seguimiento
            </h2>
          </div>

          {activeContext.type !== "GENERAL" && (
            <button
              type="button"
              onClick={onSwitchToGeneral}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              title="Cambiar al bloc de notas general del organismo"
            >
              <Globe className="h-3 w-3" />
              Notas Generales
            </button>
          )}
        </div>

        {/* Indicador Contextual de Vinculación */}
        <div
          className={`rounded-lg border p-2.5 text-xs transition-colors ${
            activeContext.type === "GENERAL"
              ? "pastel-subtle-box text-slate-800"
              : activeContext.type === "GRANT"
              ? "pastel-accent-pill"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-950"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wide">
              {activeContext.type === "GENERAL" && (
                <>
                  <Globe className="h-3.5 w-3.5 text-slate-600" />
                  Notas Generales del Organismo
                </>
              )}
              {activeContext.type === "GRANT" && (
                <>
                  <Landmark className="h-3.5 w-3.5" />
                  Nota de Subvención Seleccionada
                </>
              )}
              {activeContext.type === "PROJECT" && (
                <>
                  <FolderKanban className="h-3.5 w-3.5 text-emerald-700" />
                  Nota de Proyecto Seleccionado
                </>
              )}
            </span>

            <Badge
              variant={
                activeContext.type === "GENERAL"
                  ? "secondary"
                  : activeContext.type === "GRANT"
                  ? "info"
                  : "success"
              }
              className="text-[10px]"
            >
              {activeContext.type === "GENERAL"
                ? "Global"
                : activeContext.type === "GRANT"
                ? "Subvención"
                : "Expediente"}
            </Badge>
          </div>

          {activeContext.type === "GRANT" && activeContext.grant && (
            <p className="mt-1 font-medium line-clamp-2 text-[11px]">
              {activeContext.grant.title}
            </p>
          )}

          {activeContext.type === "PROJECT" && activeContext.project && (
            <div className="mt-1 space-y-0.5">
              <p className="font-medium text-slate-900 line-clamp-1 text-[11px]">
                {activeContext.project.name}
              </p>
              <p className="font-mono text-[10px] text-emerald-800">
                {activeContext.project.adminFileNumber} ·{" "}
                {activeContext.project.budgetModFileNumber}
              </p>
            </div>
          )}

          {activeContext.type === "GENERAL" && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              Seleccione cualquier subvención o proyecto para ver sus anotaciones específicas.
            </p>
          )}
        </div>
      </div>

      {/* Área de Edición en Tiempo Real */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaveState("TYPING");
          }}
          placeholder={
            activeContext.type === "GENERAL"
              ? "Escriba recordatorios de fiscalización, hitos COFFEE-MRR, acuerdos de Junta de Gobierno o notas generales..."
              : activeContext.type === "GRANT"
              ? "Anote requerimientos de justificación, subsanaciones, hitos o condiciones particulares de esta subvención..."
              : "Anote incidencias del expediente de contratación, certificaciones de obra, facturas o reparos de Intervención..."
          }
          className="pastel-notepad flex-1 w-full resize-none rounded-xl border p-3.5 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none font-sans shadow-2xs transition-colors"
        />

        {/* Barra Inferior de Estado de Autoguardado + Botón Explícito */}
        <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {saveState === "TYPING" && (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Pendiente de autoguardado (1s)...</span>
              </>
            )}
            {saveState === "SAVING" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                <span className="text-sky-700 font-medium">Sincronizando nota...</span>
              </>
            )}
            {saveState === "SAVED" && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Guardado {formattedTime ? `a las ${formattedTime}` : ""}
                </span>
              </>
            )}
            {saveState === "IDLE" && (
              <>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {formattedTime
                    ? `Última actualización: ${formattedTime}`
                    : "Autoguardado activo (1s)"}
                </span>
              </>
            )}
            {saveState === "ERROR" && (
              <span className="text-rose-600 font-medium">
                Modo local activo (sin conexión BD)
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={saveState === "SAVING"}
            className="h-7 px-2.5 text-xs"
          >
            <Save className="h-3 w-3" />
            Guardar nota
          </Button>
        </div>
      </div>
    </aside>
  );
}
