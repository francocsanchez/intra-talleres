import { z } from "zod";

import { PRESUPUESTO_ESTADOS } from "@/lib/constants";
import { calculateCostoConIva } from "@/lib/format";

const optionalTextField = z
  .string()
  .trim()
  .max(250)
  .optional()
  .transform((value) => value || undefined);

export const presupuestoFiltersSchema = z.object({
  estado: z.string().trim().optional(),
  tallerId: z.string().trim().optional(),
  dominio: z.string().trim().optional(),
  interno: z.string().trim().optional(),
});

export const lookupUnidadSchema = z.object({
  interno: z
    .string()
    .trim()
    .min(1, "Ingresá un interno para buscar la unidad.")
    .max(32),
});

export const createPresupuestoSchema = z.object({
  interno: z.string().trim().min(1).max(32),
  tallerId: z.string().trim().min(1),
  km: z.coerce.number().int().min(0),
  costo: z.coerce.number().positive(),
  observaciones: z.string().trim().max(500).optional().default(""),
  nroPresupuesto: optionalTextField,
  prioridad: optionalTextField,
  detalle: optionalTextField,
  fechaIngresoTaller: z.string().trim().optional(),
  fechaEgresoTaller: z.string().trim().optional(),
});

export const updatePresupuestoEstadoSchema = z.object({
  estado: z.enum(PRESUPUESTO_ESTADOS),
});

export type CreatePresupuestoInput = z.input<typeof createPresupuestoSchema>;
export type CreatePresupuestoPayload = z.output<typeof createPresupuestoSchema>;
export type PresupuestoFiltersInput = z.input<typeof presupuestoFiltersSchema>;

export function normalizeCreatePresupuestoPayload(
  input: CreatePresupuestoInput,
) {
  const parsed = createPresupuestoSchema.parse(input);

  return {
    ...parsed,
    costoConIva: calculateCostoConIva(parsed.costo),
    fechaIngresoTaller: parsed.fechaIngresoTaller || undefined,
    fechaEgresoTaller: parsed.fechaEgresoTaller || undefined,
  };
}
