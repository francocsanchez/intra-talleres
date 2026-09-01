import { IVA_RATE } from "@/lib/constants";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const compactDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

function parseCalendarDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return compactDateFormatter.format(parseCalendarDate(value));
}

export function formatShortDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  return shortDateFormatter.format(parseCalendarDate(value));
}

export function getRepairDuration(
  fechaIngresoTaller?: string,
  fechaEgresoTaller?: string,
) {
  if (!fechaIngresoTaller) {
    return null;
  }

  const ingreso = parseCalendarDate(fechaIngresoTaller);
  const finalizacion = fechaEgresoTaller
    ? parseCalendarDate(fechaEgresoTaller)
    : new Date();
  const ingresoUtc = Date.UTC(
    ingreso.getFullYear(),
    ingreso.getMonth(),
    ingreso.getDate(),
  );
  const finalizacionUtc = Date.UTC(
    finalizacion.getFullYear(),
    finalizacion.getMonth(),
    finalizacion.getDate(),
  );

  return Math.max(0, Math.floor((finalizacionUtc - ingresoUtc) / 86_400_000));
}

export function getCalendarMonthKey(value: string) {
  const date = parseCalendarDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getCalendarYearKey(value: string) {
  return String(parseCalendarDate(value).getFullYear());
}

export function calculateCostoConIva(costo: number) {
  return Number((costo * (1 + IVA_RATE)).toFixed(2));
}

export function calculateValoresToma(valorInfo: number, porcentajeToma: number) {
  const valorIngreso = Number((valorInfo * (1 - porcentajeToma / 100)).toFixed(2));

  return {
    valorIngreso,
    diferencia: Number((valorInfo - valorIngreso).toFixed(2)),
  };
}

export function summarizeText(value: string, maxLength = 56) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
