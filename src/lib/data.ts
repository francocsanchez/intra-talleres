import { PRIORIDAD_OPTIONS, TALLERES_INICIALES } from "@/lib/constants";
import { connectToMongo } from "@/lib/mongodb";
import { PresupuestoModel } from "@/lib/models/presupuesto";
import { TallerModel } from "@/lib/models/taller";
import type { PresupuestoDTO, PresupuestoFilters, TallerDTO } from "@/lib/types";

function sanitizeOptionalString(value?: string | null) {
  return value || undefined;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTallerName(value: string) {
  return value.trim();
}

function sanitizePrioridad(value?: string | null): PresupuestoDTO["prioridad"] {
  if (!value) {
    return undefined;
  }

  return PRIORIDAD_OPTIONS.includes(value as (typeof PRIORIDAD_OPTIONS)[number])
    ? (value as PresupuestoDTO["prioridad"])
    : undefined;
}

function serializeTaller(taller: {
  _id: { toString(): string };
  nombre: string;
  activo: boolean;
  tipoTrabajo?: string | null;
}) {
  return {
    id: taller._id.toString(),
    nombre: taller.nombre,
    activo: taller.activo,
    tipoTrabajo: sanitizeOptionalString(taller.tipoTrabajo),
  } satisfies TallerDTO;
}

function serializePresupuesto(presupuesto: {
  _id: { toString(): string };
  interno: string;
  dominio: string;
  marca: string;
  modelo: string;
  km: number;
  costo: number;
  costoConIva: number;
  observaciones: string;
  estado: PresupuestoDTO["estado"];
  tallerId: { toString(): string };
  tallerNombre: string;
  nroPresupuesto?: string | null;
  prioridad?: string | null;
  detalle?: string | null;
  fechaIngresoTaller?: Date | null;
  fechaEgresoTaller?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: presupuesto._id.toString(),
    interno: presupuesto.interno,
    dominio: presupuesto.dominio,
    marca: presupuesto.marca,
    modelo: presupuesto.modelo,
    km: presupuesto.km,
    costo: presupuesto.costo,
    costoConIva: presupuesto.costoConIva,
    observaciones: presupuesto.observaciones,
    estado: presupuesto.estado,
    tallerId: presupuesto.tallerId.toString(),
    tallerNombre: presupuesto.tallerNombre,
    nroPresupuesto: sanitizeOptionalString(presupuesto.nroPresupuesto),
    prioridad: sanitizePrioridad(presupuesto.prioridad),
    detalle: sanitizeOptionalString(presupuesto.detalle),
    fechaIngresoTaller: presupuesto.fechaIngresoTaller?.toISOString(),
    fechaEgresoTaller: presupuesto.fechaEgresoTaller?.toISOString(),
    createdAt: presupuesto.createdAt.toISOString(),
    updatedAt: presupuesto.updatedAt.toISOString(),
  } satisfies PresupuestoDTO;
}

export async function ensureInitialCatalogs() {
  await connectToMongo();

  const totalTalleres = await TallerModel.countDocuments();

  if (totalTalleres === 0) {
    await TallerModel.insertMany(
      TALLERES_INICIALES.map((rawName) => ({
        nombre: normalizeTallerName(rawName),
        activo: true,
      })),
    );
  }
}

export async function getTalleres() {
  await ensureInitialCatalogs();

  const talleres = await TallerModel.find().sort({ nombre: 1 }).lean();
  return talleres.map(serializeTaller);
}

export async function createTallerRecord(input: {
  nombre: string;
  tipoTrabajo?: string;
  activo: boolean;
}) {
  await connectToMongo();
  const nombre = normalizeTallerName(input.nombre);

  const existing = await TallerModel.findOne({
    nombre: { $regex: `^${escapeRegex(nombre)}$`, $options: "i" },
  }).lean();

  if (existing) {
    throw new Error("Ya existe un taller con ese nombre.");
  }

  const created = await TallerModel.create({
    ...input,
    nombre,
  });
  return serializeTaller(created.toObject());
}

export async function updateTallerRecord(
  id: string,
  input: {
    nombre?: string;
    tipoTrabajo?: string;
    activo?: boolean;
  },
) {
  await connectToMongo();
  const normalizedNombre = input.nombre ? normalizeTallerName(input.nombre) : undefined;

  if (normalizedNombre) {
    const existing = await TallerModel.findOne({
      _id: { $ne: id },
      nombre: { $regex: `^${escapeRegex(normalizedNombre)}$`, $options: "i" },
    }).lean();

    if (existing) {
      throw new Error("Ya existe otro taller con ese nombre.");
    }
  }

  const updated = await TallerModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...input,
        nombre: normalizedNombre,
        tipoTrabajo: sanitizeOptionalString(input.tipoTrabajo),
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    return null;
  }

  return serializeTaller(updated);
}

export async function deleteTallerRecord(id: string) {
  await connectToMongo();

  const linkedPresupuesto = await PresupuestoModel.exists({ tallerId: id });
  if (linkedPresupuesto) {
    throw new Error(
      "No se puede eliminar el taller porque ya tiene presupuestos asociados.",
    );
  }

  const deleted = await TallerModel.findByIdAndDelete(id).lean();
  return Boolean(deleted);
}

export async function getPresupuestos(filters: PresupuestoFilters = {}) {
  await connectToMongo();

  const query: Record<string, unknown> = {};

  if (filters.estado) {
    query.estado = filters.estado;
  }

  if (filters.tallerId) {
    query.tallerId = filters.tallerId;
  }

  if (filters.dominio) {
    query.dominio = { $regex: filters.dominio, $options: "i" };
  }

  if (filters.interno) {
    query.interno = { $regex: filters.interno, $options: "i" };
  }

  const presupuestos = await PresupuestoModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return presupuestos.map(serializePresupuesto);
}

export async function createPresupuestoRecord(input: {
  interno: string;
  dominio: string;
  marca: string;
  modelo: string;
  km: number;
  costo: number;
  costoConIva: number;
  observaciones: string;
  estado: PresupuestoDTO["estado"];
  tallerId: string;
  tallerNombre: string;
  nroPresupuesto?: string;
  prioridad?: string;
  detalle?: string;
  fechaIngresoTaller?: string;
  fechaEgresoTaller?: string;
}) {
  await connectToMongo();

  const created = await PresupuestoModel.create({
    ...input,
    fechaIngresoTaller: input.fechaIngresoTaller || undefined,
    fechaEgresoTaller: input.fechaEgresoTaller || undefined,
  });

  return serializePresupuesto(created.toObject());
}

export async function updatePresupuestoEstado(id: string, estado: PresupuestoDTO["estado"]) {
  await connectToMongo();

  const presupuesto = await PresupuestoModel.findByIdAndUpdate(
    id,
    { estado },
    { new: true },
  ).lean();

  if (!presupuesto) {
    return null;
  }

  return serializePresupuesto(presupuesto);
}
