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
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import EChartsReact from 'echarts-for-react';
import type {
  Control,
  FieldValues,
  Path,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTheme } from '@mui/material';

import { EpiFindSimilarCasesUtil } from '../../../utils/EpiFindSimilarCasesUtil';
import type { FindSimilarCasesChartDataPoint } from '../../../models/epi';

registerECharts([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

export interface EpiFindSimilarCasesDialogDateRangeChartProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  control: Control<TFieldValues>;
  data: FindSimilarCasesChartDataPoint[];
  name: TName;
}

export const EpiFindSimilarCasesDialogDateRangeChart = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  control,
  data,
  name,
}: EpiFindSimilarCasesDialogDateRangeChartProps<TFieldValues, TName>): ReactElement => {
  const intervals = useMemo(() => EpiFindSimilarCasesUtil.buildChartIntervals(data), [data]);
  const theme = useTheme();

  const intervalsRef = useRef(intervals);
  useEffect(() => {
    intervalsRef.current = intervals;
  }, [intervals]);

  // Keeps a stable reference to the latest onChange so onDataZoom never goes stale.
  const onChangeRef = useRef<((value: [string, string] | null) => void) | null>(null);

  const onDataZoom = useCallback((params: unknown) => {
    type ZoomPayload = { end?: number; endValue?: number; start?: number; startValue?: number };
    const event = params as { batch?: ZoomPayload[] } & ZoomPayload;
    const base = event.batch?.[0] ?? event;

    const n = intervalsRef.current.length - 1;
    let startIndex: number;
    let endIndex: number;

    if (base.startValue !== undefined && base.endValue !== undefined) {
      // index-based (e.g. inside/wheel zoom)
      startIndex = Math.round(base.startValue);
      endIndex = Math.round(base.endValue);
    } else if (base.start !== undefined && base.end !== undefined) {
      // percentage-based (slider drag)
      startIndex = Math.round((base.start / 100) * n);
      endIndex = Math.round((base.end / 100) * n);
    } else {
      onChangeRef.current?.(null);
      return;
    }

    const startInterval = intervalsRef.current[startIndex];
    const endInterval = intervalsRef.current[endIndex];
    if (startInterval && endInterval) {
      onChangeRef.current?.([startInterval.startDate, endInterval.endDate]);
      return;
    }
    onChangeRef.current?.(null);
  }, []);

  const option = useMemo(() => ({
    color: [theme.palette.primary.main],
    dataZoom: [{
      borderColor: theme.palette.primary.light,
      bottom: 0,
      fillerColor: `${theme.palette.primary.main}33`,
      handleStyle: { borderColor: theme.palette.primary.main, color: theme.palette.primary.main },
      height: 50,
      left: 80,
      right: 80,
      selectedDataBackground: { areaStyle: { color: theme.palette.primary.light }, lineStyle: { color: theme.palette.primary.main } },
      type: 'slider',
    }],
    grid: { bottom: 110, left: 80, right: 80, top: 0 },
    series: [{ data: intervals.map(i => i.count), type: 'bar' }],
    tooltip: { trigger: 'axis' },
    xAxis: { axisLabel: {
      height: 100,
      rotate: 45,
    }, axisTick: {
      alignWithLabel: true,
      show: true,
    }, data: intervals.map(i => i.label),
    type: 'category' },
    yAxis: { max: Math.max(...intervals.map(i => i.count), 1), minInterval: 1, type: 'value' },
  }), [intervals, theme]);

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
        style={{ height: 400 }}
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
