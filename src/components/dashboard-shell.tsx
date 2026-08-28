"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TriangleAlert,
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
import { EChartsSurface, type DashboardChartOption } from "@/components/echarts-surface";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PRESUPUESTO_ESTADOS, PRIORIDAD_OPTIONS } from "@/lib/constants";
import {
  calculateCostoConIva,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type {
  PresupuestoDTO,
  PresupuestoEstado,
  TallerDTO,
  UnidadDTO,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  initialPresupuestos: PresupuestoDTO[];
  initialTalleres: TallerDTO[];
  initialError?: string | null;
  currentUserEmail: string;
  currentUserName?: string | null;
  currentUserRole?: string;
};

type ViewMode = "dashboard" | "presupuestos" | "configuracion";

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

type TallerFormState = {
  nombre: string;
  tipoTrabajo: string;
  activo: "true" | "false";
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

const initialTallerFormState: TallerFormState = {
  nombre: "",
  tipoTrabajo: "",
  activo: "true",
};

const estadoChartOrder: PresupuestoEstado[] = [
  "Pendiente",
  "Revisar",
  "Aprobado",
  "Rechazado",
];

const estadoChartColors: Record<PresupuestoEstado, string> = {
  Pendiente: "#7c7c7c",
  Revisar: "#a3a3a3",
  Aprobado: "#171717",
  Rechazado: "#d14d41",
};

function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function buildCategoryCounts(values: Array<string | undefined>, emptyLabel: string) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = value?.trim() || emptyLabel;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

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

function getPrioridadTone(prioridad?: string) {
  switch (prioridad) {
    case "Alta":
      return "bg-destructive text-white";
    case "Media":
      return "bg-secondary text-secondary-foreground";
    case "Baja":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
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
  currentUserEmail,
  currentUserName,
  currentUserRole,
}: DashboardShellProps) {
  const [activeView, setActiveView] = useState<ViewMode>("dashboard");
  const [presupuestos, setPresupuestos] = useState(initialPresupuestos);
  const [talleres, setTalleres] = useState(initialTalleres);
  const [vehicle, setVehicle] = useState<UnidadDTO | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [feedback, setFeedback] = useState<string | null>(initialError || null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [detailsPresupuesto, setDetailsPresupuesto] = useState<PresupuestoDTO | null>(null);
  const [managePresupuesto, setManagePresupuesto] = useState<PresupuestoDTO | null>(null);
  const [manageEstadoDraft, setManageEstadoDraft] = useState<PresupuestoEstado>("Pendiente");
  const [manageEgresoDraft, setManageEgresoDraft] = useState("");
  const [tallerForm, setTallerForm] = useState<TallerFormState>(initialTallerFormState);
  const [editingTallerId, setEditingTallerId] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isLookingUp, startLookupTransition] = useTransition();
  const [isSavingTaller, startSavingTallerTransition] = useTransition();
  const [isDeletingTaller, startDeletingTallerTransition] = useTransition();
  const deferredDominio = useDeferredValue(filters.dominio);
  const deferredInterno = useDeferredValue(filters.interno);

  async function refreshPresupuestos() {
    const params = new URLSearchParams();

    if (filters.estado !== "all") params.set("estado", filters.estado);
    if (filters.tallerId !== "all") params.set("tallerId", filters.tallerId);
    if (deferredDominio.trim()) params.set("dominio", deferredDominio.trim());
    if (deferredInterno.trim()) params.set("interno", deferredInterno.trim());

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
  }

  async function refreshTalleres() {
    try {
      const data = await parseJsonResponse<{ talleres: TallerDTO[] }>(
        await fetch("/api/talleres", { cache: "no-store" }),
      );
      setTalleres(data.talleres);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No pudimos refrescar los talleres.",
      );
    }
  }

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
      rechazados: 0,
      revisar: 0,
    };

    for (const presupuesto of presupuestos) {
      if (presupuesto.estado === "Pendiente") counts.pendientes += 1;
      if (presupuesto.estado === "Aprobado") counts.aprobados += 1;
      if (presupuesto.estado === "Rechazado") counts.rechazados += 1;
      if (presupuesto.estado === "Revisar") counts.revisar += 1;
    }

    return counts;
  }, [presupuestos]);

  const chartOptions = useMemo(() => {
    const presupuestosPorMes = new Map<
      string,
      Record<PresupuestoEstado, number>
    >();
    const gastoAprobadoPorMes = new Map<string, number>();

    for (const presupuesto of presupuestos) {
      const monthKey = getMonthKey(presupuesto.createdAt);
      const monthBucket = presupuestosPorMes.get(monthKey) || {
        Pendiente: 0,
        Revisar: 0,
        Aprobado: 0,
        Rechazado: 0,
      };

      monthBucket[presupuesto.estado] += 1;
      presupuestosPorMes.set(monthKey, monthBucket);

      if (presupuesto.estado === "Aprobado") {
        gastoAprobadoPorMes.set(
          monthKey,
          (gastoAprobadoPorMes.get(monthKey) || 0) + presupuesto.costoConIva,
        );
      }
    }

    const monthKeys = Array.from(presupuestosPorMes.keys()).sort();
    const monthLabels = monthKeys.map(formatMonthKey);

    const presupuestosPorMesOption: DashboardChartOption = {
      color: estadoChartOrder.map((estado) => estadoChartColors[estado]),
      grid: { top: 44, left: 40, right: 16, bottom: 32, containLabel: true },
      legend: { top: 8, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: monthLabels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#d9d9d9" } },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#ececec" } },
        axisLabel: { fontSize: 11 },
      },
      series: estadoChartOrder.map((estado) => ({
        name: estado,
        type: "bar",
        stack: "estado",
        barMaxWidth: 34,
        emphasis: { focus: "series" },
        data: monthKeys.map((key) => presupuestosPorMes.get(key)?.[estado] || 0),
      })),
    };

    const gastoAprobadoOption: DashboardChartOption = {
      color: ["#171717"],
      grid: { top: 24, left: 48, right: 16, bottom: 32, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value) =>
          typeof value === "number" ? formatCurrency(value) : String(value),
      },
      xAxis: {
        type: "category",
        data: monthLabels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#d9d9d9" } },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#ececec" } },
        axisLabel: {
          fontSize: 11,
          formatter: (value: number) => `${Math.round(value / 1000)}k`,
        },
      },
      series: [
        {
          name: "Aprobados",
          type: "bar",
          barMaxWidth: 38,
          data: monthKeys.map((key) => gastoAprobadoPorMes.get(key) || 0),
        },
      ],
    };

    const marcas = buildCategoryCounts(
      presupuestos.map((presupuesto) => presupuesto.marca),
      "Sin marca",
    );
    const marcasOption: DashboardChartOption = {
      color: ["#171717"],
      grid: { top: 20, left: 110, right: 20, bottom: 20, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#ececec" } },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: marcas.map(([label]) => label),
        axisTick: { show: false },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 26,
          data: marcas.map(([, count]) => count),
        },
      ],
    };

    const talleresChart = buildCategoryCounts(
      presupuestos.map((presupuesto) => presupuesto.tallerNombre),
      "Sin taller",
    );
    const talleresOption: DashboardChartOption = {
      color: ["#7c7c7c"],
      grid: { top: 20, left: 110, right: 20, bottom: 20, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#ececec" } },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: talleresChart.map(([label]) => label),
        axisTick: { show: false },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 26,
          data: talleresChart.map(([, count]) => count),
        },
      ],
    };

    return {
      presupuestosPorMesOption,
      gastoAprobadoOption,
      marcasOption,
      talleresOption,
    };
  }, [presupuestos]);

  useEffect(() => {
    startRefreshTransition(async () => {
      await refreshPresupuestos();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.estado, filters.tallerId, deferredDominio, deferredInterno]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialFormState);
    setVehicle(null);
    setLookupMessage(null);
    setIsCreateDialogOpen(false);
  }

  function resetTallerForm() {
    setTallerForm(initialTallerFormState);
    setEditingTallerId(null);
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
            prioridad: form.prioridad || undefined,
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

  function openManagePresupuesto(presupuesto: PresupuestoDTO) {
    setManagePresupuesto(presupuesto);
    setManageEstadoDraft(presupuesto.estado);
    setManageEgresoDraft(presupuesto.fechaEgresoTaller?.slice(0, 10) ?? "");
  }

  function savePresupuestoManagement() {
    if (!managePresupuesto) {
      return;
    }

    startRefreshTransition(async () => {
      try {
        const response = await fetch(`/api/presupuestos/${managePresupuesto.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: manageEstadoDraft,
            fechaEgresoTaller: manageEgresoDraft,
          }),
        });
        const data = await parseJsonResponse<{ presupuesto: PresupuestoDTO }>(response);
        setPresupuestos((current) =>
          current.map((item) =>
            item.id === managePresupuesto.id ? data.presupuesto : item,
          ),
        );
        setManagePresupuesto(null);
        setFeedback("Estado y egreso actualizados.");
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el estado y egreso.",
        );
      }
    });
  }

  function startEditTaller(taller: TallerDTO) {
    setActiveView("configuracion");
    setEditingTallerId(taller.id);
    setTallerForm({
      nombre: taller.nombre,
      tipoTrabajo: taller.tipoTrabajo || "",
      activo: taller.activo ? "true" : "false",
    });
  }

  function saveTaller() {
    startSavingTallerTransition(async () => {
      try {
        const method = editingTallerId ? "PATCH" : "POST";
        const url = editingTallerId
          ? `/api/talleres/${editingTallerId}`
          : "/api/talleres";

        await parseJsonResponse(
          await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: tallerForm.nombre,
              tipoTrabajo: tallerForm.tipoTrabajo || undefined,
              activo: tallerForm.activo === "true",
            }),
          }),
        );

        await refreshTalleres();
        setFeedback(
          editingTallerId ? "Taller actualizado." : "Taller creado correctamente.",
        );
        resetTallerForm();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "No pudimos guardar el taller.",
        );
      }
    });
  }

  function deleteTaller(id: string) {
    startDeletingTallerTransition(async () => {
      try {
        await parseJsonResponse(
          await fetch(`/api/talleres/${id}`, {
            method: "DELETE",
          }),
        );

        if (editingTallerId === id) {
          resetTallerForm();
        }

        if (filters.tallerId === id) {
          setFilters((current) => ({ ...current, tallerId: "all" }));
        }

        await refreshTalleres();
        setFeedback("Taller eliminado.");
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "No pudimos eliminar el taller.",
        );
      }
    });
  }

  const navigationItems: Array<{
    id: ViewMode;
    label: string;
    description: string;
    icon: typeof ClipboardList;
  }> = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Resumen por estado",
      icon: BarChart3,
    },
    {
      id: "presupuestos",
      label: "Presupuestos",
      description: "Carga y seguimiento",
      icon: ClipboardList,
    },
    {
      id: "configuracion",
      label: "Configuración",
      description: "CRUD de talleres",
      icon: Settings,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-3 py-3 md:px-4 lg:px-5">
        <nav className="rounded-xl border border-border/70 bg-background/95 p-2 shadow-none backdrop-blur">
          <div className="mb-2 flex flex-col gap-2 rounded-lg border border-border/70 bg-secondary/25 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                Sesión activa
              </p>
              <p className="text-sm font-medium">
                {currentUserName || "Administrador"} · {currentUserEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                Rol para esta app: {currentUserRole || "Sin rol"}
              </p>
            </div>
            <SignOutButton />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-secondary/35 text-foreground hover:bg-secondary/60",
                  )}
                >
                  <span
                    className={cn(
                      "rounded-md border p-2",
                      active
                        ? "border-white/20 bg-white/10"
                        : "border-border/70 bg-background",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span
                      className={cn(
                        "block text-xs",
                        active ? "text-white/70" : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {feedback ? (
          <div className="rounded-lg border border-border/80 bg-secondary/60 px-3 py-2 text-sm text-foreground">
            {feedback}
          </div>
        ) : null}

        {activeView === "dashboard" ? (
          <section className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <MetricTile
                icon={ClipboardList}
                label="Total"
                value={String(resumen.total)}
                caption="Presupuestos visibles"
              />
              <MetricTile
                icon={TriangleAlert}
                label="Pendiente"
                value={String(resumen.pendientes)}
                caption="Esperando definición"
              />
              <MetricTile
                icon={ShieldCheck}
                label="Aprobado"
                value={String(resumen.aprobados)}
                caption="Listos para avanzar"
              />
              <MetricTile
                icon={TriangleAlert}
                label="Revisar"
                value={String(resumen.revisar)}
                caption="Casos a validar"
              />
              <MetricTile
                icon={Trash2}
                label="Rechazado"
                value={String(resumen.rechazados)}
                caption="Descartados"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard
                title="Presupuestos por mes"
                description="Barras apiladas por estado para seguir volumen y mezcla mensual."
              >
                <EChartsSurface
                  option={chartOptions.presupuestosPorMesOption}
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="Gasto aprobado por mes"
                description="Suma mensual de presupuestos aprobados calculada con IVA incluido."
              >
                <EChartsSurface
                  option={chartOptions.gastoAprobadoOption}
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="Presupuestos por marca"
                description="Distribución actual por marca para detectar concentración de trabajo."
              >
                <EChartsSurface option={chartOptions.marcasOption} height={360} />
              </ChartCard>

              <ChartCard
                title="Presupuestos por taller"
                description="Carga acumulada por proveedor para comparar volumen operativo."
              >
                <EChartsSurface option={chartOptions.talleresOption} height={360} />
              </ChartCard>
            </div>
          </section>
        ) : null}

        {activeView === "presupuestos" ? (
          <section className="grid gap-4">
            <Card className="border-border/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                      Seguimiento de presupuestos
                    </CardTitle>
                    <CardDescription>
                      Cargá nuevos presupuestos desde un modal y completá el egreso cuando la
                      unidad salga de taller.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger
                        render={
                          <Button type="button" className="w-full xl:w-auto" />
                        }
                      >
                          <Plus className="size-4" />
                          Nuevo presupuesto
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                            Generar presupuesto
                          </DialogTitle>
                          <DialogDescription>
                            Registrá la unidad, el taller y el costo inicial. La fecha de
                            egreso puede cargarse después desde la tabla.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
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
                                onChange={(event) =>
                                  updateForm("nroPresupuesto", event.target.value)
                                }
                              />
                            </Field>
                            <Field label="Prioridad" htmlFor="prioridad">
                              <Select
                                value={form.prioridad || "none"}
                                onValueChange={(value) =>
                                  updateForm(
                                    "prioridad",
                                    value === "none" ? "" : (value ?? ""),
                                  )
                                }
                              >
                                <SelectTrigger id="prioridad" className="w-full">
                                  <SelectValue placeholder="Seleccionar prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin definir</SelectItem>
                                  {PRIORIDAD_OPTIONS.map((priority) => (
                                    <SelectItem key={priority} value={priority}>
                                      {priority}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              onChange={(event) =>
                                updateForm("observaciones", event.target.value)
                              }
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
                              {isSubmitting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : null}
                              Guardar presupuesto
                            </Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                              Limpiar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="grid w-full gap-2 md:grid-cols-4 xl:w-[920px]">
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
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1220px]">
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Estado</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Taller</TableHead>
                        <TableHead>Interno</TableHead>
                        <TableHead>Dominio</TableHead>
                        <TableHead>Marca / Modelo</TableHead>
                        <TableHead>KM</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Costo + IVA</TableHead>
                        <TableHead>Ingreso</TableHead>
                        <TableHead>Egreso</TableHead>
                        <TableHead>Gestión</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presupuestos.length ? (
                        presupuestos.map((presupuesto) => (
                          <TableRow key={presupuesto.id} className="align-top">
                            <TableCell>
                              <Badge className={getEstadoTone(presupuesto.estado)}>
                                {presupuesto.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPrioridadTone(presupuesto.prioridad)}>
                                {presupuesto.prioridad || "Sin definir"}
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
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openManagePresupuesto(presupuesto)}
                              >
                                <Pencil className="size-4" />
                                Gestionar
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailsPresupuesto(presupuesto)}
                              >
                                <FileText className="size-4" />
                                Ver más
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                          colSpan={13}
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

            <Dialog
              open={Boolean(managePresupuesto)}
              onOpenChange={(open) => {
                if (!open) {
                  setManagePresupuesto(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                    Gestionar presupuesto
                  </DialogTitle>
                  <DialogDescription>
                    {managePresupuesto
                      ? `${managePresupuesto.dominio} · ${managePresupuesto.marca} ${managePresupuesto.modelo}`
                      : "Actualizá estado y fecha de egreso."}
                  </DialogDescription>
                </DialogHeader>

                {managePresupuesto ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Estado" htmlFor="manage-estado">
                        <Select
                          value={manageEstadoDraft}
                          onValueChange={(value) =>
                            setManageEstadoDraft(value as PresupuestoEstado)
                          }
                        >
                          <SelectTrigger id="manage-estado" className="w-full">
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
                      </Field>
                      <Field label="Fecha de egreso" htmlFor="manage-egreso">
                        <Input
                          id="manage-egreso"
                          type="date"
                          value={manageEgresoDraft}
                          onChange={(event) => setManageEgresoDraft(event.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-secondary/25 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Estado actual
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <Badge className={getEstadoTone(managePresupuesto.estado)}>
                          {managePresupuesto.estado}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {managePresupuesto.fechaEgresoTaller
                            ? `Egreso cargado: ${formatDate(managePresupuesto.fechaEgresoTaller)}`
                            : "Todavía sin fecha de egreso"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={savePresupuestoManagement}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : null}
                        Guardar cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setManagePresupuesto(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>

            <Dialog
              open={Boolean(detailsPresupuesto)}
              onOpenChange={(open) => {
                if (!open) {
                  setDetailsPresupuesto(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                    {detailsPresupuesto
                      ? `${detailsPresupuesto.dominio} · ${detailsPresupuesto.marca} ${detailsPresupuesto.modelo}`
                      : "Detalle del presupuesto"}
                  </DialogTitle>
                  <DialogDescription>
                    {detailsPresupuesto
                      ? `Interno ${detailsPresupuesto.interno} · Taller ${detailsPresupuesto.tallerNombre}`
                      : "Detalle ampliado del presupuesto."}
                  </DialogDescription>
                </DialogHeader>

                {detailsPresupuesto ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <DetailStat
                        label="Estado"
                        value={detailsPresupuesto.estado}
                      />
                      <DetailStat
                        label="Prioridad"
                        value={detailsPresupuesto.prioridad || "Sin definir"}
                      />
                      <DetailStat
                        label="Egreso"
                        value={
                          detailsPresupuesto.fechaEgresoTaller
                            ? formatDate(detailsPresupuesto.fechaEgresoTaller)
                            : "Sin fecha"
                        }
                      />
                    </div>
                    <div className="rounded-lg border border-border/70 bg-secondary/25 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Observaciones
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {detailsPresupuesto.observaciones || "Sin observaciones"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Detalle
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {detailsPresupuesto.detalle || "Sin detalle"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </section>
        ) : null}

        {activeView === "configuracion" ? (
          <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="border-border/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-3">
                <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                  CRUD de talleres
                </CardTitle>
                <CardDescription>
                  Alta, edición y baja lógica o física del catálogo operativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Field label="Nombre del taller" htmlFor="tallerNombre">
                  <Input
                    id="tallerNombre"
                    value={tallerForm.nombre}
                    onChange={(event) =>
                      setTallerForm((current) => ({
                        ...current,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Ej. Nuevo taller"
                  />
                </Field>
                <Field label="Tipo de trabajo" htmlFor="tipoTrabajo">
                  <Input
                    id="tipoTrabajo"
                    value={tallerForm.tipoTrabajo}
                    onChange={(event) =>
                      setTallerForm((current) => ({
                        ...current,
                        tipoTrabajo: event.target.value,
                      }))
                    }
                    placeholder="Mecánica, chapa, limpieza, gomería"
                  />
                </Field>
                <Field label="Estado" htmlFor="activo">
                  <Select
                    value={tallerForm.activo}
                    onValueChange={(value) =>
                      setTallerForm((current) => ({
                        ...current,
                        activo: (value ?? "true") as "true" | "false",
                      }))
                    }
                  >
                    <SelectTrigger id="activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={saveTaller}
                    disabled={isSavingTaller}
                  >
                    {isSavingTaller ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : editingTallerId ? (
                      <Pencil className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {editingTallerId ? "Guardar cambios" : "Crear taller"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetTallerForm}>
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-3">
                <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                  Catálogo actual
                </CardTitle>
                <CardDescription>
                  Los talleres usados por presupuestos no se pueden eliminar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Taller</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[180px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {talleres.map((taller) => (
                        <TableRow key={taller.id}>
                          <TableCell className="font-medium">{taller.nombre}</TableCell>
                          <TableCell>{taller.tipoTrabajo || "Sin definir"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                taller.activo
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }
                            >
                              {taller.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => startEditTaller(taller)}
                              >
                                <Pencil className="size-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => deleteTaller(taller.id)}
                                disabled={isDeletingTaller}
                              >
                                {isDeletingTaller ? (
                                  <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-heading text-4xl tracking-[-0.08em]">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          </div>
          <div className="rounded-md border border-border/70 bg-secondary/35 p-2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="border-b border-border/70 pb-3">
        <CardTitle className="font-heading text-xl tracking-[-0.04em]">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
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
