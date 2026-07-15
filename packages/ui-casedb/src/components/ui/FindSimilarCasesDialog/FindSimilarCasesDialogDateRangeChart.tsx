import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import {
  BarChart,
  LineChart,
} from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import EChartsReact from 'echarts-for-react';
import type {
  Control,
  FieldValues,
  Path,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Box,
  useTheme,
} from '@mui/material';
import { ConfigService } from '@gen-epix/ui';

import { FindSimilarCasesUtil } from '../../../utils/FindSimilarCasesUtil';
import type {
  FindSimilarCasesChartDataPoint,
  FindSimilarCasesOrganizationFilter,
} from '../../../models/caseDb';
import type { CaseDbConfig } from '../../../models/config';

registerECharts([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

export interface FindSimilarCasesDialogDateRangeChartProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  control: Control<TFieldValues>;
  data: FindSimilarCasesChartDataPoint[];
  name: TName;
  onOrganizationFilterChange: (organizationFilter: FindSimilarCasesOrganizationFilter) => void;
  organizationFilter: FindSimilarCasesOrganizationFilter;
}

export const FindSimilarCasesDialogDateRangeChart = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  control,
  data,
  name,
  onOrganizationFilterChange,
  organizationFilter,
}: FindSimilarCasesDialogDateRangeChartProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const intervals = useMemo(() => FindSimilarCasesUtil.buildChartIntervals(data), [data]);
  const theme = useTheme();
  const [tooltipState, setTooltipState] = useState<{ content: string; x: number; y: number } | null>(null);
  const ownCasesLabel = t`Own cases`;
  const otherOrganizationCasesLabel = t`Cases from other organizations`;

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

  const option = useMemo(() => {
    const { BASE_COLORS } = ConfigService.getInstance<CaseDbConfig>().config.epi.STRATIFICATION;
    return {
      color: BASE_COLORS,
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
      grid: { bottom: 110, left: 80, right: 80, top: 40 },
      legend: {
        data: [ownCasesLabel, otherOrganizationCasesLabel],
        selected: {
          [otherOrganizationCasesLabel]: organizationFilter !== 'own',
          [ownCasesLabel]: organizationFilter !== 'otherOrganization',
        },
        top: 0,
      },
      series: [
        {
          data: intervals.map(i => i.count),
          lineStyle: { opacity: 0 },
          name: 'dataZoomShadow',
          silent: true,
          symbol: 'none',
          type: 'line',
        },
        { data: intervals.map(i => i.ownCaseCount), itemStyle: { color: BASE_COLORS[0] }, name: ownCasesLabel, stack: 'similarCases', type: 'bar' },
        { data: intervals.map(i => i.otherOrganizationCaseCount), itemStyle: { color: BASE_COLORS[1] }, name: otherOrganizationCasesLabel, stack: 'similarCases', type: 'bar' },
      ],
      tooltip: { show: false },
      xAxis: { axisLabel: {
        height: 100,
        rotate: 45,
      }, axisTick: {
        alignWithLabel: true,
        show: true,
      }, data: intervals.map(i => i.label),
      type: 'category' },
      yAxis: { max: Math.max(...intervals.map(i => i.count), 1), minInterval: 1, type: 'value' },
    };
  }, [intervals, organizationFilter, otherOrganizationCasesLabel, ownCasesLabel, theme]);

  const onLegendSelectChanged = useCallback((params: unknown) => {
    const { selected } = params as { selected?: Record<string, boolean> };
    if (!selected) {
      return;
    }
    const ownCasesSelected = selected[ownCasesLabel] ?? true;
    const otherOrganizationCasesSelected = selected[otherOrganizationCasesLabel] ?? true;
    if (ownCasesSelected && !otherOrganizationCasesSelected) {
      onOrganizationFilterChange('own');
      return;
    }
    if (!ownCasesSelected && otherOrganizationCasesSelected) {
      onOrganizationFilterChange('otherOrganization');
      return;
    }
    onOrganizationFilterChange('all');
  }, [onOrganizationFilterChange, otherOrganizationCasesLabel, ownCasesLabel]);

  const onEvents = useMemo(() => ({
    datazoom: onDataZoom,
    legendselectchanged: onLegendSelectChanged,
    mouseout: () => {
      setTooltipState(null);
    },
    mouseover: (event: unknown) => {
      const e = event as { event?: { event?: MouseEvent }; name?: string; value?: number };
      const mouseEvent = e.event?.event;
      if (mouseEvent && e.name !== null && e.name !== undefined) {
        setTooltipState({ content: `${e.name} (n=${e.value ?? 0})`, x: mouseEvent.clientX + 12, y: mouseEvent.clientY + 12 });
      }
    },
  }), [onDataZoom, onLegendSelectChanged]);

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
    <>
      <Controller
        control={control}
        name={name}
        render={renderChart}
      />
      {tooltipState && (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            fontSize: 12,
            left: tooltipState.x,
            pointerEvents: 'none',
            position: 'fixed',
            px: 1,
            py: 0.5,
            top: tooltipState.y,
            zIndex: 'tooltip',
          }}
        >
          {tooltipState.content}
        </Box>
      )}
    </>
  );
};
