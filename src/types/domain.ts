export type GrantStatusType = "CONCEDIDA" | "EN_EJECUCION" | "JUSTIFICADA" | "CERRADA";
export type ProjectStatusType = "PLANIFICADO" | "EN_CURSO" | "FINALIZADO";

export interface GrantAllocationSummaryDTO {
  id: string;
  projectId: string;
  projectName: string;
  adminFileNumber: string;
  allocatedAmount: number;
}

export interface GrantDTO {
  id: string;
  title: string;
  grantingBody: string;
  totalAmount: number;
  allocatedTotal: number;
  availableAmount: number;
  allocatedPercentage: number;
  resolutionDate: string;
  justificationDeadline: string;
  status: GrantStatusType;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  allocations: GrantAllocationSummaryDTO[];
}

export interface ProjectGrantAllocationDTO {
  id: string;
  grantId: string;
  grantTitle: string;
  grantingBody: string;
  grantStatus: GrantStatusType;
  allocatedAmount: number;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  totalBudget: number;
  ownFundsAmount: number;
  grantsAllocatedTotal: number;
  coveredBudgetTotal: number;
  isBudgetBalanced: boolean;
  adminFileNumber: string;
  budgetModFileNumber: string;
  status: ProjectStatusType;
  createdAt: string;
  updatedAt: string;
  allocations: ProjectGrantAllocationDTO[];
}

export interface NoteDTO {
  id: string;
  content: string;
  grantId: string | null;
  projectId: string | null;
  updatedAt: string;
}

export interface DashboardInitialData {
  grants: GrantDTO[];
  projects: ProjectDTO[];
  notes: NoteDTO[];
  isFallbackMode?: boolean;
}

export interface UpsertGrantInput {
  id?: string;
  title: string;
  grantingBody: string;
  totalAmount: number;
  resolutionDate: string;
  justificationDeadline: string;
  status: GrantStatusType;
}

export interface ProjectGrantAssignmentInput {
  grantId: string;
  allocatedAmount: number;
}

export interface UpsertProjectInput {
  id?: string;
  name: string;
  description?: string;
  totalBudget: number;
  ownFundsAmount: number;
  adminFileNumber: string;
  budgetModFileNumber: string;
  status: ProjectStatusType;
  allocations: ProjectGrantAssignmentInput[];
}

export interface ActionResponse<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}
