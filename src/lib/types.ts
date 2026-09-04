import type { PRESUPUESTO_ESTADOS, PRIORIDAD_OPTIONS } from "@/lib/constants";

export type PresupuestoEstado = (typeof PRESUPUESTO_ESTADOS)[number];
export type PresupuestoPrioridad = (typeof PRIORIDAD_OPTIONS)[number];

export type CentralSession = {
  user: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
    isCentralAdmin: boolean;
  };
  session: {
    id: string;
    expiresAt: string;
  };
  access: Array<{
    appKey: string;
    role: "admin" | "user" | "viewer";
  }>;
};

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

export type UnidadMarcaOptionDTO = {
  codigo: string;
  nombre: string;
};

export type UnidadModeloOptionDTO = {
  codigo: string;
  nombre: string;
  marcaCodigo: string;
};

export type PresupuestoDTO = {
  id: string;
  interno: string;
  esExterno: boolean;
  esReingreso: boolean;
  dominio: string;
  marca: string;
  modelo: string;
  km: number;
  costo: number;
  costoConIva: number;
  valorInfo?: number;
  porcentajeToma?: number;
  valorIngreso?: number;
  diferencia?: number;
  observaciones: string;
  estado: PresupuestoEstado;
  tallerId: string;
  tallerNombre: string;
  nroPresupuesto?: string;
  prioridad?: PresupuestoPrioridad;
  detalle?: string;
  fechaPedido?: string;
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
