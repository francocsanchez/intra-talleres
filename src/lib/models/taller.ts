import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const tallerSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    tipoTrabajo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type TallerDocument = InferSchemaType<typeof tallerSchema>;

export const TallerModel =
  (models.Taller as Model<TallerDocument>) ||
  model<TallerDocument>("Taller", tallerSchema);
