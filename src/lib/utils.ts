import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateIso: string | Date): string {
  const date = typeof dateIso === "string" ? new Date(dateIso) : dateIso;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function toInputDateValue(dateIso: string | Date): string {
  const date = typeof dateIso === "string" ? new Date(dateIso) : dateIso;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export function getDaysUntilDeadline(deadlineIso: string): {
  days: number;
  isUrgent: boolean;
  isExpired: boolean;
  label: string;
} {
  const now = new Date();
  const target = new Date(deadlineIso);
  const diffTime = target.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      days,
      isUrgent: false,
      isExpired: true,
      label: `Vencida hace ${Math.abs(days)} días`,
    };
  }
  if (days <= 60) {
    return {
      days,
      isUrgent: true,
      isExpired: false,
      label: `Vence en ${days} días`,
    };
  }
  return {
    days,
    isUrgent: false,
    isExpired: false,
    label: `${days} días restantes`,
  };
}
