"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  RadarSeriesOption,
} from "echarts/charts";
import type {
  ComposeOption,
  ECharts as EChartsInstance,
} from "echarts/core";
import type {
  GridComponentOption,
  LegendComponentOption,
  PolarComponentOption,
  RadarComponentOption,
  TooltipComponentOption,
} from "echarts/components";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  SVGRenderer,
]);

export type DashboardChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | RadarSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | PolarComponentOption
  | RadarComponentOption
  | TooltipComponentOption
>;

type EChartsSurfaceProps = {
  className?: string;
  height?: number;
  option: DashboardChartOption;
};

export function EChartsSurface({
  className,
  height = 320,
  option,
}: EChartsSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: "svg",
    });
    chartRef.current = chart;
    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%" }}
    />
  );
}
