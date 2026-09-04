import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { PRESUPUESTO_ESTADOS } from "@/lib/constants";

const presupuestoSchema = new Schema(
  {
    interno: {
      type: String,
      default: "",
      trim: true,
    },
    esExterno: {
      type: Boolean,
      required: true,
      default: false,
    },
    esReingreso: {
      type: Boolean,
      required: true,
      default: false,
    },
    dominio: {
      type: String,
      required: true,
      trim: true,
    },
    marca: {
      type: String,
      required: true,
      trim: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    km: {
      type: Number,
      required: true,
      min: 0,
    },
    costo: {
      type: Number,
      required: true,
      min: 0,
    },
    costoConIva: {
      type: Number,
      required: true,
      min: 0,
    },
    valorInfo: {
      type: Number,
      min: 0,
    },
    porcentajeToma: {
      type: Number,
      min: 0,
      max: 100,
    },
    valorIngreso: {
      type: Number,
      min: 0,
    },
    diferencia: {
      type: Number,
      min: 0,
    },
    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
    estado: {
      type: String,
      enum: PRESUPUESTO_ESTADOS,
      default: "Pendiente",
      required: true,
    },
    tallerId: {
      type: Schema.Types.ObjectId,
      ref: "Taller",
      required: true,
    },
    tallerNombre: {
      type: String,
      required: true,
      trim: true,
    },
    nroPresupuesto: {
      type: String,
      trim: true,
    },
    prioridad: {
      type: String,
      trim: true,
    },
    detalle: {
      type: String,
      trim: true,
    },
    fechaPedido: {
      type: Date,
    },
    fechaIngresoTaller: {
      type: Date,
    },
    fechaEgresoTaller: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export type PresupuestoDocument = InferSchemaType<typeof presupuestoSchema>;

const existingPresupuestoModel = models.Presupuesto as
  | Model<PresupuestoDocument>
  | undefined;

// Next reutiliza los modelos de Mongoose durante el desarrollo. Agregamos estos
// paths al modelo existente para que las nuevas altas no descarten los campos
// agregados hasta que se reinicie el proceso.
if (existingPresupuestoModel) {
  const missingPaths: Record<string, unknown> = {};

  if (!existingPresupuestoModel.schema.path("valorInfo")) {
    Object.assign(missingPaths, {
      valorInfo: { type: Number, min: 0 },
      porcentajeToma: { type: Number, min: 0, max: 100 },
      valorIngreso: { type: Number, min: 0 },
      diferencia: { type: Number, min: 0 },
    });
  }

  if (!existingPresupuestoModel.schema.path("esReingreso")) {
    Object.assign(missingPaths, {
      esReingreso: { type: Boolean, required: true, default: false },
    });
  }

  if (Object.keys(missingPaths).length > 0) {
    existingPresupuestoModel.schema.add(missingPaths);
  }
}

export const PresupuestoModel =
  existingPresupuestoModel || model<PresupuestoDocument>("Presupuesto", presupuestoSchema);
