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

  const caseIdTargets = useMemo(() => {
    const targetsByCaseId = new Map<string, Array<{ dataIndex: number; seriesIndex: number }>>();
    caseIdsByPoint.forEach((seriesCaseIds, seriesIndex) => {
      seriesCaseIds.forEach((caseIds, dataIndex) => {
        caseIds.forEach((caseId) => {
          const targets = targetsByCaseId.get(caseId);
          const target = { dataIndex, seriesIndex };
          if (targets) {
            targets.push(target);
          } else {
            targetsByCaseId.set(caseId, [target]);
          }
        });
      });
    });
    return targetsByCaseId;
  }, [caseIdsByPoint]);

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

      const highlightTargetsBySeries = new Map<number, Set<number>>();
      highlighting.caseIds.forEach((caseId) => {
        caseIdTargets.get(caseId)?.forEach(({ dataIndex, seriesIndex }) => {
          const dataIndexes = highlightTargetsBySeries.get(seriesIndex) ?? new Set<number>();
          dataIndexes.add(dataIndex);
          highlightTargetsBySeries.set(seriesIndex, dataIndexes);
        });
      });
      const highlightTargets: Array<{ dataIndex: number; seriesIndex: number }> = [];
      highlightTargetsBySeries.forEach((dataIndexes, seriesIndex) => {
        dataIndexes.forEach((dataIndex) => {
          highlightTargets.push({ dataIndex, seriesIndex });
        });
      });
      highlightTargets.sort((firstTarget, secondTarget) => (
        firstTarget.seriesIndex - secondTarget.seriesIndex
        || firstTarget.dataIndex - secondTarget.dataIndex
      ));

      instance.dispatchAction({
        type: 'downplay',
      });

      instance.dispatchAction({
        batch: highlightTargets,
        type: 'highlight',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [caseIdTargets, dashboardContext]);

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
