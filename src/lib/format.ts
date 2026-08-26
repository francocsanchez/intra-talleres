import { IVA_RATE } from "@/lib/constants";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const compactDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return compactDateFormatter.format(new Date(value));
}

export function calculateCostoConIva(costo: number) {
  return Number((costo * (1 + IVA_RATE)).toFixed(2));
}

export function summarizeText(value: string, maxLength = 56) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
