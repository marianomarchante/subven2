"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GrantDTO } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

interface DeleteGrantDialogProps {
  grant: GrantDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirmDelete: (grantId: string, forceUnlink: boolean) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function DeleteGrantDialog({
  grant,
  open,
  onClose,
  onConfirmDelete,
}: DeleteGrantDialogProps) {
  const [confirmUnlink, setConfirmUnlink] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setConfirmUnlink(false);
      setError(null);
    }
  }, [open, grant]);

  if (!grant) return null;

  const hasLinkedProjects = grant.allocations.length > 0;

  const handleDelete = async () => {
    if (hasLinkedProjects && !confirmUnlink) {
      setError(
        "Debe marcar la casilla de confirmación explícita para desvincular los proyectos afectados."
      );
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const res = await onConfirmDelete(grant.id, hasLinkedProjects ? confirmUnlink : false);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar la subvención.");
      } else {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Control de Seguridad en Borrado de Subvención"
      description="Verificación de integridad referencial y trazabilidad presupuestaria."
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">{grant.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{grant.grantingBody}</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            Importe concedido: <strong>{formatCurrency(grant.totalAmount)}</strong>
          </p>
        </div>

        {hasLinkedProjects ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-semibold">
                  Atención: Esta subvención financia actualmente {grant.allocations.length}{" "}
                  proyecto(s) por un total de {formatCurrency(grant.allocatedTotal)}.
                </p>
                <p>
                  Si continúa con la eliminación, se desvincularán las siguientes asignaciones y los
                  proyectos afectados quedarán con financiación pendiente de reasignar:
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 border-t border-amber-200/80 pt-2 text-xs text-amber-950">
              {grant.allocations.map((alloc) => (
                <li
                  key={alloc.id}
                  className="flex items-center justify-between rounded bg-white/80 px-2.5 py-1.5 border border-amber-200"
                >
                  <span className="truncate pr-2 font-medium">
                    {alloc.projectName}{" "}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({alloc.adminFileNumber})
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-amber-900 shrink-0">
                    {formatCurrency(alloc.allocatedAmount)}
                  </span>
                </li>
              ))}
            </ul>

            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmUnlink}
                onChange={(e) => setConfirmUnlink(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-red-600 focus:ring-red-600"
              />
              <span className="text-xs font-medium text-amber-950">
                Confirmo explícitamente la desvinculación de estos {grant.allocations.length}{" "}
                proyecto(s) y la eliminación definitiva de la subvención.
              </span>
            </label>
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            Esta subvención no tiene proyectos vinculados actualmente. ¿Está seguro de que desea
            eliminarla del registro?
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || (hasLinkedProjects && !confirmUnlink)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Eliminando..." : "Eliminar Subvención"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
