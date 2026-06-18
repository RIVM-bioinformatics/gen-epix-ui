import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReactElement } from 'react';
import {
  dispose,
  getInstanceByDom,
  init,
  use as registerECharts,
} from 'echarts/core';
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import EChartsReact from 'echarts-for-react';
import type {
  Control,
  FieldValues,
  Path,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';

registerECharts([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

export type SimilarCasesDateRangeChartDataPoint = {
  count: number;
  date: string;
};

export interface SimilarCasesDateRangeChartProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  control: Control<TFieldValues>;
  data: SimilarCasesDateRangeChartDataPoint[];
  name: TName;
}

export const SimilarCasesDateRangeChart = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  control,
  data,
  name,
}: SimilarCasesDateRangeChartProps<TFieldValues, TName>): ReactElement => {
  const dates = useMemo(() => data.map(d => d.date), [data]);
  const counts = useMemo(() => data.map(d => d.count), [data]);

  const datesRef = useRef(dates);
  useEffect(() => {
    datesRef.current = dates;
  }, [dates]);

  // Keeps a stable reference to the latest onChange so onDataZoom never goes stale.
  const onChangeRef = useRef<((value: [string, string] | null) => void) | null>(null);

  const onDataZoom = useCallback((params: unknown) => {
    const event = params as { batch?: Array<{ endValue?: number; startValue?: number }> };
    const startValue = event.batch?.[0]?.startValue;
    const endValue = event.batch?.[0]?.endValue;
    if (startValue !== undefined && endValue !== undefined) {
      const startDate = datesRef.current[Math.round(startValue)];
      const endDate = datesRef.current[Math.round(endValue)];
      if (startDate && endDate) {
        onChangeRef.current?.([startDate, endDate]);
        return;
      }
    }
    onChangeRef.current?.(null);
  }, []);

  const option = useMemo(() => ({
    dataZoom: [{ end: 100, start: 0, type: 'slider' }],
    grid: { bottom: 60, left: 50, right: 20, top: 20 },
    series: [{ data: counts, smooth: true, type: 'line' }],
    tooltip: { trigger: 'axis' },
    xAxis: { data: dates, type: 'category' },
    yAxis: { minInterval: 1, type: 'value' },
  }), [dates, counts]);

  const onEvents = useMemo(() => ({
    datazoom: onDataZoom,
  }), [onDataZoom]);

  const renderChart = useCallback(({ field: { onChange } }: { field: { onChange: (value: [string, string] | null) => void } }) => {
    onChangeRef.current = onChange;
    return (
      <EChartsReact
        echarts={echartsCore}
        notMerge
        onEvents={onEvents}
        option={option}
        style={{ height: 220 }}
      />
    );
  }, [onEvents, option]);

  return (
    <Controller
      control={control}
      name={name}
      render={renderChart}
    />
  );
};
