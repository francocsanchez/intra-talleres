"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  ChevronDown,
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
  UserRound,
} from "lucide-react";
import type { TopLevelFormatterParams } from "echarts/types/dist/shared";

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
  calculateValoresToma,
  formatCurrency,
  formatDate,
  formatInteger,
  formatShortDate,
  getCalendarMonthKey,
  getCalendarYearKey,
  getRepairDuration,
} from "@/lib/format";
import type { AppRole } from "@/lib/auth/central";
import type {
  PresupuestoDTO,
  PresupuestoEstado,
  TallerDTO,
  UnidadMarcaOptionDTO,
  UnidadModeloOptionDTO,
  UnidadDTO,
} from "@/lib/types";

type DashboardShellProps = {
  currentView: ViewMode;
  initialPresupuestos: PresupuestoDTO[];
  initialTalleres: TallerDTO[];
  initialFilters?: Partial<FilterState>;
  initialError?: string | null;
  currentUserEmail: string;
  currentUserName?: string | null;
  currentUserRole?: AppRole;
  logoutUrl: string;
};

type ViewMode = "dashboard" | "presupuestos" | "configuracion";

type FormState = {
  interno: string;
  tallerId: string;
  km: string;
  costo: string;
  valorInfo: string;
  porcentajeToma: string;
  observaciones: string;
  nroPresupuesto: string;
  prioridad: string;
  detalle: string;
  fechaPedido: string;
  fechaIngresoTaller: string;
  fechaEgresoTaller: string;
};

