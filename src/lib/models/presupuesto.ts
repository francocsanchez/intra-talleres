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

export const PresupuestoModel =
  (models.Presupuesto as Model<PresupuestoDocument>) ||
  model<PresupuestoDocument>("Presupuesto", presupuestoSchema);
