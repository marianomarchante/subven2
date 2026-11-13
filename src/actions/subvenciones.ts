"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FALLBACK_INITIAL_DATA } from "@/lib/fallback-data";
import {
  ActionResponse,
  DashboardInitialData,
  GrantDTO,
  GrantStatusType,
  NoteDTO,
  ProjectDTO,
  ProjectStatusType,
  UpsertGrantInput,
  UpsertProjectInput,
} from "@/types/domain";

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function getDashboardData(): Promise<DashboardInitialData> {
  try {
    const [rawGrants, rawProjects, rawNotes] = await Promise.all([
      prisma.grant.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        include: {
          projectGrants: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  adminFileNumber: true,
                },
              },
            },
          },
        },
      }),
      prisma.project.findMany({
        orderBy: [{ createdAt: "desc" }],
        include: {
          projectGrants: {
            include: {
              grant: {
                select: {
                  id: true,
                  title: true,
                  grantingBody: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.note.findMany({
        orderBy: [{ updatedAt: "desc" }],
      }),
    ]);

    const grants: GrantDTO[] = rawGrants.map((g) => {
      const totalAmount = Number(g.totalAmount);
      const allocations = g.projectGrants.map((pg) => ({
        id: pg.id,
        projectId: pg.projectId,
        projectName: pg.project.name,
        adminFileNumber: pg.project.adminFileNumber,
        allocatedAmount: Number(pg.allocatedAmount),
      }));
      const allocatedTotal = roundCurrency(
        allocations.reduce((acc, item) => acc + item.allocatedAmount, 0)
      );
      const availableAmount = roundCurrency(Math.max(0, totalAmount - allocatedTotal));
      const allocatedPercentage =
        totalAmount > 0 ? roundCurrency(Math.min(100, (allocatedTotal / totalAmount) * 100)) : 0;

      return {
        id: g.id,
        title: g.title,
        grantingBody: g.grantingBody,
        totalAmount,
        allocatedTotal,
        availableAmount,
        allocatedPercentage,
        resolutionDate: g.resolutionDate.toISOString(),
        justificationDeadline: g.justificationDeadline.toISOString(),
        status: g.status as GrantStatusType,
        displayOrder: g.displayOrder,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        allocations,
      };
    });

    const projects: ProjectDTO[] = rawProjects.map((p) => {
      const totalBudget = Number(p.totalBudget);
      const ownFundsAmount = Number(p.ownFundsAmount);
      const allocations = p.projectGrants.map((pg) => ({
        id: pg.id,
        grantId: pg.grantId,
        grantTitle: pg.grant.title,
        grantingBody: pg.grant.grantingBody,
        grantStatus: pg.grant.status as GrantStatusType,
        allocatedAmount: Number(pg.allocatedAmount),
      }));
      const grantsAllocatedTotal = roundCurrency(
        allocations.reduce((acc, item) => acc + item.allocatedAmount, 0)
      );
      const coveredBudgetTotal = roundCurrency(grantsAllocatedTotal + ownFundsAmount);
      const isBudgetBalanced = Math.abs(totalBudget - coveredBudgetTotal) < 0.01;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        totalBudget,
        ownFundsAmount,
        grantsAllocatedTotal,
        coveredBudgetTotal,
        isBudgetBalanced,
        adminFileNumber: p.adminFileNumber,
        budgetModFileNumber: p.budgetModFileNumber,
        status: p.status as ProjectStatusType,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        allocations,
      };
    });

    const notes: NoteDTO[] = rawNotes.map((n) => ({
      id: n.id,
      content: n.content,
      grantId: n.grantId,
      projectId: n.projectId,
      updatedAt: n.updatedAt.toISOString(),
    }));

    return {
      grants,
      projects,
      notes,
      isFallbackMode: false,
    };
  } catch (error) {
    console.warn(
      "No se pudo conectar a PostgreSQL mediante DATABASE_URL. Cargando datos de demostración locales:",
      error instanceof Error ? error.message : error
    );
    return FALLBACK_INITIAL_DATA;
  }
}

export async function upsertGrantAction(
  input: UpsertGrantInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const title = input.title?.trim();
    const grantingBody = input.grantingBody?.trim();
    const totalAmount = roundCurrency(Number(input.totalAmount));

    if (!title || !grantingBody) {
      return {
        success: false,
        error: "El título y la administración otorgante son obligatorios.",
      };
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return {
        success: false,
        error: "El importe concedido debe ser un valor numérico mayor que 0 €.",
      };
    }

    const resolutionDate = new Date(input.resolutionDate);
    const justificationDeadline = new Date(input.justificationDeadline);

    if (
      Number.isNaN(resolutionDate.getTime()) ||
      Number.isNaN(justificationDeadline.getTime())
    ) {
      return {
        success: false,
        error: "Las fechas de resolución y límite de justificación deben ser válidas.",
      };
    }

    if (justificationDeadline < resolutionDate) {
      return {
        success: false,
        error:
          "La fecha límite de justificación no puede ser anterior a la fecha de resolución.",
      };
    }

    if (input.id) {
      // Validar que el nuevo importe total no sea inferior a lo ya comprometido en proyectos
      const existingAllocations = await prisma.projectGrant.aggregate({
        where: { grantId: input.id },
        _sum: { allocatedAmount: true },
      });

      const currentAllocated = roundCurrency(
        Number(existingAllocations._sum.allocatedAmount ?? 0)
      );

      if (totalAmount + 0.005 < currentAllocated) {
        return {
          success: false,
          error: `No se puede reducir el importe de la subvención a ${totalAmount.toLocaleString(
            "es-ES"
          )} € porque ya tiene ${currentAllocated.toLocaleString(
            "es-ES"
          )} € asignados a proyectos activos.`,
        };
      }

      const updated = await prisma.grant.update({
        where: { id: input.id },
        data: {
          title,
          grantingBody,
          totalAmount,
          resolutionDate,
          justificationDeadline,
          status: input.status,
        },
      });

      revalidatePath("/");
      return { success: true, data: { id: updated.id } };
    } else {
      const maxOrderRecord = await prisma.grant.aggregate({
        _max: { displayOrder: true },
      });
      const nextOrder = (maxOrderRecord._max.displayOrder ?? -1) + 1;

      const created = await prisma.grant.create({
        data: {
          title,
          grantingBody,
          totalAmount,
          resolutionDate,
          justificationDeadline,
          status: input.status,
          displayOrder: nextOrder,
        },
      });

      revalidatePath("/");
      return { success: true, data: { id: created.id } };
    }
  } catch (error) {
    console.error("Error en upsertGrantAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Error al guardar la subvención en PostgreSQL: ${error.message}`
          : "Error inesperado al guardar la subvención.",
    };
  }
}

export async function deleteGrantAction(
  grantId: string,
  forceUnlink: boolean = false
): Promise<ActionResponse<{ linkedProjectsCount?: number }>> {
  try {
    const linkedAllocations = await prisma.projectGrant.findMany({
      where: { grantId },
      include: {
        project: {
          select: { name: true, adminFileNumber: true },
        },
      },
    });

    if (linkedAllocations.length > 0 && !forceUnlink) {
      const projectNames = linkedAllocations
        .map((a) => `${a.project.name} (${a.project.adminFileNumber})`)
        .join(", ");
      return {
        success: false,
        error: `La subvención tiene ${linkedAllocations.length} proyecto(s) vinculado(s): ${projectNames}. Confirme explícitamente si desea desvincularla y eliminarla.`,
        data: { linkedProjectsCount: linkedAllocations.length },
      };
    }

    await prisma.grant.delete({
      where: { id: grantId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error en deleteGrantAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Error al eliminar la subvención: ${error.message}`
          : "No se pudo eliminar la subvención.",
    };
  }
}

export async function reorderGrantsAction(
  orderedGrantIds: string[]
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(
      orderedGrantIds.map((id, index) =>
        prisma.grant.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error en reorderGrantsAction:", error);
    return {
      success: false,
      error: "No se pudo persistir el nuevo orden de las subvenciones en la base de datos.",
    };
  }
}

export async function upsertProjectAction(
  input: UpsertProjectInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const name = input.name?.trim();
    const description = input.description?.trim() || null;
    const adminFileNumber = input.adminFileNumber?.trim();
    const budgetModFileNumber = input.budgetModFileNumber?.trim();
    const totalBudget = roundCurrency(Number(input.totalBudget));
    const ownFundsAmount = roundCurrency(Number(input.ownFundsAmount ?? 0));

    if (!name) {
      return { success: false, error: "El nombre del proyecto es obligatorio." };
    }

    if (!adminFileNumber) {
      return {
        success: false,
        error: "El Nº de Expediente Administrativo es obligatorio.",
      };
    }

    if (!budgetModFileNumber) {
      return {
        success: false,
        error: "El Nº de Expediente de Modificación Presupuestaria es obligatorio.",
      };
    }

    if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
      return {
        success: false,
        error: "El presupuesto total del proyecto debe ser mayor que 0 €.",
      };
    }

    if (!Number.isFinite(ownFundsAmount) || ownFundsAmount < 0) {
      return {
        success: false,
        error: "El importe de fondos propios no puede ser negativo.",
      };
    }

    // Consolidar asignaciones por grantId y filtrar importes <= 0
    const normalizedAllocationsMap = new Map<string, number>();
    for (const item of input.allocations ?? []) {
      const amount = roundCurrency(Number(item.allocatedAmount));
      if (!item.grantId || amount <= 0) continue;
      normalizedAllocationsMap.set(
        item.grantId,
        roundCurrency((normalizedAllocationsMap.get(item.grantId) ?? 0) + amount)
      );
    }

    const allocations = Array.from(normalizedAllocationsMap.entries()).map(
      ([grantId, allocatedAmount]) => ({
        grantId,
        allocatedAmount,
      })
    );

    const grantsAllocatedSum = roundCurrency(
      allocations.reduce((acc, a) => acc + a.allocatedAmount, 0)
    );
    const totalFinancing = roundCurrency(grantsAllocatedSum + ownFundsAmount);

    // Regla de Negocio 1: Cuadre presupuestario del proyecto (Subvenciones + Fondos Propios === Presupuesto Total)
    if (Math.abs(totalBudget - totalFinancing) >= 0.01) {
      const diff = roundCurrency(totalBudget - totalFinancing);
      return {
        success: false,
        error: `Descuadre presupuestario: La suma de subvenciones (${grantsAllocatedSum.toLocaleString(
          "es-ES"
        )} €) + Fondos Propios (${ownFundsAmount.toLocaleString(
          "es-ES"
        )} €) es ${totalFinancing.toLocaleString(
          "es-ES"
        )} €, pero el Presupuesto Total es ${totalBudget.toLocaleString(
          "es-ES"
        )} € (diferencia de ${diff.toLocaleString("es-ES")} €).`,
      };
    }

    // Regla de Negocio 2: Control de saldo disponible en cada Subvención asignada
    if (allocations.length > 0) {
      const grantIds = allocations.map((a) => a.grantId);
      const grantsInDb = await prisma.grant.findMany({
        where: { id: { in: grantIds } },
        include: {
          projectGrants: {
            where: input.id ? { projectId: { not: input.id } } : undefined,
          },
        },
      });

      const grantsMap = new Map(grantsInDb.map((g) => [g.id, g]));

      for (const allocation of allocations) {
        const grantRecord = grantsMap.get(allocation.grantId);
        if (!grantRecord) {
          return {
            success: false,
            error: "Una de las subvenciones seleccionadas no existe en la base de datos.",
          };
        }

        const grantTotal = roundCurrency(Number(grantRecord.totalAmount));
        const usedByOtherProjects = roundCurrency(
          grantRecord.projectGrants.reduce(
            (acc, pg) => acc + Number(pg.allocatedAmount),
            0
          )
        );
        const availableForThisProject = roundCurrency(grantTotal - usedByOtherProjects);

        if (allocation.allocatedAmount - availableForThisProject >= 0.01) {
          return {
            success: false,
            error: `Saldo insuficiente en la subvención "${grantRecord.title}": intenta asignar ${allocation.allocatedAmount.toLocaleString(
              "es-ES"
            )} €, pero el saldo disponible es de ${availableForThisProject.toLocaleString(
              "es-ES"
            )} € (de un total de ${grantTotal.toLocaleString("es-ES")} €).`,
          };
        }
      }
    }

    const savedProject = await prisma.$transaction(async (tx) => {
      if (input.id) {
        await tx.projectGrant.deleteMany({
          where: { projectId: input.id },
        });

        return tx.project.update({
          where: { id: input.id },
          data: {
            name,
            description,
            totalBudget,
            ownFundsAmount,
            adminFileNumber,
            budgetModFileNumber,
            status: input.status,
            projectGrants: {
              create: allocations.map((a) => ({
                grantId: a.grantId,
                allocatedAmount: a.allocatedAmount,
              })),
            },
          },
        });
      } else {
        return tx.project.create({
          data: {
            name,
            description,
            totalBudget,
            ownFundsAmount,
            adminFileNumber,
            budgetModFileNumber,
            status: input.status,
            projectGrants: {
              create: allocations.map((a) => ({
                grantId: a.grantId,
                allocatedAmount: a.allocatedAmount,
              })),
            },
          },
        });
      }
    });

    revalidatePath("/");
    return { success: true, data: { id: savedProject.id } };
  } catch (error) {
    console.error("Error en upsertProjectAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Error al guardar el proyecto: ${error.message}`
          : "Error inesperado al guardar el proyecto.",
    };
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResponse> {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error en deleteProjectAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Error al eliminar el proyecto: ${error.message}`
          : "No se pudo eliminar el proyecto.",
    };
  }
}

export async function saveNoteAction(input: {
  content: string;
  grantId: string | null;
  projectId: string | null;
}): Promise<ActionResponse<NoteDTO>> {
  try {
    const grantId = input.grantId || null;
    const projectId = input.projectId || null;

    const existing = await prisma.note.findFirst({
      where: {
        grantId: grantId === null ? null : grantId,
        projectId: projectId === null ? null : projectId,
      },
      orderBy: { updatedAt: "desc" },
    });

    const saved = existing
      ? await prisma.note.update({
          where: { id: existing.id },
          data: { content: input.content },
        })
      : await prisma.note.create({
          data: {
            content: input.content,
            grantId,
            projectId,
          },
        });

    revalidatePath("/");
    return {
      success: true,
      data: {
        id: saved.id,
        content: saved.content,
        grantId: saved.grantId,
        projectId: saved.projectId,
        updatedAt: saved.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error en saveNoteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo sincronizar la nota en PostgreSQL: ${error.message}`
          : "Error al guardar la nota.",
    };
  }
}
