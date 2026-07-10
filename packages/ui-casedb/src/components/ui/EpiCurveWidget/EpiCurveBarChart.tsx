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
import type { Ref } from 'react';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import { useTheme } from '@mui/material';

import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import type { EpiCurveChartItem } from '../../../utils/EpiCurveUtil';
import type { Stratification } from '../../../models/stratification';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';

export interface EpiCurveBarChartProps {
  chartRef: Ref<EChartsReact>;
  echarts: unknown;
  getXAxisLabel: (value: Date) => string;
  items: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onChartReady?: (chart: EChartsType) => void;
  onPointMouseUp?: (payload: { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent }) => void;
  stratification?: Stratification;
  xAxisIntervals: Date[];
}

export const EpiCurveBarChart = ({
  chartRef,
  echarts,
  getXAxisLabel,
  items,
  onCaseIdsChange,
  onChartReady,
  onPointMouseUp,
  stratification,
  xAxisIntervals,
}: EpiCurveBarChartProps) => {
  const theme = useTheme();
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const dashboardContext = use(DashboardContext);

  // Calculate series data only when rendering
  const seriesData = useMemo(() => EpiCurveUtil.getBarChartSeriesData(items, xAxisIntervals, getXAxisLabel, stratification, theme), [items, xAxisIntervals, getXAxisLabel, stratification, theme]);

  useEffect(() => {
    const unsubscribe = dashboardContext.highlightSubject.subscribe((highlighting) => {
      if (highlighting.origin === DASHBOARD_WIDGET_NAME.EPI_CURVE) {
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
      seriesData.series?.forEach((serie, serieIndex) => {
        const serieData = (serie as { data: unknown[] }).data;
        serieData?.forEach((dataArray: unknown, dataIndex: number) => {
          const caseIds = JSON.parse((dataArray as [unknown, unknown, string])[2]) as string[];
          if (intersection(caseIds, highlighting.caseIds).length) {
            highlightTargets.push({
              dataIndex,
              seriesIndex: serieIndex,
            });
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
  }, [dashboardContext, seriesData]);

  const onInternalChartReady = useCallback((chart: EChartsType) => {
    chartInstanceRef.current = chart;
    onChartReady?.(chart);
  }, [onChartReady]);

  const getOptions = useCallback(() => {
    return {
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
    } satisfies EChartsOption;
  }, [stratification, seriesData.series, seriesData.max, xAxisIntervals, getXAxisLabel]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {
    const getCaseIdsFromEvent = (event: unknown): string[] => {
      const caseIds = (event as { data?: [unknown, unknown, string] })?.data?.[2];
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
  }, [onCaseIdsChange, onPointMouseUp]);

  return (
    <EChartsReact
      echarts={echarts}
      notMerge
      onChartReady={onInternalChartReady}
      onEvents={onEvents}
      option={getOptions()}
      ref={chartRef}
      style={{
        height: '100%',
        position: 'absolute',
        width: '100%',
      }}
    />
  );
};