type ExternalFormState = {
  dominio: string;
  marcaCodigo: string;
  marcaNombre: string;
  modeloCodigo: string;
  modeloNombre: string;
  tallerId: string;
  km: string;
  costo: string;
  valorInfo: string;
  porcentajeToma: string;
  observaciones: string;
  nroPresupuesto: string;
  prioridad: string;
  detalle: string;
  fechaPedido: string;
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

type TooltipScalarValue = string | number | Date | null | undefined;
type TooltipValue = TooltipScalarValue | TooltipScalarValue[];

function getCurrentDateInputValue() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function createInitialFormState(): FormState {
  return {
    interno: "",
    tallerId: "",
    km: "",
    costo: "",
    valorInfo: "",
    porcentajeToma: "0",
    observaciones: "",
    nroPresupuesto: "",
    prioridad: "",
    detalle: "",
    fechaPedido: getCurrentDateInputValue(),
    fechaIngresoTaller: "",
    fechaEgresoTaller: "",
  };
}

function createInitialExternalFormState(): ExternalFormState {
  return {
    dominio: "",
    marcaCodigo: "",
    marcaNombre: "",
    modeloCodigo: "",
    modeloNombre: "",
    tallerId: "",
    km: "",
    costo: "",
    valorInfo: "",
    porcentajeToma: "0",
    observaciones: "",
    nroPresupuesto: "",
    prioridad: "",
    detalle: "",
    fechaPedido: getCurrentDateInputValue(),
    fechaIngresoTaller: "",
    fechaEgresoTaller: "",
  };
}

const initialFormState: FormState = createInitialFormState();
const initialExternalFormState: ExternalFormState = createInitialExternalFormState();

const defaultFilters: FilterState = {
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

function formatMonthFilterLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPresupuestoAnalysisDate(presupuesto: PresupuestoDTO) {
  return presupuesto.fechaPedido || presupuesto.createdAt;
}

function getPresupuestoUnitKey(presupuesto: PresupuestoDTO) {
  const identificador = (presupuesto.esExterno
    ? presupuesto.dominio
    : presupuesto.interno
  )
    .trim()
    .toUpperCase();

  return identificador
    ? `${presupuesto.esExterno ? "externa" : "interna"}:${identificador}`
    : `presupuesto:${presupuesto.id}`;
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
      return "bg-emerald-600 text-white";
    case "Rechazado":
      return "bg-destructive text-white";
    case "Revisar":
      return "bg-zinc-500 text-white";
    default:
      return "bg-amber-400 text-amber-950";
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

function formatCountTooltipValue(value: TooltipValue) {
  if (Array.isArray(value)) {
    const lastValue = value[value.length - 1];
    return formatCountTooltipValue(lastValue);
  }

  return String(value ?? "");
}

export function DashboardShell({
  currentView,
  initialPresupuestos,
  initialTalleres,
  initialFilters,
  initialError,
  currentUserEmail,
  currentUserName,
  currentUserRole,
  logoutUrl,
}: DashboardShellProps) {
  const router = useRouter();
  const initialDashboardMonths = Array.from(
        new Set(
          initialPresupuestos.map((presupuesto) =>
            getCalendarMonthKey(getPresupuestoAnalysisDate(presupuesto)),
      ),
    ),
  ).sort((a, b) => b.localeCompare(a));
  const [presupuestos, setPresupuestos] = useState(initialPresupuestos);
  const [talleres, setTalleres] = useState(initialTalleres);
  const [dashboardMonth, setDashboardMonth] = useState<string>(
    initialDashboardMonths[0] ?? "all",
  );
  const [vehicle, setVehicle] = useState<UnidadDTO | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [externalForm, setExternalForm] = useState<ExternalFormState>(initialExternalFormState);
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [feedback, setFeedback] = useState<string | null>(initialError || null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExternalCreateDialogOpen, setIsExternalCreateDialogOpen] = useState(false);
  const [detailsPresupuesto, setDetailsPresupuesto] = useState<PresupuestoDTO | null>(null);
  const [historyPresupuesto, setHistoryPresupuesto] = useState<PresupuestoDTO | null>(null);
  const [historyPresupuestos, setHistoryPresupuestos] = useState<PresupuestoDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [managePresupuesto, setManagePresupuesto] = useState<PresupuestoDTO | null>(null);
  const [manageEstadoDraft, setManageEstadoDraft] = useState<PresupuestoEstado>("Pendiente");
  const [manageIngresoDraft, setManageIngresoDraft] = useState("");
  const [manageEgresoDraft, setManageEgresoDraft] = useState("");
  const [manageDetalleDraft, setManageDetalleDraft] = useState("");
  const [manageObservacionesDraft, setManageObservacionesDraft] = useState("");
  const [tallerForm, setTallerForm] = useState<TallerFormState>(initialTallerFormState);
  const [editingTallerId, setEditingTallerId] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isLookingUp, startLookupTransition] = useTransition();
  const [isLoadingExternalCatalog, startExternalCatalogTransition] = useTransition();
  const [isSavingTaller, startSavingTallerTransition] = useTransition();
  const [isDeletingTaller, startDeletingTallerTransition] = useTransition();
  const [externalBrands, setExternalBrands] = useState<UnidadMarcaOptionDTO[]>([]);
  const [externalModels, setExternalModels] = useState<UnidadModeloOptionDTO[]>([]);
  const deferredDominio = useDeferredValue(filters.dominio);
  const deferredInterno = useDeferredValue(filters.interno);
  const canManageSettings = currentUserRole === "admin";
  const canManagePresupuestos = currentUserRole === "admin" || currentUserRole === "user";
  const availableDashboardMonths = useMemo(
    () =>
      Array.from(
        new Set(
          presupuestos.map((presupuesto) =>
            getCalendarMonthKey(getPresupuestoAnalysisDate(presupuesto)),
          ),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [presupuestos],
  );
  const resolvedDashboardMonth = useMemo(() => {
    if (!availableDashboardMonths.length) {
      return "all";
    }

    if (dashboardMonth === "all") {
      return "all";
    }

    return availableDashboardMonths.includes(dashboardMonth)
      ? dashboardMonth
      : availableDashboardMonths[0];
  }, [availableDashboardMonths, dashboardMonth]);
  const dashboardPresupuestos = useMemo(() => {
    if (resolvedDashboardMonth === "all") {
      return presupuestos;
    }

    return presupuestos.filter(
      (presupuesto) =>
        getCalendarMonthKey(getPresupuestoAnalysisDate(presupuesto)) ===
        resolvedDashboardMonth,
    );
  }, [presupuestos, resolvedDashboardMonth]);
  const historySummary = useMemo(
    () =>
      historyPresupuestos.reduce(
        (summary, presupuesto) => {
          summary.total.costo += presupuesto.costo;
          summary.total.costoConIva += presupuesto.costoConIva;

          if (presupuesto.estado === "Aprobado") {
            summary.aprobado.costo += presupuesto.costo;
            summary.aprobado.costoConIva += presupuesto.costoConIva;
          }

          if (presupuesto.estado === "Pendiente" || presupuesto.estado === "Revisar") {
            summary.pendiente.costo += presupuesto.costo;
            summary.pendiente.costoConIva += presupuesto.costoConIva;
          }

          return summary;
        },
        {
          pendiente: { costo: 0, costoConIva: 0 },
          aprobado: { costo: 0, costoConIva: 0 },
          total: { costo: 0, costoConIva: 0 },
        },
      ),
    [historyPresupuestos],
  );

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

  async function openPresupuestoHistory(presupuesto: PresupuestoDTO) {
    const unidadKey = getPresupuestoUnitKey(presupuesto);
    const presupuestosVisibles = presupuestos.filter(
      (item) => getPresupuestoUnitKey(item) === unidadKey,
    );

    setHistoryPresupuesto(presupuesto);
    setHistoryPresupuestos(presupuestosVisibles);
    setIsLoadingHistory(true);

    try {
      const data = await parseJsonResponse<{ presupuestos: PresupuestoDTO[] }>(
        await fetch("/api/presupuestos", { cache: "no-store" }),
      );
      setHistoryPresupuestos(
        data.presupuestos.filter((item) => getPresupuestoUnitKey(item) === unidadKey),
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No pudimos consultar el historial de presupuestos de la unidad.",
      );
    } finally {
      setIsLoadingHistory(false);
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
    const aprobadosAnualesPorTaller = new Map<
      string,
      { year: string; month: string; taller: string; cantidad: number; monto: number }
    >();

    for (const presupuesto of presupuestos) {
      if (presupuesto.estado !== "Aprobado") {
        continue;
      }

      const analysisDate = getPresupuestoAnalysisDate(presupuesto);
      const yearKey = getCalendarYearKey(analysisDate);
      const monthKey = getCalendarMonthKey(analysisDate);
      const tallerLabel = presupuesto.tallerNombre?.trim() || "Sin taller";
      const annualTallerKey = `${monthKey}::${tallerLabel}`;
      const currentAnnualBucket = aprobadosAnualesPorTaller.get(annualTallerKey) || {
        year: yearKey,
        month: monthKey,
        taller: tallerLabel,
        cantidad: 0,
        monto: 0,
      };

      currentAnnualBucket.cantidad += 1;
      currentAnnualBucket.monto += presupuesto.costoConIva;
      aprobadosAnualesPorTaller.set(annualTallerKey, currentAnnualBucket);
    }

    const approvedAnnualWorkshopBuckets = Array.from(
      aprobadosAnualesPorTaller.values(),
    ).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year.localeCompare(b.year);
      }

      if (a.month !== b.month) {
        return a.month.localeCompare(b.month);
      }

      return a.taller.localeCompare(b.taller, "es");
    });
    const approvedAnnualMonths = Array.from(
      new Set(
        presupuestos.map((presupuesto) =>
          getCalendarMonthKey(getPresupuestoAnalysisDate(presupuesto)),
        ),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const approvedAnnualWorkshops = Array.from(
      new Set(approvedAnnualWorkshopBuckets.map((item) => item.taller)),
    ).sort((a, b) => a.localeCompare(b, "es"));
    const approvedAnnualMatrix = new Map<string, { cantidad: number; monto: number }>();

    for (const item of approvedAnnualWorkshopBuckets) {
      approvedAnnualMatrix.set(`${item.month}::${item.taller}`, {
        cantidad: item.cantidad,
        monto: item.monto,
      });
    }

    const approvedAnnualMonthLabels = approvedAnnualMonths.map((month) =>
      formatMonthFilterLabel(month),
    );
    const approvedAnnualMontoByMonth = approvedAnnualMonths.map((month) =>
      approvedAnnualWorkshops.reduce((total, taller) => {
        const bucket = approvedAnnualMatrix.get(`${month}::${taller}`);
        return total + (bucket?.monto ?? 0);
      }, 0),
    );
    const workshopBarPalette = [
      "#171717",
      "#3f3f46",
      "#525252",
      "#737373",
      "#a3a3a3",
      "#d4d4d4",
    ];

    const presupuestosPorEstadoDelMes = estadoChartOrder.map((estado) => ({
      name: estado,
      value: dashboardPresupuestos.filter((presupuesto) => presupuesto.estado === estado)
        .length,
      itemStyle: { color: estadoChartColors[estado] },
    }));
    const hasEstadoData = presupuestosPorEstadoDelMes.some((item) => item.value > 0);

    const presupuestosPorMesOption: DashboardChartOption = {
      color: estadoChartOrder.map((estado) => estadoChartColors[estado]),
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "item",
        valueFormatter: (value: TooltipValue) => formatCountTooltipValue(value),
      },
      series: [
        {
          name: "Presupuestos",
          type: "pie",
          radius: ["46%", "76%"],
          center: ["50%", "43%"],
          label: {
            fontSize: 11,
            formatter: "{b}: {c}",
          },
          data: hasEstadoData
            ? presupuestosPorEstadoDelMes.filter((item) => item.value > 0)
            : [{ name: "Sin datos", value: 1, itemStyle: { color: "#d4d4d4" } }],
        },
      ],
    };

    const talleresDelMes = buildCategoryCounts(
      dashboardPresupuestos.map((presupuesto) => presupuesto.tallerNombre),
      "Sin taller",
    );
    const talleresOption: DashboardChartOption = {
      color: ["#171717", "#525252", "#737373", "#a3a3a3", "#d4d4d4"],
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "item",
        valueFormatter: (value: TooltipValue) => formatCountTooltipValue(value),
      },
      series: [
        {
          name: "Talleres",
          type: "pie",
          radius: "72%",
          center: ["50%", "43%"],
          label: {
            fontSize: 11,
            formatter: "{b}: {c}",
          },
          data: talleresDelMes.length
            ? talleresDelMes.map(([label, count]) => ({ name: label, value: count }))
            : [{ name: "Sin datos", value: 1, itemStyle: { color: "#d4d4d4" } }],
        },
      ],
    };

    const marcasDelMes = buildCategoryCounts(
      dashboardPresupuestos.map((presupuesto) => presupuesto.marca),
      "Sin marca",
    );
    const radarSource = marcasDelMes.length ? marcasDelMes : [["Sin datos", 1] as const];
    const radarMaxValue = Math.max(...radarSource.map(([, count]) => count), 1);
    const marcasOption: DashboardChartOption = {
      color: ["#171717"],
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "item",
      },
      radar: {
        indicator: radarSource.map(([label]) => ({
          name: label,
          max: radarMaxValue,
        })),
        radius: "63%",
        splitNumber: 4,
        axisName: {
          color: "#404040",
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            color: "#e5e5e5",
          },
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(245,245,245,0.25)", "rgba(229,229,229,0.25)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: "#d4d4d4",
          },
        },
      },
      series: [
        {
          name: "Marcas",
          type: "radar",
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            width: 2,
          },
          areaStyle: {
            color: "rgba(23,23,23,0.14)",
          },
          data: [
            {
              value: radarSource.map(([, count]) => count),
              name: "Cantidad por marca",
            },
          ],
        },
      ],
    };

    const aprobadosAnualesPorTallerOption: DashboardChartOption = {
      color: [...workshopBarPalette, "#7c7c7c"],
      grid: { top: 42, left: 48, right: 64, bottom: 88, containLabel: true },
      legend: {
        top: 8,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: TopLevelFormatterParams) => {
          const items = Array.isArray(params) ? params : [params];
          const label = String(items[0]?.name || "");

          return [
            label,
            ...items.map((item) => {
              const rawValue = Array.isArray(item.value) ? item.value[1] : item.value;
              const value =
                typeof rawValue === "number"
                  ? item.seriesName === "Monto aprobado"
                    ? formatCurrency(rawValue)
                    : String(rawValue)
                  : String(rawValue ?? "");

              return `${String(item.marker ?? "")}${item.seriesName}: ${value}`;
            }),
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: approvedAnnualMonthLabels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#d9d9d9" } },
        axisLabel: {
          fontSize: 10,
          interval: 0,
          rotate: 18,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Cantidad",
          splitLine: { lineStyle: { color: "#ececec" } },
          axisLabel: { fontSize: 11 },
        },
        {
          type: "value",
          name: "Monto",
          axisLabel: {
            fontSize: 11,
            formatter: (value: number) => `${Math.round(value / 1000)}k`,
          },
        },
      ],
      series: [
        ...approvedAnnualWorkshops.map((taller, index) => ({
          name: taller,
          type: "bar" as const,
          barMaxWidth: 24,
          itemStyle: {
            color: workshopBarPalette[index % workshopBarPalette.length],
          },
          data: approvedAnnualMonths.map(
            (month) => approvedAnnualMatrix.get(`${month}::${taller}`)?.cantidad ?? 0,
          ),
        })),
        {
          name: "Monto aprobado",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: {
            width: 2,
          },
          data: approvedAnnualMontoByMonth,
        },
      ],
    };

    return {
      aprobadosAnualesPorTallerOption,
      presupuestosPorMesOption,
      marcasOption,
      talleresOption,
    };
  }, [dashboardPresupuestos, presupuestos]);

  useEffect(() => {
    if (currentView !== "presupuestos") {
      return;
    }

    startRefreshTransition(async () => {
      await refreshPresupuestos();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, filters.estado, filters.tallerId, deferredDominio, deferredInterno]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateExternalForm<K extends keyof ExternalFormState>(
    key: K,
    value: ExternalFormState[K],
  ) {
    setExternalForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(createInitialFormState());
    setVehicle(null);
    setLookupMessage(null);
    setIsCreateDialogOpen(false);
  }

  function resetExternalForm() {
    setExternalForm(createInitialExternalFormState());
    setExternalModels([]);
    setIsExternalCreateDialogOpen(false);
  }

  function handleCreateDialogOpenChange(open: boolean) {
    if (!open) {
      resetForm();
      return;
    }

    setIsCreateDialogOpen(true);
  }

  async function loadExternalBrands() {
    try {
      const data = await parseJsonResponse<{ marcas: UnidadMarcaOptionDTO[] }>(
        await fetch("/api/unidades/catalogo", {
          cache: "no-store",
        }),
      );
      setExternalBrands(data.marcas);
      setFeedback(null);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No pudimos cargar las marcas para unidades externas.",
      );
    }
  }

  async function loadExternalModels(marcaCodigo: string) {
    if (!marcaCodigo) {
      setExternalModels([]);
      return;
    }

    try {
      const data = await parseJsonResponse<{ modelos: UnidadModeloOptionDTO[] }>(
        await fetch(
          `/api/unidades/catalogo?marcaCodigo=${encodeURIComponent(marcaCodigo)}`,
          { cache: "no-store" },
        ),
      );
      setExternalModels(data.modelos);
      setFeedback(null);
    } catch (error) {
      setExternalModels([]);
      setFeedback(
        error instanceof Error
          ? error.message
          : "No pudimos cargar los modelos de la marca seleccionada.",
      );
    }
  }

  function resetTallerForm() {
    setTallerForm(initialTallerFormState);
    setEditingTallerId(null);
  }

  function openPresupuestosWithEstado(estado?: PresupuestoEstado) {
    const params = new URLSearchParams();

    if (estado) {
      params.set("estado", estado);
    }

    const href = params.size ? `/presupuestos?${params.toString()}` : "/presupuestos";
    router.push(href);
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

  function openExternalCreateDialog(open: boolean) {
    if (!open) {
      resetExternalForm();
      return;
    }

    setIsExternalCreateDialogOpen(true);

    if (externalBrands.length > 0) {
      return;
    }

    startExternalCatalogTransition(async () => {
      await loadExternalBrands();
    });
  }

  function handleExternalBrandInput(value: string) {
    const normalizedValue = value.trim().toLowerCase();
    const matchedBrand =
      externalBrands.find((marca) => marca.nombre.trim().toLowerCase() === normalizedValue) ??
      null;

    setExternalForm((current) => ({
      ...current,
      marcaNombre: value,
      marcaCodigo: matchedBrand?.codigo || "",
      modeloCodigo:
        matchedBrand && matchedBrand.codigo === current.marcaCodigo ? current.modeloCodigo : "",
      modeloNombre:
        matchedBrand && matchedBrand.codigo === current.marcaCodigo ? current.modeloNombre : "",
    }));

    setExternalModels(matchedBrand && matchedBrand.codigo === externalForm.marcaCodigo ? externalModels : []);

    if (!matchedBrand) {
      return;
    }

    startExternalCatalogTransition(async () => {
      await loadExternalModels(matchedBrand.codigo);
    });
  }

  function handleExternalModelInput(value: string) {
    const normalizedValue = value.trim().toLowerCase();
    const matchedModel =
      externalModels.find((modelo) => modelo.nombre.trim().toLowerCase() === normalizedValue) ??
      null;

    setExternalForm((current) => ({
      ...current,
      modeloNombre: value,
      modeloCodigo: matchedModel?.codigo || "",
    }));
  }

  const selectedTallerName =
    talleres.find((taller) => taller.id === form.tallerId)?.nombre ?? "";
  const selectedExternalTallerName =
    talleres.find((taller) => taller.id === externalForm.tallerId)?.nombre ?? "";
  const tomaValores = calculateValoresToma(
    Number(form.valorInfo) || 0,
    Number(form.porcentajeToma) || 0,
  );
  const externalTomaValores = calculateValoresToma(
    Number(externalForm.valorInfo) || 0,
    Number(externalForm.porcentajeToma) || 0,
  );
  const presupuestoSuperaDiferencia =
    Boolean(form.costo) && Number(form.costo) > tomaValores.diferencia;
  const presupuestoExternoSuperaDiferencia =
    Boolean(externalForm.costo) &&
    Number(externalForm.costo) > externalTomaValores.diferencia;

  function createPresupuesto() {
    if (!canManagePresupuestos) {
      setFeedback("El rol viewer solo puede consultar presupuestos y ver observaciones.");
      return;
    }

    startSubmitTransition(async () => {
      try {
        const response = await fetch("/api/presupuestos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            origen: "interno",
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

  function createExternalPresupuesto() {
    if (!canManagePresupuestos) {
      setFeedback("El rol viewer solo puede consultar presupuestos y ver observaciones.");
      return;
    }

    startSubmitTransition(async () => {
      try {
        const response = await fetch("/api/presupuestos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...externalForm,
            origen: "externo",
            dominio: externalForm.dominio.trim().toUpperCase(),
            prioridad: externalForm.prioridad || undefined,
          }),
        });

        const data = await parseJsonResponse<{ presupuesto: PresupuestoDTO }>(response);
        setPresupuestos((current) => [data.presupuesto, ...current]);
        setFeedback("Presupuesto externo guardado en estado Pendiente.");
        resetExternalForm();
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "No pudimos guardar el presupuesto externo.",
        );
      }
    });
  }

  function openManagePresupuesto(presupuesto: PresupuestoDTO) {
    if (!canManagePresupuestos) {
      setFeedback("El rol viewer solo puede consultar presupuestos y ver observaciones.");
      return;
    }

    setManagePresupuesto(presupuesto);
    setManageEstadoDraft(presupuesto.estado);
    setManageIngresoDraft(presupuesto.fechaIngresoTaller?.slice(0, 10) ?? "");
    setManageEgresoDraft(presupuesto.fechaEgresoTaller?.slice(0, 10) ?? "");
    setManageDetalleDraft(presupuesto.detalle ?? "");
    setManageObservacionesDraft(presupuesto.observaciones ?? "");
  }

  function savePresupuestoManagement() {
    if (!managePresupuesto) {
      return;
    }

    if (!canManagePresupuestos) {
      setFeedback("El rol viewer solo puede consultar presupuestos y ver observaciones.");
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
            fechaIngresoTaller: manageIngresoDraft,
            fechaEgresoTaller: manageEgresoDraft,
            detalle: manageDetalleDraft,
            observaciones: manageObservacionesDraft,
          }),
        });
        const data = await parseJsonResponse<{ presupuesto: PresupuestoDTO }>(response);
        setPresupuestos((current) =>
          current.map((item) =>
            item.id === managePresupuesto.id ? data.presupuesto : item,
          ),
        );
        setManagePresupuesto(null);
        setFeedback("Presupuesto actualizado.");
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el presupuesto.",
        );
      }
    });
  }

  function startEditTaller(taller: TallerDTO) {
    if (!canManageSettings) {
      setFeedback("Solo los usuarios admin pueden gestionar talleres.");
      return;
    }

    setEditingTallerId(taller.id);
    setTallerForm({
      nombre: taller.nombre,
      tipoTrabajo: taller.tipoTrabajo || "",
      activo: taller.activo ? "true" : "false",
    });
  }

  function saveTaller() {
    if (!canManageSettings) {
      setFeedback("Solo los usuarios admin pueden gestionar talleres.");
      return;
    }

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
    if (!canManageSettings) {
      setFeedback("Solo los usuarios admin pueden gestionar talleres.");
      return;
    }

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
    href: string;
    label: string;
    description: string;
    icon: typeof ClipboardList;
  }> = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      description: "Resumen por estado",
      icon: BarChart3,
    },
    {
      id: "presupuestos",
      href: "/presupuestos",
      label: "Presupuestos",
      description: "Carga y seguimiento",
      icon: ClipboardList,
    },
  ];
  if (canManageSettings) {
    navigationItems.push({
      id: "configuracion",
      href: "/configuracion",
      label: "Configuración",
      description: "CRUD de talleres",
      icon: Settings,
    });
  }

  const profileLabel = currentUserName || currentUserEmail || "Mi perfil";
  const roleLabel = currentUserRole?.toLowerCase() || "sin rol";

  return (
    <main className="min-h-screen bg-background">
      <div className="flex w-full flex-col gap-4 px-0 pb-3 md:pb-4 lg:pb-5">
        <header className="navbar">
          <div className="navbar__start">
            <Link className="navbar__brand" href="/dashboard" aria-label="Intra Talleres, inicio">
              <span className="navbar__mark">IT</span>
              <span className="navbar__brand-title">Intra Talleres</span>
            </Link>

            <nav aria-label="Navegacion principal" className="navbar__nav">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="navbar__link"
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="navbar__icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="navbar__end">
            <details className="navbar__dropdown navbar__dropdown--profile">
              <summary className="navbar__profile-trigger">
                <UserRound className="navbar__icon" />
                <span>Mi Perfil</span>
                <ChevronDown className="navbar__chevron" />
              </summary>

              <div
                className="navbar__menu navbar__menu--profile"
                role="menu"
                aria-label="Mi perfil"
              >
                <div className="navbar__session-copy navbar__session-copy--menu">
                  <strong>{profileLabel}</strong>
                  <span>
                    {roleLabel} · {currentUserEmail}
                  </span>
                </div>
                <div className="navbar__menu-separator" aria-hidden="true" />
                <SignOutButton
                  action={logoutUrl}
                  variant="ghost"
                  size="sm"
                  className="navbar__menu-link navbar__menu-link--logout"
                  iconClassName="size-4"
                  label="Cerrar sesión"
                />
              </div>
            </details>

            <SignOutButton
              action={logoutUrl}
              variant="ghost"
              size="sm"
              className="navbar__logout"
              iconClassName="size-4"
              label="Salir"
            />
          </div>
        </header>

        {feedback ? (
          <div className="mx-3 rounded-lg border border-border/80 bg-secondary/60 px-3 py-2 text-sm text-foreground md:mx-4 lg:mx-5">
            {feedback}
          </div>
        ) : null}

        {currentView === "dashboard" ? (
          <section className="grid gap-4 px-3 md:px-4 lg:px-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <MetricTile
                icon={ClipboardList}
                label="Total"
                value={String(resumen.total)}
                caption="Presupuestos visibles"
                onClick={() => openPresupuestosWithEstado()}
              />
              <MetricTile
                icon={TriangleAlert}
                label="Pendiente"
                value={String(resumen.pendientes)}
                caption="Esperando definición"
                onClick={() => openPresupuestosWithEstado("Pendiente")}
              />
              <MetricTile
                icon={ShieldCheck}
                label="Aprobado"
                value={String(resumen.aprobados)}
                caption="Listos para avanzar"
                onClick={() => openPresupuestosWithEstado("Aprobado")}
              />
              <MetricTile
                icon={TriangleAlert}
                label="Revisar"
                value={String(resumen.revisar)}
                caption="Casos a validar"
                onClick={() => openPresupuestosWithEstado("Revisar")}
              />
              <MetricTile
                icon={Trash2}
                label="Rechazado"
                value={String(resumen.rechazados)}
                caption="Descartados"
                onClick={() => openPresupuestosWithEstado("Rechazado")}
              />
            </div>

            <Card className="border-border/70 shadow-none">
              <CardContent className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-end md:justify-between">
                <div className="grid gap-1">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Filtro mensual
                  </p>
                  <p className="text-sm font-medium">
                    {resolvedDashboardMonth === "all"
                      ? "Todos los meses disponibles"
                      : formatMonthFilterLabel(resolvedDashboardMonth)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Este selector modifica estado, taller y marca. El anualizado queda fijo.
                  </p>
                </div>
                <div className="w-full md:w-[260px]">
                  <Select
                    value={resolvedDashboardMonth}
                    onValueChange={(value) => setDashboardMonth(value ?? "all")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los meses</SelectItem>
                      {availableDashboardMonths.map((month) => (
                        <SelectItem key={month} value={month}>
                          {formatMonthFilterLabel(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <ChartCard
                title="Aprobados anualizados por taller"
                description="Cantidad de presupuestos aprobados por mes y taller, con línea de monto total aprobado."
              >
                <EChartsSurface
                  option={chartOptions.aprobadosAnualesPorTallerOption}
                  height={360}
                />
              </ChartCard>

              <div className="grid gap-4 xl:grid-cols-3">
                <ChartCard
                  title="Presupuestos por mes"
                  description="Distribución por estado del mes seleccionado."
                >
                  <EChartsSurface
                    option={chartOptions.presupuestosPorMesOption}
                    height={340}
                  />
                </ChartCard>

                <ChartCard
                  title="Presupuestos por taller"
                  description="Participación de cada taller dentro del mes seleccionado."
                >
                  <EChartsSurface option={chartOptions.talleresOption} height={340} />
                </ChartCard>

                <ChartCard
                  title="Presupuestos por marca"
                  description="Radar de concentración por marca en el mes seleccionado."
                >
                  <EChartsSurface option={chartOptions.marcasOption} height={340} />
                </ChartCard>
              </div>
            </div>
          </section>
        ) : null}

        {currentView === "presupuestos" ? (
          <section className="grid gap-4 px-3 md:px-4 lg:px-5">
            <Card className="border-border/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="font-heading text-2xl tracking-[-0.04em]">
                      Seguimiento de presupuestos
                    </CardTitle>
                    <CardDescription>
                      {canManagePresupuestos
                        ? "Cargá nuevos presupuestos desde un modal y completá el egreso cuando la unidad salga de taller."
                        : "Consultá presupuestos, aplicá filtros y abrí observaciones en modo solo lectura."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    {canManagePresupuestos ? (
                      <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
                        <Dialog
                          open={isCreateDialogOpen}
                          onOpenChange={handleCreateDialogOpenChange}
                        >
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
                            <Field label="F. Pedido" htmlFor="fechaPedido">
                              <Input
                                id="fechaPedido"
                                value={form.fechaPedido}
                                onChange={(event) =>
                                  updateForm("fechaPedido", event.target.value)
                                }
                                type="date"
                              />
                            </Field>
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

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="grid gap-2">
                                <Label htmlFor="taller">Taller</Label>
                                <Select
                                  value={form.tallerId}
                                  onValueChange={(value) => updateForm("tallerId", value ?? "")}
                                >
                                  <SelectTrigger id="taller" className="w-full">
                                    <SelectValue placeholder="Seleccionar taller">
                                      {selectedTallerName}
                                    </SelectValue>
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
                                  className={
                                    presupuestoSuperaDiferencia
                                      ? "border-destructive text-destructive focus-visible:ring-destructive"
                                      : ""
                                  }
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  required
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
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <Field label="Valor info" htmlFor="valorInfo">
                                <Input
                                  id="valorInfo"
                                  value={form.valorInfo}
                                  onChange={(event) => updateForm("valorInfo", event.target.value)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                />
                              </Field>
                              <Field label="% toma" htmlFor="porcentajeToma">
                                <Input
                                  id="porcentajeToma"
                                  value={form.porcentajeToma}
                                  onChange={(event) =>
                                    updateForm("porcentajeToma", event.target.value)
                                  }
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                              </Field>
                              <Field label="Valor ingreso" htmlFor="valorIngreso">
                                <Input
                                  id="valorIngreso"
                                  value={formatCurrency(tomaValores.valorIngreso)}
                                  readOnly
                                />
                              </Field>
                              <Field label="Diferencia" htmlFor="diferencia">
                                <Input
                                  id="diferencia"
                                  value={formatCurrency(tomaValores.diferencia)}
                                  readOnly
                                />
                              </Field>
                            </div>

                            {presupuestoSuperaDiferencia ? (
                              <div
                                role="alert"
                                className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                              >
                                <TriangleAlert className="size-4 shrink-0" />
                                Presupuesto supera diferencia
                              </div>
                            ) : null}

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

                        <Dialog
                          open={isExternalCreateDialogOpen}
                          onOpenChange={openExternalCreateDialog}
                        >
                          <DialogTrigger
                            render={
                              <Button type="button" variant="outline" className="w-full xl:w-auto" />
                            }
                          >
                              <Plus className="size-4" />
                              Nuevo presupuesto externo
                          </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                            Generar presupuesto externo
                          </DialogTitle>
                          <DialogDescription>
                            Registrá una unidad que no existe en el sistema cargando dominio,
                            marca, modelo, taller y costo inicial.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <Field label="F. Pedido" htmlFor="externo-fechaPedido">
                            <Input
                              id="externo-fechaPedido"
                              value={externalForm.fechaPedido}
                              onChange={(event) =>
                                updateExternalForm("fechaPedido", event.target.value)
                              }
                              type="date"
                            />
                          </Field>
                          <div className="grid gap-2">
                            <Label htmlFor="externo-dominio">Dominio</Label>
                            <Input
                              id="externo-dominio"
                              value={externalForm.dominio}
                              onChange={(event) =>
                                updateExternalForm("dominio", event.target.value.toUpperCase())
                              }
                              placeholder="Ej. AA123BB"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Marca" htmlFor="externo-marca">
                              <Input
                                id="externo-marca"
                                list="externo-marcas"
                                value={externalForm.marcaNombre}
                                onChange={(event) =>
                                  handleExternalBrandInput(event.target.value)
                                }
                                placeholder={
                                  isLoadingExternalCatalog
                                    ? "Cargando marcas..."
                                    : "Escribí o elegí una marca"
                                }
                                autoComplete="off"
                              />
                              <datalist id="externo-marcas">
                                {externalBrands.map((marca) => (
                                  <option key={marca.codigo} value={marca.nombre} />
                                ))}
                              </datalist>
                            </Field>

                            <Field label="Modelo" htmlFor="externo-modelo">
                              <Input
                                id="externo-modelo"
                                list="externo-modelos"
                                value={externalForm.modeloNombre}
                                onChange={(event) =>
                                  handleExternalModelInput(event.target.value)
                                }
                                placeholder={
                                  !externalForm.marcaCodigo
                                    ? "Elegí una marca primero"
                                    : isLoadingExternalCatalog
                                      ? "Cargando modelos..."
                                      : "Escribí o elegí un modelo"
                                }
                                autoComplete="off"
                                disabled={!externalForm.marcaCodigo || isLoadingExternalCatalog}
                              />
                              <datalist id="externo-modelos">
                                {externalModels.map((modelo) => (
                                  <option key={modelo.codigo} value={modelo.nombre} />
                                ))}
                              </datalist>
                            </Field>

                            <div className="grid gap-2">
                              <Label htmlFor="externo-taller">Taller</Label>
                              <Select
                                value={externalForm.tallerId}
                                onValueChange={(value) =>
                                  updateExternalForm("tallerId", value ?? "")
                                }
                              >
                                <SelectTrigger id="externo-taller" className="w-full">
                                  <SelectValue placeholder="Seleccionar taller">
                                    {selectedExternalTallerName}
                                  </SelectValue>
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

                            <Field label="KM informado" htmlFor="externo-km">
                              <Input
                                id="externo-km"
                                value={externalForm.km}
                                onChange={(event) =>
                                  updateExternalForm("km", event.target.value)
                                }
                                type="number"
                                min="0"
                              />
                            </Field>
                            <Field label="Costo ARS" htmlFor="externo-costo">
                              <Input
                                id="externo-costo"
                                value={externalForm.costo}
                                onChange={(event) =>
                                  updateExternalForm("costo", event.target.value)
                                }
                                className={
                                  presupuestoExternoSuperaDiferencia
                                    ? "border-destructive text-destructive focus-visible:ring-destructive"
                                    : ""
                                }
                                type="number"
                                min="0"
                                step="0.01"
                                required
                              />
                            </Field>
                            <Field
                              label="Nro presupuesto"
                              htmlFor="externo-nroPresupuesto"
                            >
                              <Input
                                id="externo-nroPresupuesto"
                                value={externalForm.nroPresupuesto}
                                onChange={(event) =>
                                  updateExternalForm("nroPresupuesto", event.target.value)
                                }
                              />
                            </Field>
                            <Field
                              label="Ingreso a taller"
                              htmlFor="externo-fechaIngresoTaller"
                            >
                              <Input
                                id="externo-fechaIngresoTaller"
                                value={externalForm.fechaIngresoTaller}
                                onChange={(event) =>
                                  updateExternalForm(
                                    "fechaIngresoTaller",
                                    event.target.value,
                                  )
                                }
                                type="date"
                              />
                            </Field>
                            <Field label="Prioridad" htmlFor="externo-prioridad">
                              <Select
                                value={externalForm.prioridad || "none"}
                                onValueChange={(value) =>
                                  updateExternalForm(
                                    "prioridad",
                                    value === "none" ? "" : (value ?? ""),
                                  )
                                }
                              >
                                <SelectTrigger id="externo-prioridad" className="w-full">
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
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Field label="Valor info" htmlFor="externo-valorInfo">
                              <Input
                                id="externo-valorInfo"
                                value={externalForm.valorInfo}
                                onChange={(event) =>
                                  updateExternalForm("valorInfo", event.target.value)
                                }
                                type="number"
                                min="0"
                                step="0.01"
                              />
                            </Field>
                            <Field label="% toma" htmlFor="externo-porcentajeToma">
                              <Input
                                id="externo-porcentajeToma"
                                value={externalForm.porcentajeToma}
                                onChange={(event) =>
                                  updateExternalForm("porcentajeToma", event.target.value)
                                }
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                            </Field>
                            <Field label="Valor ingreso" htmlFor="externo-valorIngreso">
                              <Input
                                id="externo-valorIngreso"
                                value={formatCurrency(externalTomaValores.valorIngreso)}
                                readOnly
                              />
                            </Field>
                            <Field label="Diferencia" htmlFor="externo-diferencia">
                              <Input
                                id="externo-diferencia"
                                value={formatCurrency(externalTomaValores.diferencia)}
                                readOnly
                              />
                            </Field>
                          </div>

                          {presupuestoExternoSuperaDiferencia ? (
                            <div
                              role="alert"
                              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                            >
                              <TriangleAlert className="size-4 shrink-0" />
                              Presupuesto supera diferencia
                            </div>
                          ) : null}

                          <Field label="Detalle" htmlFor="externo-detalle">
                            <Textarea
                              id="externo-detalle"
                              value={externalForm.detalle}
                              onChange={(event) =>
                                updateExternalForm("detalle", event.target.value)
                              }
                              rows={3}
                              placeholder="Trabajo presupuestado o reparación a considerar"
                            />
                          </Field>

                          <Field label="Observaciones" htmlFor="externo-observaciones">
                            <Textarea
                              id="externo-observaciones"
                              value={externalForm.observaciones}
                              onChange={(event) =>
                                updateExternalForm("observaciones", event.target.value)
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
                                  {externalForm.costo
                                    ? formatCurrency(Number(externalForm.costo))
                                    : "$ 0,00"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Con IVA</p>
                                <p className="font-heading text-2xl tracking-[-0.04em]">
                                  {externalForm.costo
                                    ? formatCurrency(
                                        calculateCostoConIva(Number(externalForm.costo)),
                                      )
                                    : "$ 0,00"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              className="flex-1"
                              onClick={createExternalPresupuesto}
                              disabled={
                                isSubmitting ||
                                !externalForm.dominio.trim() ||
                                !externalForm.marcaCodigo ||
                                !externalForm.modeloCodigo ||
                                !externalForm.tallerId
                              }
                            >
                              {isSubmitting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : null}
                              Guardar presupuesto externo
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resetExternalForm}
                            >
                              Limpiar
                            </Button>
                          </div>
                        </div>
                        </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/70 bg-secondary/35 px-3 py-2 text-xs text-muted-foreground xl:w-auto">
                        Rol `viewer`: acceso solo de lectura en presupuestos.
                      </div>
                    )}

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
                  <Table className="min-w-[1360px]">
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
                        <TableHead>F. Pedido</TableHead>
                        <TableHead>Presupuestos</TableHead>
                        <TableHead>Ingreso</TableHead>
                        <TableHead>Egreso</TableHead>
                        <TableHead>D. Reparación</TableHead>
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
                            <TableCell>
                              {presupuesto.esExterno ? "Externo" : presupuesto.interno}
                            </TableCell>
                            <TableCell>{presupuesto.dominio}</TableCell>
                            <TableCell>
                              <div className="min-w-[180px]">
                                <p className="font-medium">{presupuesto.marca}</p>
                                <p className="text-xs text-muted-foreground">
                                  {presupuesto.modelo}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{formatInteger(presupuesto.km)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                {formatCurrency(presupuesto.costo)}
                                {presupuesto.diferencia !== undefined &&
                                presupuesto.costo > presupuesto.diferencia ? (
                                  <span
                                    className="text-destructive"
                                    title="Presupuesto supera diferencia"
                                    aria-label="Presupuesto supera diferencia"
                                  >
                                    <TriangleAlert className="size-4" />
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(presupuesto.costoConIva)}</TableCell>
                            <TableCell className="text-xs">
                              {presupuesto.fechaPedido
                                ? formatShortDate(presupuesto.fechaPedido)
                                : formatShortDate(presupuesto.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openPresupuestoHistory(presupuesto)}
                              >
                                <FileText className="size-4" />
                                Ver presupuestos
                              </Button>
                            </TableCell>
                            <TableCell className="text-xs">
                              {presupuesto.fechaIngresoTaller
                                ? formatShortDate(presupuesto.fechaIngresoTaller)
                                : "Sin fecha"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {presupuesto.fechaEgresoTaller
                                ? formatShortDate(presupuesto.fechaEgresoTaller)
                                : "Sin fecha"}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {(() => {
                                const diasReparacion = getRepairDuration(
                                  presupuesto.fechaIngresoTaller,
                                  presupuesto.fechaEgresoTaller,
                                );

                                if (diasReparacion === null) {
                                  return "Sin ingresar";
                                }

                                return `${diasReparacion} ${
                                  diasReparacion === 1 ? "día" : "días"
                                }`;
                              })()}
                            </TableCell>
                            <TableCell>
                              {canManagePresupuestos ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openManagePresupuesto(presupuesto)}
                                >
                                  <Pencil className="size-4" />
                                  Gestionar
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Solo lectura
                                </span>
                              )}
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
                          colSpan={15}
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
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                    <div className="grid gap-3 sm:grid-cols-3">
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
                      <Field label="Fecha de ingreso" htmlFor="manage-ingreso">
                        <Input
                          id="manage-ingreso"
                          type="date"
                          value={manageIngresoDraft}
                          onChange={(event) => setManageIngresoDraft(event.target.value)}
                        />
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
                    <Field label="Detalle" htmlFor="manage-detalle">
                      <Textarea
                        id="manage-detalle"
                        value={manageDetalleDraft}
                        onChange={(event) => setManageDetalleDraft(event.target.value)}
                        rows={3}
                        placeholder="Trabajo presupuestado o reparación a considerar"
                      />
                    </Field>
                    <Field label="Observaciones" htmlFor="manage-observaciones">
                      <Textarea
                        id="manage-observaciones"
                        value={manageObservacionesDraft}
                        onChange={(event) => setManageObservacionesDraft(event.target.value)}
                        rows={3}
                        placeholder="Notas internas, valor de toma o comentarios del caso"
                      />
                    </Field>
                    <div className="rounded-lg border border-border/70 bg-secondary/25 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Estado actual
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
                        <Badge className={getEstadoTone(managePresupuesto.estado)}>
                          {managePresupuesto.estado}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {managePresupuesto.fechaIngresoTaller
                            ? `Ingreso cargado: ${formatDate(managePresupuesto.fechaIngresoTaller)}`
                            : "Todavía sin fecha de ingreso"}
                        </span>
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
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                    {detailsPresupuesto
                      ? `${detailsPresupuesto.dominio} · ${detailsPresupuesto.marca} ${detailsPresupuesto.modelo}`
                      : "Detalle del presupuesto"}
                  </DialogTitle>
                  <DialogDescription>
                    {detailsPresupuesto
                      ? `${detailsPresupuesto.esExterno ? "Unidad externa" : `Interno ${detailsPresupuesto.interno}`} · Taller ${detailsPresupuesto.tallerNombre}`
                      : "Detalle ampliado del presupuesto."}
                  </DialogDescription>
                </DialogHeader>

                {detailsPresupuesto ? (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Unidad
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailStat
                          label="Interno"
                          value={
                            detailsPresupuesto.esExterno
                              ? "Unidad externa"
                              : detailsPresupuesto.interno
                          }
                        />
                        <DetailStat label="Dominio" value={detailsPresupuesto.dominio} />
                        <DetailStat label="Marca" value={detailsPresupuesto.marca} />
                        <DetailStat label="Modelo" value={detailsPresupuesto.modelo} />
                        <DetailStat
                          label="KM informado"
                          value={formatInteger(detailsPresupuesto.km)}
                        />
                        <DetailStat label="Taller" value={detailsPresupuesto.tallerNombre} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Seguimiento
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailStat label="Estado" value={detailsPresupuesto.estado} />
                        <DetailStat
                          label="Prioridad"
                          value={detailsPresupuesto.prioridad || "Sin definir"}
                        />
                        <DetailStat
                          label="Nro presupuesto"
                          value={detailsPresupuesto.nroPresupuesto || "Sin número"}
                        />
                        <DetailStat
                          label="F. Pedido"
                          value={formatDate(
                            detailsPresupuesto.fechaPedido || detailsPresupuesto.createdAt,
                          )}
                        />
                        <DetailStat
                          label="Ingreso a taller"
                          value={
                            detailsPresupuesto.fechaIngresoTaller
                              ? formatDate(detailsPresupuesto.fechaIngresoTaller)
                              : "Sin fecha"
                          }
                        />
                        <DetailStat
                          label="Egreso de taller"
                          value={
                            detailsPresupuesto.fechaEgresoTaller
                              ? formatDate(detailsPresupuesto.fechaEgresoTaller)
                              : "Sin fecha"
                          }
                        />
                        <DetailStat
                          label="D. Reparación"
                          value={(() => {
                            const diasReparacion = getRepairDuration(
                              detailsPresupuesto.fechaIngresoTaller,
                              detailsPresupuesto.fechaEgresoTaller,
                            );

                            return diasReparacion === null
                              ? "Sin ingresar"
                              : `${diasReparacion} ${diasReparacion === 1 ? "día" : "días"}`;
                          })()}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Valores
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailStat
                          label="Costo ARS"
                          value={formatCurrency(detailsPresupuesto.costo)}
                        />
                        <DetailStat
                          label="Costo + IVA"
                          value={formatCurrency(detailsPresupuesto.costoConIva)}
                        />
                        <DetailStat
                          label="Valor info"
                          value={
                            detailsPresupuesto.valorInfo === undefined
                              ? "Sin información"
                              : formatCurrency(detailsPresupuesto.valorInfo)
                          }
                        />
                        <DetailStat
                          label="% toma"
                          value={
                            detailsPresupuesto.porcentajeToma === undefined
                              ? "Sin información"
                              : `${detailsPresupuesto.porcentajeToma}%`
                          }
                        />
                        <DetailStat
                          label="Valor ingreso"
                          value={
                            detailsPresupuesto.valorIngreso === undefined
                              ? "Sin información"
                              : formatCurrency(detailsPresupuesto.valorIngreso)
                          }
                        />
                        <DetailStat
                          label="Diferencia"
                          value={
                            detailsPresupuesto.diferencia === undefined
                              ? "Sin información"
                              : formatCurrency(detailsPresupuesto.diferencia)
                          }
                        />
                      </div>
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

            <Dialog
              open={Boolean(historyPresupuesto)}
              onOpenChange={(open) => {
                if (!open) {
                  setHistoryPresupuesto(null);
                  setHistoryPresupuestos([]);
                }
              }}
            >
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl tracking-[-0.04em]">
                    Presupuestos de la unidad
                  </DialogTitle>
                  <DialogDescription>
                    {historyPresupuesto
                      ? historyPresupuesto.esExterno
                        ? `Unidad externa · Dominio ${historyPresupuesto.dominio}`
                        : `Interno ${historyPresupuesto.interno} · ${historyPresupuesto.dominio}`
                      : "Historial de presupuestos de la unidad."}
                  </DialogDescription>
                </DialogHeader>

                {historyPresupuesto ? (
                  <div className="space-y-3">
                    {isLoadingHistory ? (
                      <p className="text-sm text-muted-foreground">
                        Consultando presupuestos asociados...
                      </p>
                    ) : null}
                    <div className="overflow-x-auto rounded-lg border border-border/70">
                      <Table className="min-w-[680px]">
                        <TableHeader>
                          <TableRow className="bg-secondary/40">
                            <TableHead>F. Pedido</TableHead>
                            <TableHead>Nro.</TableHead>
                            <TableHead>Taller</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Costo + IVA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyPresupuestos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{formatShortDate(getPresupuestoAnalysisDate(item))}</TableCell>
                              <TableCell>{item.nroPresupuesto || "Sin número"}</TableCell>
                              <TableCell>{item.tallerNombre}</TableCell>
                              <TableCell>
                                <Badge className={getEstadoTone(item.estado)}>
                                  {item.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.costo)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.costoConIva)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <HistoryTotal
                        label="Pendiente de aprobación"
                        costo={historySummary.pendiente.costo}
                        costoConIva={historySummary.pendiente.costoConIva}
                      />
                      <HistoryTotal
                        label="Total aprobado"
                        costo={historySummary.aprobado.costo}
                        costoConIva={historySummary.aprobado.costoConIva}
                      />
                      <HistoryTotal
                        label={`Total de ${historyPresupuestos.length} presupuesto${historyPresupuestos.length === 1 ? "" : "s"}`}
                        costo={historySummary.total.costo}
                        costoConIva={historySummary.total.costoConIva}
                      />
                    </div>
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </section>
        ) : null}

        {currentView === "configuracion" && canManageSettings ? (
          <section className="grid gap-4 px-3 md:px-4 lg:px-5 xl:grid-cols-[420px_minmax(0,1fr)]">
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
  onClick,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left transition-colors hover:bg-secondary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 font-heading text-3xl leading-none tracking-[-0.08em]">
              {value}
            </p>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">{caption}</p>
          </div>
          <div className="rounded-md border border-border/70 bg-secondary/35 p-1.5 text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          </div>
        </CardContent>
      </button>
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

function HistoryTotal({
  label,
  costo,
  costoConIva,
}: {
  label: string;
  costo: number;
  costoConIva: number;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/25 px-3 py-2.5">
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(costo)}</p>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(costoConIva)} con IVA
      </p>
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
