import { z } from "zod";

import { PRESUPUESTO_ESTADOS, PRIORIDAD_OPTIONS } from "@/lib/constants";
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
  prioridad: z.enum(PRIORIDAD_OPTIONS).optional(),
  detalle: optionalTextField,
  fechaIngresoTaller: z.string().trim().optional(),
  fechaEgresoTaller: z.string().trim().optional(),
});

export const updatePresupuestoEstadoSchema = z.object({
  estado: z.enum(PRESUPUESTO_ESTADOS),
});

export const updatePresupuestoSchema = z
  .object({
    estado: z.enum(PRESUPUESTO_ESTADOS).optional(),
    fechaEgresoTaller: z.string().trim().optional(),
  })
  .refine((data) => data.estado !== undefined || data.fechaEgresoTaller !== undefined, {
    message: "No hay cambios para guardar.",
  });

export const createTallerSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá un nombre de taller.").max(120),
  tipoTrabajo: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  activo: z.coerce.boolean().default(true),
});

export const updateTallerSchema = createTallerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "No hay cambios para guardar.",
);

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
