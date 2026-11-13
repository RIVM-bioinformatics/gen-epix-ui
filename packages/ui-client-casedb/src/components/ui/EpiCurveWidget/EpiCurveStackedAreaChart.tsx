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
import { StratificationUtil } from '../../../utils/StratificationUtil';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';

export interface EpiCurveStackedAreaChartProps {
  echarts: unknown;
  getXAxisLabel: (value: Date) => string;
  includeMissingValues: boolean;
  items: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onChartReady?: (chart: EChartsType) => void;
  onPointMouseUp?: (payload: { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent }) => void;
  setChartRef: Dispatch<SetStateAction<EChartsReact>>;
  stratification?: Stratification;
  xAxisIntervals: Date[];
}

export const EpiCurveStackedAreaChart = ({
  echarts,
  getXAxisLabel,
  includeMissingValues,
  items,
  onCaseIdsChange,
  onChartReady,
  onPointMouseUp,
  setChartRef,
  stratification,
  xAxisIntervals,
}: EpiCurveStackedAreaChartProps) => {
  const theme = useTheme();
  const hoveredSeriesIndexRef = useRef<null | number>(null);
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const dashboardContext = use(DashboardContext);

  // Calculate series data only when rendering
  const seriesData = useMemo(() =>
    EpiCurveUtil.getAreaChartSeriesData(items, xAxisIntervals, getXAxisLabel, includeMissingValues, stratification),
  [items, xAxisIntervals, getXAxisLabel, includeMissingValues, stratification]);

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
    if (seriesIndex < 0 || dataIndex < 0) {
      return [];
    }
    return caseIdsByPoint[seriesIndex]?.[dataIndex] ?? [];
  }, [caseIdsByPoint]);

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

  const option = useMemo(() => ({
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
  } satisfies EChartsOption), [stratification, theme, seriesData.series, seriesData.max, xAxisIntervals, getXAxisLabel]);

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

      if (typeof eventData.seriesIndex === 'number'
        && typeof eventData.dataIndex === 'number'
        && eventData.seriesIndex >= 0
        && eventData.dataIndex >= 0) {
        return expandToStratificationColorCaseIds(getCaseIdsForPoint(eventData.seriesIndex, eventData.dataIndex));
      }

      const caseIdsFromData = eventData?.data?.[2];
      if (isString(caseIdsFromData)) {
        return expandToStratificationColorCaseIds(JSON.parse(caseIdsFromData) as string[]);
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
