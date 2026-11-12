import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import type {
  EChartsOption,
  EChartsType,
} from 'echarts';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type {
  Dispatch,
  SetStateAction,
} from 'react';
import isString from 'lodash/isString';
import { useTheme } from '@mui/material';

import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import type { EpiCurveChartItem } from '../../../utils/EpiCurveUtil';
import type { Stratification } from '../../../models/stratification.models';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';

export interface EpiCurveBarChartProps {
  echarts: unknown;
  getXAxisLabel: (value: Date) => string;
  items: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onChartReady?: (chart: EChartsType) => void;
  onPointMouseUp?: (payload: { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent }) => void;
  setChartRef: Dispatch<SetStateAction<EChartsReact>>;
  stratification?: Stratification;
  xAxisIntervals: Date[];
}

export const EpiCurveBarChart = ({
  echarts,
  getXAxisLabel,
  items,
  onCaseIdsChange,
  onChartReady,
  onPointMouseUp,
  setChartRef,
  stratification,
  xAxisIntervals,
}: EpiCurveBarChartProps) => {
  const theme = useTheme();
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const dashboardContext = use(DashboardContext);

  // Calculate series data only when rendering
  const seriesData = useMemo(() => EpiCurveUtil.getBarChartSeriesData(items, xAxisIntervals, getXAxisLabel, stratification, theme), [items, xAxisIntervals, getXAxisLabel, stratification, theme]);

  const caseIdsByPoint = useMemo(() => {
    const series = seriesData.series as Array<{ data?: Array<[unknown, unknown, string]> }> | null;
    return series?.map(serie => serie.data?.map(dataArray => (
      isString(dataArray[2]) ? JSON.parse(dataArray[2]) as string[] : []
    )) ?? []) ?? [];
  }, [seriesData.series]);

  useEffect(() => {
    const unsubscribe = dashboardContext.highlightSubject.subscribe((highlighting) => {
      if (highlighting.origin === DASHBOARD_COMPONENT_NAME.EPI_CURVE) {
        return;
      }

      const instance = chartInstanceRef.current;
      if (!instance) {
        return;
      }

      if (!highlighting.caseIds.length) {
        instance.dispatchAction({
          type: 'downplay',
        });
        return;
      }

      const highlightTargets: Array<{ dataIndex: number; seriesIndex: number }> = [];
      const highlightedCaseIds = new Set(highlighting.caseIds);
      caseIdsByPoint.forEach((seriesCaseIds, seriesIndex) => {
        seriesCaseIds.forEach((caseIds, dataIndex) => {
          if (caseIds.some(caseId => highlightedCaseIds.has(caseId))) {
            highlightTargets.push({ dataIndex, seriesIndex });
          }
        });
      });

      instance.dispatchAction({
        type: 'downplay',
      });

      highlightTargets.forEach((target) => {
        instance.dispatchAction({
          dataIndex: target.dataIndex,
          seriesIndex: target.seriesIndex,
          type: 'highlight',
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [caseIdsByPoint, dashboardContext]);

  const onInternalChartReady = useCallback((chart: EChartsType) => {
    chartInstanceRef.current = chart;
    onChartReady?.(chart);
  }, [onChartReady]);

  const option = useMemo(() => ({
    grid: {
      bottom: 64,
      left: 48,
      right: 8,
      top: 16,
    },
    series: seriesData.series,
    tooltip: {
      formatter: (params) => {
        const typedParams = params as { name: string; seriesName: string; value: number[] };

        // For bar chart, show count
        if (stratification?.legendaItems?.length) {
          return `${typedParams.name} - ${typedParams.seriesName} (n=${typedParams.value[1]})`;
        }
        return `${typedParams.name} (n=${typedParams.value[1]})`;
      },
      show: true,
      trigger: 'item',
      triggerOn: 'mousemove',
    },
    xAxis: {
      axisLabel: {
        height: 100,
        rotate: 45,
      },
      axisTick: {
        alignWithLabel: true,
        show: true,
      },
      data: xAxisIntervals.map(x => getXAxisLabel(x)),
      type: 'category',
    },
    yAxis: {
      max: seriesData.max,
      min: 0,
      minInterval: 1,
      type: 'value',
    },
  } satisfies EChartsOption), [stratification, seriesData.series, seriesData.max, xAxisIntervals, getXAxisLabel]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {
    const getCaseIdsFromEvent = (event: unknown): string[] => {
      const eventData = event as { data?: [unknown, unknown, string]; dataIndex?: number; seriesIndex?: number };
      if (typeof eventData.seriesIndex === 'number' && typeof eventData.dataIndex === 'number') {
        return caseIdsByPoint[eventData.seriesIndex]?.[eventData.dataIndex] ?? [];
      }

      const caseIds = eventData?.data?.[2];
      if (isString(caseIds)) {
        return JSON.parse(caseIds) as string[];
      }
      return [];
    };

    return {
      mouseout: () => {
        onCaseIdsChange?.([]);
      },
      mouseover: (event: unknown) => {
        onCaseIdsChange?.(getCaseIdsFromEvent(event));
      },
      mouseup: (event: unknown) => {
        const mouseEvent = (event as { event?: { event?: MouseEvent } })?.event?.event;
        onPointMouseUp?.({
          caseIds: getCaseIdsFromEvent(event),
          focussedDate: (event as { name?: string })?.name,
          mouseEvent,
        });
      },
    };
  }, [caseIdsByPoint, onCaseIdsChange, onPointMouseUp]);

  return (
    <EChartsReact
      echarts={echarts}
      notMerge
      onChartReady={onInternalChartReady}
      onEvents={onEvents}
      option={option}
      ref={setChartRef}
      style={{
        height: '100%',
        position: 'absolute',
        width: '100%',
      }}
    />
  );
};
