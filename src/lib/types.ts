import type { PRESUPUESTO_ESTADOS } from "@/lib/constants";

export type PresupuestoEstado = (typeof PRESUPUESTO_ESTADOS)[number];

export type TallerDTO = {
  id: string;
  nombre: string;
  activo: boolean;
  tipoTrabajo?: string;
};

export type UnidadDTO = {
  interno: string;
  dominio: string;
  marca: string;
  modelo: string;
  km: number;
  chasis?: string;
};

export type PresupuestoDTO = {
  id: string;
  interno: string;
  dominio: string;
  marca: string;
  modelo: string;
  km: number;
  costo: number;
  costoConIva: number;
  observaciones: string;
  estado: PresupuestoEstado;
  tallerId: string;
  tallerNombre: string;
  nroPresupuesto?: string;
  prioridad?: string;
  detalle?: string;
  fechaIngresoTaller?: string;
  fechaEgresoTaller?: string;
  createdAt: string;
  updatedAt: string;
};

export type PresupuestoFilters = {
  estado?: string;
  tallerId?: string;
  dominio?: string;
  interno?: string;
};
