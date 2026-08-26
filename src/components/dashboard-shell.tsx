"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CarFront,
  ClipboardList,
  Filter,
  LoaderCircle,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PRESUPUESTO_ESTADOS } from "@/lib/constants";
import {
  calculateCostoConIva,
  formatCurrency,
  formatDate,
  summarizeText,
} from "@/lib/format";
import type {
  PresupuestoDTO,
  PresupuestoEstado,
  TallerDTO,
  UnidadDTO,
} from "@/lib/types";

type DashboardShellProps = {
  initialPresupuestos: PresupuestoDTO[];
  initialTalleres: TallerDTO[];
  initialError?: string | null;
};

type FormState = {
  interno: string;
  tallerId: string;
  km: string;
  costo: string;
  observaciones: string;
  nroPresupuesto: string;
  prioridad: string;
  detalle: string;
  fechaIngresoTaller: string;
  fechaEgresoTaller: string;
};

type FilterState = {
  estado: string;
  tallerId: string;
  dominio: string;
  interno: string;
};

const initialFormState: FormState = {
  interno: "",
  tallerId: "",
  km: "",
  costo: "",
  observaciones: "",
  nroPresupuesto: "",
  prioridad: "",
  detalle: "",
  fechaIngresoTaller: "",
  fechaEgresoTaller: "",
};

const initialFilters: FilterState = {
  estado: "all",
  tallerId: "all",
  dominio: "",
  interno: "",
};

function getEstadoTone(estado: PresupuestoEstado) {
  switch (estado) {
    case "Aprobado":
      return "bg-primary text-primary-foreground";
    case "Rechazado":
      return "bg-destructive text-white";
    case "Revisar":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-accent text-accent-foreground";
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(body.message || "Ocurrió un error inesperado.");
  }

  return body;
}

