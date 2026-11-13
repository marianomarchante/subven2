"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  CalendarClock,
  Edit3,
  FilterX,
  GripVertical,
  Landmark,
  NotebookPen,
  Trash2,
} from "lucide-react";
import { GrantDTO, GrantStatusType } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, getDaysUntilDeadline } from "@/lib/utils";

interface GrantsColumnProps {
  grants: GrantDTO[];
  selectedGrantId: string | null;
  onSelectGrant: (grantId: string | null) => void;
  onReorderGrants: (newOrderedGrants: GrantDTO[]) => void;
  onEditGrant: (grant: GrantDTO) => void;
  onDeleteGrant: (grant: GrantDTO) => void;
  onOpenNoteForGrant: (grantId: string) => void;
  isReordering?: boolean;
}

const STATUS_BADGE_MAP: Record<
  GrantStatusType,
  { label: string; variant: "info" | "warning" | "success" | "secondary" }
> = {
  CONCEDIDA: { label: "Concedida", variant: "info" },
  EN_EJECUCION: { label: "En Ejecución", variant: "warning" },
  JUSTIFICADA: { label: "Justificada", variant: "success" },
  CERRADA: { label: "Cerrada", variant: "secondary" },
};

interface SortableGrantCardProps {
  grant: GrantDTO;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenNote: () => void;
}

function SortableGrantCard({
  grant,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onOpenNote,
}: SortableGrantCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grant.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  const statusMeta = STATUS_BADGE_MAP[grant.status];
  const deadlineInfo = getDaysUntilDeadline(grant.justificationDeadline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer select-none ${
        isDragging
          ? "border-slate-900 bg-white shadow-xl ring-2 ring-slate-900/10 opacity-95"
          : isSelected
          ? "border-slate-900 bg-slate-900/[0.03] shadow-sm ring-1 ring-slate-900"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Manejador Drag & Drop */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab active:cursor-grabbing rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
          title="Arrastrar para reordenar prioridad de la subvención"
          aria-label="Reordenar subvención"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Cabecera de tarjeta: Estado + Acciones CRUD */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={statusMeta.variant} className="text-[10px]">
              {statusMeta.label}
            </Badge>

            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onOpenNote}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Ver/editar notas de esta subvención"
              >
                <NotebookPen className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Editar subvención"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar subvención"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Título y Administración Otorgante */}
          <div>
            <h3 className="text-xs font-bold leading-snug text-slate-900 line-clamp-2">
              {grant.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 line-clamp-1">
              <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{grant.grantingBody}</span>
            </p>
          </div>

          {/* Importe Total y % Asignado a Proyectos */}
          <div className="rounded-lg bg-slate-50/90 border border-slate-100 p-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-500">Importe Concedido</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {formatCurrency(grant.totalAmount)}
              </span>
            </div>

            <Progress value={grant.allocatedPercentage} />

            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-700">
                Asignado:{" "}
                <strong className="font-mono">{grant.allocatedPercentage}%</strong> (
                {formatCurrency(grant.allocatedTotal)})
              </span>
              <span className="font-mono text-slate-500">
                Disp: {formatCurrency(grant.availableAmount)}
              </span>
            </div>
          </div>

          {/* Fecha límite de justificación y nº proyectos */}
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <div className="flex items-center gap-1 text-slate-600">
              <CalendarClock
                className={`h-3.5 w-3.5 shrink-0 ${
                  deadlineInfo.isExpired
                    ? "text-red-600"
                    : deadlineInfo.isUrgent
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              />
              <span>
                Justificación:{" "}
                <strong
                  className={
                    deadlineInfo.isExpired
                      ? "text-red-700"
                      : deadlineInfo.isUrgent
                      ? "text-amber-700"
                      : "text-slate-800"
                  }
                >
                  {formatDate(grant.justificationDeadline)}
                </strong>
              </span>
            </div>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              {grant.allocations.length}{" "}
              {grant.allocations.length === 1 ? "proyecto" : "proyectos"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GrantsColumn({
  grants,
  selectedGrantId,
  onSelectGrant,
  onReorderGrants,
  onEditGrant,
  onDeleteGrant,
  onOpenNoteForGrant,
  isReordering,
}: GrantsColumnProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = grants.findIndex((g) => g.id === active.id);
    const newIndex = grants.findIndex((g) => g.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(grants, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        displayOrder: idx,
      }));
      onReorderGrants(reordered);
    }
  };

  const totalConcedido = grants.reduce((acc, g) => acc + g.totalAmount, 0);
  const totalAsignado = grants.reduce((acc, g) => acc + g.allocatedTotal, 0);

  return (
    <section
      aria-label="Columna de Subvenciones"
      className="flex h-full w-full lg:w-[30%] flex-col border-r border-slate-200 bg-slate-50/50 overflow-hidden"
    >
      {/* Cabecera de Columna */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-slate-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Subvenciones ({grants.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {isReordering && (
              <span className="text-[10px] font-medium text-blue-600 animate-pulse">
                Guardando orden...
              </span>
            )}
            {selectedGrantId && (
              <button
                type="button"
                onClick={() => onSelectGrant(null)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                title="Quitar filtro y mostrar todos los proyectos"
              >
                <FilterX className="h-3 w-3" />
                Ver todos
              </button>
            )}
          </div>
        </div>

        {/* Resumen Financiero de Subvenciones Listadas */}
        <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] border border-slate-200/70">
          <span className="text-slate-500">
            Total Concedido:{" "}
            <strong className="font-mono text-slate-800">
              {formatCurrency(totalConcedido)}
            </strong>
          </span>
          <span className="text-slate-500">
            Asignado:{" "}
            <strong className="font-mono text-emerald-700">
              {formatCurrency(totalAsignado)}
            </strong>
          </span>
        </div>
      </div>

      {/* Lista Ordenable con Scroll Interno Independiente */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {grants.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
            <Landmark className="h-6 w-6 text-slate-300 mb-1.5" />
            <p className="text-xs font-medium text-slate-600">
              No hay subvenciones que coincidan con el filtro actual
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ajuste la búsqueda o cree una nueva subvención desde la barra superior.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={grants.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {grants.map((grant) => (
                <SortableGrantCard
                  key={grant.id}
                  grant={grant}
                  isSelected={selectedGrantId === grant.id}
                  onSelect={() =>
                    onSelectGrant(selectedGrantId === grant.id ? null : grant.id)
                  }
                  onEdit={() => onEditGrant(grant)}
                  onDelete={() => onDeleteGrant(grant)}
                  onOpenNote={() => onOpenNoteForGrant(grant.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}
