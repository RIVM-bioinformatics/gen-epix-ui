import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import type {
  EChartsOption,
  EChartsType,
} from 'echarts';
import {
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
import type { Stratification } from '../../../models/epi';
import { StratificationUtil } from '../../../utils/StratificationUtil';

export interface EpiCurveStackedAreaChartProps {
  chartRef: Ref<EChartsReact>;
  echarts: unknown;
  getXAxisLabel: (value: Date) => string;
  highlightedCaseIds?: string[];
  includeMissingValues: boolean;
  items: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onChartReady?: (chart: EChartsType) => void;
  onPointMouseUp?: (payload: { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent }) => void;
  stratification?: Stratification;
  xAxisIntervals: Date[];
}

export const EpiCurveStackedAreaChart = ({
  chartRef,
  echarts,
  getXAxisLabel,
  highlightedCaseIds,
  includeMissingValues,
  items,
  onCaseIdsChange,
  onChartReady,
  onPointMouseUp,
  stratification,
  xAxisIntervals,
}: EpiCurveStackedAreaChartProps) => {
  const theme = useTheme();
  const hoveredSeriesIndexRef = useRef<null | number>(null);
  const chartInstanceRef = useRef<EChartsType | null>(null);

  // Calculate series data only when rendering
  const seriesData = useMemo(() => EpiCurveUtil.getAreaChartSeriesData(items, xAxisIntervals, getXAxisLabel, includeMissingValues, stratification, theme), [items, xAxisIntervals, getXAxisLabel, includeMissingValues, stratification, theme]);

  // Fast lookup table: color -> all caseIds having that stratification color.
  const caseIdsByColor = useMemo(() => {
    const buckets: { [color: string]: string[] } = {};
    const colorMap = stratification?.caseIdColors ?? {};

    Object.entries(colorMap).forEach(([caseId, color]) => {
      if (!buckets[color]) {
        buckets[color] = [];
      }
      buckets[color].push(caseId);
    });

    return buckets;
  }, [stratification]);

  // Fast O(1) lookup: all caseIds for a hovered stratification area (series).
  const caseIdsBySeriesIndex = useMemo(() => {
    if (!seriesData.series?.length) {
      return [] as string[][];
    }

    return (seriesData.series as Array<{ color?: string }>).map((series) => {
      const seriesColor = series.color;
      return typeof seriesColor === 'string' ? (caseIdsByColor[seriesColor] ?? []) : [];
    });
  }, [caseIdsByColor, seriesData]);

  const getCaseIdsForPoint = useCallback((seriesIndex: number, dataIndex: number): string[] => {
    if (!seriesData.series || seriesIndex < 0 || dataIndex < 0) {
      return [];
    }
    const series = (seriesData.series as Array<{ data?: unknown[] }>)?.[seriesIndex];
    const point = (series?.data as Array<[unknown, unknown, string]>)?.[dataIndex];
    if (point?.[2] && isString(point[2])) {
      return JSON.parse(point[2]) as string[];
    }
    return [];
  }, [seriesData]);

  const expandToStratificationColorCaseIds = useCallback((candidateCaseIds: string[]): string[] => {
    if (!candidateCaseIds.length) {
      return [];
    }

    const colorMap = stratification?.caseIdColors;
    if (!colorMap) {
      return candidateCaseIds;
    }

    const referenceCaseId = candidateCaseIds.find(caseId => !!colorMap[caseId]);
    if (!referenceCaseId) {
      return candidateCaseIds;
    }

    const referenceColor = colorMap[referenceCaseId];
    return caseIdsByColor[referenceColor] ?? candidateCaseIds;
  }, [caseIdsByColor, stratification]);

  const getOptions = useCallback(() => {
    return {
      color: StratificationUtil.getEchartsColors(stratification, theme),
      grid: {
        bottom: 64,
        left: 48,
        right: 8,
        top: 16,
      },
      series: seriesData.series,
      tooltip: {
        formatter: (params) => {
          const typedParams = params as Array<{ marker?: string; name: string; seriesIndex: number; seriesName: string; value: number[] }>;
          if (!typedParams?.length) {
            return '';
          }

          const header = typedParams[0].name;
          const hoveredSeriesIndex = hoveredSeriesIndexRef.current;
          const lines = typedParams.map(param => {
            const line = `${param.marker ?? ''}${param.seriesName} (${Number(param.value[1]).toFixed(1)}%)`;
            if (hoveredSeriesIndex !== null && param.seriesIndex === hoveredSeriesIndex) {
              return `<b>${line}</b>`;
            }
            return line;
          });
          return [header, ...lines].join('<br/>');
        },
        show: true,
        trigger: 'axis',
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
  }, [stratification, theme, seriesData.series, seriesData.max, xAxisIntervals, getXAxisLabel]);

  const setHighlightedSeries = useCallback((seriesIndex: null | number) => {
    const instance = chartInstanceRef.current;
    if (!instance) {
      return;
    }

    instance.dispatchAction({
      type: 'downplay',
    });

    if (typeof seriesIndex === 'number' && seriesIndex >= 0) {
      instance.dispatchAction({
        seriesIndex,
        type: 'highlight',
      });
    }
  }, []);

  useEffect(() => {
    const instance = chartInstanceRef.current;
    if (!instance) {
      return;
    }

    if (!highlightedCaseIds?.length) {
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
        if (intersection(caseIds, highlightedCaseIds).length) {
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
  }, [highlightedCaseIds, seriesData]);

  const onInternalChartReady = useCallback((chart: EChartsType) => {
    chartInstanceRef.current = chart;
    onChartReady?.(chart);
  }, [onChartReady]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {
    const getCaseIdsFromItemEvent = (event: unknown): string[] => {
      const eventData = event as {
        data?: [unknown, unknown, string];
        dataIndex?: number;
        seriesIndex?: number;
      };

      if (typeof eventData.seriesIndex === 'number' && eventData.seriesIndex >= 0) {
        return caseIdsBySeriesIndex[eventData.seriesIndex] ?? [];
      }

      const caseIdsFromData = eventData?.data?.[2];
      if (isString(caseIdsFromData)) {
        return expandToStratificationColorCaseIds(JSON.parse(caseIdsFromData) as string[]);
      }

      if (typeof eventData.seriesIndex === 'number'
        && typeof eventData.dataIndex === 'number'
        && eventData.seriesIndex >= 0
        && eventData.dataIndex >= 0) {
        return expandToStratificationColorCaseIds(getCaseIdsForPoint(eventData.seriesIndex, eventData.dataIndex));
      }

      return [];
    };

    return {
      globalout: () => {
        hoveredSeriesIndexRef.current = null;
        setHighlightedSeries(null);
        onCaseIdsChange?.([]);
      },
      mouseout: () => {
        hoveredSeriesIndexRef.current = null;
        setHighlightedSeries(null);
        onCaseIdsChange?.([]);
      },
      mouseover: (event: unknown) => {
        const eventData = event as { seriesIndex?: number };
        hoveredSeriesIndexRef.current = typeof eventData.seriesIndex === 'number' ? eventData.seriesIndex : null;
        setHighlightedSeries(hoveredSeriesIndexRef.current);
        const caseIds = getCaseIdsFromItemEvent(event);
        if (caseIds.length) {
          onCaseIdsChange?.(caseIds);
        }
      },
      mouseup: (event: unknown) => {
        const mouseEvent = (event as { event?: { event?: MouseEvent } })?.event?.event;
        onPointMouseUp?.({
          caseIds: getCaseIdsFromItemEvent(event),
          focussedDate: (event as { name?: string })?.name,
          mouseEvent,
        });
      },
      updateAxisPointer: (event: unknown) => {
        const axisEvent = event as {
          seriesDataIndices?: Array<{ seriesIndex?: number }>;
        };
        const hoveredSeriesIndex = axisEvent.seriesDataIndices?.[0]?.seriesIndex;
        if (typeof hoveredSeriesIndex === 'number') {
          hoveredSeriesIndexRef.current = hoveredSeriesIndex;
        }
        setHighlightedSeries(hoveredSeriesIndexRef.current);
      },
    };
  }, [caseIdsBySeriesIndex, expandToStratificationColorCaseIds, getCaseIdsForPoint, onCaseIdsChange, onPointMouseUp, setHighlightedSeries]);

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