export function DashboardShell({
  initialPresupuestos,
  initialTalleres,
  initialError,
}: DashboardShellProps) {
  const [presupuestos, setPresupuestos] = useState(initialPresupuestos);
  const [talleres] = useState(initialTalleres);
  const [vehicle, setVehicle] = useState<UnidadDTO | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [feedback, setFeedback] = useState<string | null>(initialError || null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isLookingUp, startLookupTransition] = useTransition();
  const deferredDominio = useDeferredValue(filters.dominio);
  const deferredInterno = useDeferredValue(filters.interno);

  const costoPreview = useMemo(() => {
    const parsed = Number(form.costo);
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }

    return calculateCostoConIva(parsed);
  }, [form.costo]);

  const resumen = useMemo(() => {
    const counts = {
      total: presupuestos.length,
      pendientes: 0,
      aprobados: 0,
      revisar: 0,
    };

    for (const presupuesto of presupuestos) {
      if (presupuesto.estado === "Pendiente") counts.pendientes += 1;
      if (presupuesto.estado === "Aprobado") counts.aprobados += 1;
      if (presupuesto.estado === "Revisar") counts.revisar += 1;
    }

    return counts;
  }, [presupuestos]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.estado !== "all") params.set("estado", filters.estado);
    if (filters.tallerId !== "all") params.set("tallerId", filters.tallerId);
    if (deferredDominio.trim()) params.set("dominio", deferredDominio.trim());
    if (deferredInterno.trim()) params.set("interno", deferredInterno.trim());

    startRefreshTransition(async () => {
      try {
        const data = await parseJsonResponse<{ presupuestos: PresupuestoDTO[] }>(
          await fetch(`/api/presupuestos?${params.toString()}`, {
            cache: "no-store",
          }),
        );
        setPresupuestos(data.presupuestos);
        setFeedback(null);
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "No pudimos refrescar la lista de presupuestos.",
        );
      }
    });
  }, [filters.estado, filters.tallerId, deferredDominio, deferredInterno]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialFormState);
    setVehicle(null);
    setLookupMessage(null);
  }

  function lookupInterno() {
    const interno = form.interno.trim();

    if (!interno) {
      setLookupMessage("Ingresá un interno antes de consultar la unidad.");
      setVehicle(null);
      return;
    }

    startLookupTransition(async () => {
      try {
        const data = await parseJsonResponse<{ unidad: UnidadDTO }>(
          await fetch(`/api/unidades?interno=${encodeURIComponent(interno)}`, {
            cache: "no-store",
          }),
        );
        setVehicle(data.unidad);
        updateForm("km", String(data.unidad.km || ""));
        setLookupMessage(`Unidad vinculada: ${data.unidad.marca} ${data.unidad.modelo}`);
        setFeedback(null);
      } catch (error) {
        setVehicle(null);
        setLookupMessage(
          error instanceof Error
            ? error.message
            : "No pudimos encontrar la unidad para ese interno.",
        );
      }
    });
  }

  function createPresupuesto() {
    startSubmitTransition(async () => {
      try {
        const response = await fetch("/api/presupuestos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            interno: form.interno.trim(),
          }),
        });

        const data = await parseJsonResponse<{ presupuesto: PresupuestoDTO }>(response);
        setPresupuestos((current) => [data.presupuesto, ...current]);
        setFeedback("Presupuesto guardado en estado Pendiente.");
        resetForm();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "No pudimos guardar el presupuesto.",
        );
      }
    });
  }

  function updateEstado(id: string, estado: PresupuestoEstado) {
    startRefreshTransition(async () => {
      try {
        const response = await fetch(`/api/presupuestos/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado }),
        });
        const data = await parseJsonResponse<{ presupuesto: PresupuestoDTO }>(response);
        setPresupuestos((current) =>
          current.map((item) => (item.id === id ? data.presupuesto : item)),
        );
        setFeedback(`Estado actualizado a ${estado}.`);
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el estado del presupuesto.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-3 py-3 md:px-4 lg:px-5">
        <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-border/70 shadow-none">
            <CardHeader className="gap-3 border-b border-border/70 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                    Mesa de control
                  </p>
                  <CardTitle className="font-heading text-3xl tracking-[-0.05em]">
                    Presupuestos de taller en una sola vista
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm text-muted-foreground">
                    Reemplazamos la lógica de hojas separadas por un tablero operativo
                    compacto, con lookup por interno y trazabilidad de estado en tiempo
                    real.
                  </CardDescription>
                </div>
                <div className="hidden min-w-[220px] items-stretch gap-2 rounded-lg border border-border/70 bg-secondary/50 p-2 md:flex">
                  <div className="flex-1 rounded-md border border-border/70 bg-background p-2">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                      Tono visual
                    </p>
                    <p className="mt-1 text-sm font-medium">Mesa técnica compacta</p>
                  </div>
                  <div className="w-16 rounded-md bg-[repeating-linear-gradient(135deg,theme(colors.foreground)_0_3px,transparent_3px_9px)] opacity-8" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <MetricTile
                  icon={ClipboardList}
                  label="Presupuestos visibles"
                  value={String(resumen.total)}
                />
                <MetricTile icon={ShieldCheck} label="Aprobados" value={String(resumen.aprobados)} />
                <MetricTile
                  icon={AlertCircle}
                  label="Pendientes + revisar"
                  value={String(resumen.pendientes + resumen.revisar)}
                />
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-3">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Reglas activas
              </p>
              <CardTitle className="font-heading text-xl tracking-[-0.04em]">
                Fuente de datos y operación del MVP
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <RuleRow icon={CarFront} title="Unidades desde SQL" value="Solo lectura por interno." />
              <RuleRow icon={Wrench} title="Datos propios en Mongo" value="Base local intra_talleres." />
              <RuleRow
                icon={Filter}
                title="Estados cerrados"
                value="Pendiente, Aprobado, Rechazado y Revisar."
              />
            </CardContent>
          </Card>
        </section>

        {feedback ? (
          <div className="rounded-lg border border-border/80 bg-secondary/60 px-3 py-2 text-sm text-foreground">
            {feedback}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[410px_minmax(0,1fr)]">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-3">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Alta rápida
              </p>
              <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                Nuevo presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="interno">Interno</Label>
                <div className="flex gap-2">
                  <Input
                    id="interno"
                    value={form.interno}
                    onChange={(event) => updateForm("interno", event.target.value)}
                    placeholder="Ej. 10342"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={lookupInterno}
                    disabled={isLookingUp}
                  >
                    {isLookingUp ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    Buscar
                  </Button>
                </div>
                {lookupMessage ? (
                  <p className="text-xs text-muted-foreground">{lookupMessage}</p>
                ) : null}
              </div>

              <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
                <div className="grid gap-1">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Unidad vinculada
                  </p>
                  <p className="font-medium">
                    {vehicle
                      ? `${vehicle.dominio} · ${vehicle.marca} ${vehicle.modelo}`
                      : "Buscá un interno para autocompletar dominio, marca y modelo."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle
                      ? `KM de base: ${vehicle.km} · Chasis: ${vehicle.chasis || "s/d"}`
                      : "Sin datos aún."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="taller">Taller</Label>
                  <Select
                    value={form.tallerId}
                    onValueChange={(value) => updateForm("tallerId", value ?? "")}
                  >
                    <SelectTrigger id="taller" className="w-full">
                      <SelectValue placeholder="Seleccionar taller" />
                    </SelectTrigger>
                    <SelectContent>
                      {talleres.map((taller) => (
                        <SelectItem key={taller.id} value={taller.id}>
                          {taller.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Field label="KM informado" htmlFor="km">
                  <Input
                    id="km"
                    value={form.km}
                    onChange={(event) => updateForm("km", event.target.value)}
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Costo ARS" htmlFor="costo">
                  <Input
                    id="costo"
                    value={form.costo}
                    onChange={(event) => updateForm("costo", event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </Field>
                <Field label="Nro presupuesto" htmlFor="nroPresupuesto">
                  <Input
                    id="nroPresupuesto"
                    value={form.nroPresupuesto}
                    onChange={(event) => updateForm("nroPresupuesto", event.target.value)}
                  />
                </Field>
                <Field label="Prioridad" htmlFor="prioridad">
                  <Input
                    id="prioridad"
                    value={form.prioridad}
                    onChange={(event) => updateForm("prioridad", event.target.value)}
                    placeholder="Alta / Media / Baja"
                  />
                </Field>
                <Field label="Ingreso a taller" htmlFor="fechaIngresoTaller">
                  <Input
                    id="fechaIngresoTaller"
                    value={form.fechaIngresoTaller}
                    onChange={(event) =>
                      updateForm("fechaIngresoTaller", event.target.value)
                    }
                    type="date"
                  />
                </Field>
                <Field label="Egreso de taller" htmlFor="fechaEgresoTaller">
                  <Input
                    id="fechaEgresoTaller"
                    value={form.fechaEgresoTaller}
                    onChange={(event) =>
                      updateForm("fechaEgresoTaller", event.target.value)
                    }
                    type="date"
                  />
                </Field>
              </div>

              <Field label="Detalle" htmlFor="detalle">
                <Textarea
                  id="detalle"
                  value={form.detalle}
                  onChange={(event) => updateForm("detalle", event.target.value)}
                  rows={3}
                  placeholder="Trabajo presupuestado o reparación a considerar"
                />
              </Field>

              <Field label="Observaciones" htmlFor="observaciones">
                <Textarea
                  id="observaciones"
                  value={form.observaciones}
                  onChange={(event) => updateForm("observaciones", event.target.value)}
                  rows={4}
                  placeholder="Notas internas, valor de toma o comentarios del caso"
                />
              </Field>

              <div className="rounded-lg border border-border/70 bg-background p-3">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Vista previa de costo
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Neto</p>
                    <p className="text-lg font-semibold">
                      {form.costo ? formatCurrency(Number(form.costo)) : "$ 0,00"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Con IVA</p>
                    <p className="font-heading text-2xl tracking-[-0.04em]">
                      {costoPreview ? formatCurrency(costoPreview) : "$ 0,00"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={createPresupuesto}
                  disabled={isSubmitting || !vehicle}
                >
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Guardar presupuesto
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                    Vista consolidada
                  </p>
                  <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                    Seguimiento unificado por taller
                  </CardTitle>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <Input
                    value={filters.interno}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, interno: event.target.value }))
                    }
                    placeholder="Filtrar por interno"
                  />
                  <Input
                    value={filters.dominio}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, dominio: event.target.value }))
                    }
                    placeholder="Filtrar por dominio"
                  />
                  <Select
                    value={filters.tallerId}
                    onValueChange={(value) =>
                      setFilters((current) => ({ ...current, tallerId: value ?? "all" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos los talleres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los talleres</SelectItem>
                      {talleres.map((taller) => (
                        <SelectItem key={taller.id} value={taller.id}>
                          {taller.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.estado}
                    onValueChange={(value) =>
                      setFilters((current) => ({ ...current, estado: value ?? "all" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {PRESUPUESTO_ESTADOS.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[1120px]">
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead>Estado</TableHead>
                      <TableHead>Taller</TableHead>
                      <TableHead>Interno</TableHead>
                      <TableHead>Dominio</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Costo + IVA</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Egreso</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presupuestos.length ? (
                      presupuestos.map((presupuesto) => (
                        <TableRow key={presupuesto.id} className="align-top">
                          <TableCell>
                            <Select
                              value={presupuesto.estado}
                              onValueChange={(value) =>
                                updateEstado(presupuesto.id, value as PresupuestoEstado)
                              }
                            >
                              <SelectTrigger className="w-[138px] border-none bg-transparent px-0 shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRESUPUESTO_ESTADOS.map((estado) => (
                                  <SelectItem key={estado} value={estado}>
                                    {estado}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Badge className={`mt-2 ${getEstadoTone(presupuesto.estado)}`}>
                              {presupuesto.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{presupuesto.tallerNombre}</TableCell>
                          <TableCell>{presupuesto.interno}</TableCell>
                          <TableCell>{presupuesto.dominio}</TableCell>
                          <TableCell>
                            <div className="min-w-[180px]">
                              <p className="font-medium">{presupuesto.marca}</p>
                              <p className="text-xs text-muted-foreground">
                                {presupuesto.modelo}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{presupuesto.km}</TableCell>
                          <TableCell>{formatCurrency(presupuesto.costo)}</TableCell>
                          <TableCell>{formatCurrency(presupuesto.costoConIva)}</TableCell>
                          <TableCell className="text-xs">
                            {presupuesto.fechaIngresoTaller
                              ? formatDate(presupuesto.fechaIngresoTaller)
                              : "Sin fecha"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {presupuesto.fechaEgresoTaller
                              ? formatDate(presupuesto.fechaEgresoTaller)
                              : "Sin fecha"}
                          </TableCell>
                          <TableCell className="max-w-[290px]">
                            <div className="space-y-1">
                              {presupuesto.nroPresupuesto ? (
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  {presupuesto.nroPresupuesto}
                                </p>
                              ) : null}
                              <p className="text-sm">
                                {presupuesto.observaciones
                                  ? summarizeText(presupuesto.observaciones)
                                  : "Sin observaciones"}
                              </p>
                              {presupuesto.detalle ? (
                                <p className="text-xs text-muted-foreground">
                                  {summarizeText(presupuesto.detalle, 64)}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          {isRefreshing
                            ? "Actualizando presupuestos..."
                            : "Todavía no hay presupuestos para los filtros actuales."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-3xl tracking-[-0.06em]">{value}</p>
        </div>
        <div className="rounded-md border border-border/70 p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function RuleRow({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof ClipboardList;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
      <div className="rounded-md border border-border/70 bg-background p-2">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
