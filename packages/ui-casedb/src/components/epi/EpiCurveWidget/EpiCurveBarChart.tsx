import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import type {
  EChartsOption,
  EChartsType,
} from 'echarts';
import {
  useCallback,
  useMemo,
} from 'react';
import type { Ref } from 'react';
import isString from 'lodash/isString';

import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import type { EpiCurveChartItem } from '../../../utils/EpiCurveUtil';
import type { Stratification } from '../../../models/epi';

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
  // Calculate series data only when rendering
  const seriesData = useMemo(() => EpiCurveUtil.getBarChartSeriesData(items, xAxisIntervals, getXAxisLabel, stratification), [items, xAxisIntervals, getXAxisLabel, stratification]);
  const getOptions = useCallback(() => {
    return {
      color: EpiCurveUtil.getStratificationColors(),
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
  }, [seriesData, xAxisIntervals, getXAxisLabel, stratification]);

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
      onChartReady={onChartReady}
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
