import type { Duration } from 'date-fns';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  intervalToDuration,
  isAfter,
  isBefore,
  isEqual,
  isValid,
} from 'date-fns';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import {
  ConfigManager,
  DATE_FORMAT,
} from '@gen-epix/ui';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { EpiFilterUtil } from '../EpiFilterUtil';
import type { CaseDbConfig } from '../../models/config';

export interface EpiCurveChartItem {
  date: Date;
  row: CaseDbCase;
  value: number;
}

export interface EpiCurveNormalizedAreaChartDataPoint {
  caseIds: { [seriesName: string]: string[] };
  date: Date;
  values: { [seriesName: string]: number };
}

type IntervalBucket = {
  byColor: { [color: string]: { caseIds: string[]; value: number } };
  caseIds: string[];
  value: number;
};

export class EpiCurveUtil {
  /**
   * Creates normalized stacked area chart series data (0-100%) for the epi curve
   * @param items
   * @param xAxisIntervals
   * @param getXAxisLabel
   * @param stratification
   * @returns Area chart series data with max value (always 100) and series array
   */
  public static getAreaChartSeriesData(
    items: EpiCurveChartItem[],
    xAxisIntervals: Date[],
    getXAxisLabel: (value: Date) => string,
    stratification?: {
      caseIdColors?: { [caseId: string]: string };
      legendaItems?: Array<{ color: string; rowValue: { full: string } }>;
    } | null,
  ): { max: number; series: (null | unknown[]) } {
    if (!items || !stratification?.legendaItems?.length) {
      return {
        max: 100,
        series: null,
      };
    }

    // Step 1: Interpolate and normalize data for each series
    const normalizedDataPoints = EpiCurveUtil.getNormalizedAreaChartData(items, xAxisIntervals, stratification as {
      caseIdColors: { [caseId: string]: string };
      legendaItems: Array<{ color: string; rowValue: { full: string } }>;
    });

    if (!normalizedDataPoints.length) {
      return {
        max: 100,
        series: null,
      };
    }

    // Step 2: Output series for ECharts (each series: [x, y, caseIds])
    const seriesNames = stratification.legendaItems.map(item => item.rowValue.full);
    const xAxisLabels = xAxisIntervals.map(interval => getXAxisLabel(interval));
    const areaSeries: unknown[] = seriesNames.map((seriesName, seriesIdx) => {
      return {
        areaStyle: {},
        color: stratification.legendaItems[seriesIdx].color,
        data: normalizedDataPoints.map((point, pointIdx) => [
          xAxisLabels[pointIdx],
          point.values[seriesName],
          JSON.stringify(point.caseIds[seriesName]),
        ]),
        emphasis: {
          focus: 'series',
        },
        name: seriesName,
        smooth: false,
        stack: 'total',
        triggerLineEvent: true,
        type: 'line',
      };
    });

    return {
      max: 100,
      series: areaSeries,
    };
  }

  /**
   * Gets items within a specific interval (for bar chart)
   * @param items
   * @param intervals
   * @param index
   * @returns
   */
  public static getBarChartItemsWithinInterval(items: EpiCurveChartItem[], intervals: Date[], index: number): EpiCurveChartItem[] {
    return items.filter(item => {
      const nextInterval = intervals[index + 1];
      const itemDate = item.date;
      return isEqual(itemDate, intervals[index]) || (isAfter(itemDate, intervals[index]) && (!nextInterval || isBefore(itemDate, nextInterval)));
    });
  }

  /**
   * Creates bar chart series data for the epi curve
   * @param items
   * @param xAxisIntervals
   * @param getXAxisLabel
   * @param stratification
   * @returns Bar chart series data with max value and series array
   */
  public static getBarChartSeriesData(
    items: EpiCurveChartItem[],
    xAxisIntervals: Date[],
    getXAxisLabel: (value: Date) => string,
    stratification?: {
      caseIdColors?: { [caseId: string]: string };
      legendaItems?: Array<{ color: string; rowValue: { full: string } }>;
    } | null,
  ): { max: number; series: (null | unknown[]) } {
    if (!items) {
      return {
        max: null,
        series: null,
      };
    }

    let max = 0;
    const barSerieOptionsBase = {
      emphasis: {
        focus: 'self',
      },
      stack: 'total',
      type: 'bar',
    };
    const barSeries: unknown[] = [];

    const hasStratification = stratification?.legendaItems?.length;
    const buckets = EpiCurveUtil.getIntervalBuckets(items, xAxisIntervals, stratification?.caseIdColors);

    if (!hasStratification) {
      (barSeries).push({
        ...barSerieOptionsBase,
        color: ConfigManager.getInstance<CaseDbConfig>().config.epi.STRATIFICATION_COLORS[0],
        data: [],
        name: '',
      });
    } else {
      stratification.legendaItems.forEach(legendaItem => {
        (barSeries).push({
          ...barSerieOptionsBase,
          color: legendaItem.color,
          data: [],
          name: legendaItem.rowValue.full,
        });
      });
    }

    const xAxisLabels = xAxisIntervals.map(interval => getXAxisLabel(interval));
    for (let intervalIndex = 0; intervalIndex < xAxisIntervals.length; intervalIndex++) {
      const intervalBucket = buckets[intervalIndex];
      const xAxisLabel = xAxisLabels[intervalIndex];
      const intervalTotal = intervalBucket.value;

      if (intervalTotal > max) {
        max = intervalTotal;
      }

      if (!hasStratification) {
        const firstBarSerie = (barSeries as Array<{ data: unknown[] }>)[0];
        firstBarSerie?.data.push([
          xAxisLabel,
          intervalTotal,
          JSON.stringify(intervalBucket.caseIds),
        ]);
      } else {
        barSeries.forEach((barSerie) => {
          const barSerieData = (barSerie as { color: string; data: unknown[] });
          const bucketByColor = intervalBucket.byColor[barSerieData.color] ?? { caseIds: [], value: 0 };
          barSerieData.data.push([
            xAxisLabel,
            bucketByColor.value,
            JSON.stringify(bucketByColor.caseIds),
          ]);
        });
      }
    }

    return {
      max,
      series: barSeries,
    };
  }

  /**
   * Gets rows sorted by time for bar chart
   * @param completeCaseType
   * @param cases
   * @param cols
   * @returns
   */
  public static getBarChartSortedItems(completeCaseType: CaseDbCompleteCaseType, cases: CaseDbCase[], cols: CaseDbCol[]): EpiCurveChartItem[] {
    return EpiCurveUtil.getSortedItems(completeCaseType, cases, cols);
  }

  /**
   * Alias for backward compatibility
   * @deprecated Use getBarChartItemsWithinInterval instead
   */
  public static getItemsWithinInterval(items: EpiCurveChartItem[], intervals: Date[], index: number): EpiCurveChartItem[] {
    return EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, index);
  }

  /**
   * Creates normalized stacked area chart data (0-100%) with linear interpolation
   * @param items
   * @param xAxisIntervals
   * @param stratification
   * @returns Normalized data points ready for area chart
   */
  public static getNormalizedAreaChartData(
    items: EpiCurveChartItem[],
    xAxisIntervals: Date[],
    stratification: { caseIdColors: { [caseId: string]: string }; legendaItems: Array<{ color: string; rowValue: { full: string } }> } | null,
  ): EpiCurveNormalizedAreaChartDataPoint[] {
    if (!stratification || !xAxisIntervals.length) {
      return [];
    }

    // Step 1: Build value matrix for each series at each interval
    const seriesNames = stratification.legendaItems.map(item => item.rowValue.full);
    const seriesColors = stratification.legendaItems.map(item => item.color);
    const buckets = EpiCurveUtil.getIntervalBuckets(items, xAxisIntervals, stratification.caseIdColors);

    // Matrix: seriesIndex -> array of {date, value, caseIds}
    const seriesMatrix: Array<Array<{ caseIds: string[]; date: Date; value: number }>> = seriesNames.map((_, seriesIndex) => {
      const seriesColor = seriesColors[seriesIndex];
      return xAxisIntervals.map((interval, intervalIndex) => {
        const byColorBucket = buckets[intervalIndex].byColor[seriesColor] ?? { caseIds: [], value: 0 };
        return {
          caseIds: byColorBucket.caseIds,
          date: interval,
          value: byColorBucket.value,
        };
      });
    });

    // Step 2: Interpolate missing values for each series
    for (let seriesIndex = 0; seriesIndex < seriesNames.length; seriesIndex++) {
      const arr = seriesMatrix[seriesIndex];
      // Find all indices with value > 0
      let lastKnownIdx = -1;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].value > 0) {
          if (lastKnownIdx >= 0 && i - lastKnownIdx > 1) {
            // Interpolate between lastKnownIdx and i
            const v1 = arr[lastKnownIdx].value;
            const v2 = arr[i].value;
            const d1 = arr[lastKnownIdx].date.getTime();
            const d2 = arr[i].date.getTime();
            for (let j = lastKnownIdx + 1; j < i; j++) {
              const dj = arr[j].date.getTime();
              const t = (dj - d1) / (d2 - d1);
              arr[j].value = v1 + (v2 - v1) * t;
              arr[j].caseIds = [];
            }
          }
          lastKnownIdx = i;
        }
      }
    }

    // Step 3: For each interval, collect values for all series and normalize to 100%
    const normalizedDataPoints: EpiCurveNormalizedAreaChartDataPoint[] = xAxisIntervals.map((interval, idx) => {
      const values: { [seriesName: string]: number } = {};
      const caseIds: { [seriesName: string]: string[] } = {};
      let total = 0;
      for (let seriesIndex = 0; seriesIndex < seriesNames.length; seriesIndex++) {
        total += seriesMatrix[seriesIndex][idx].value;
      }
      for (let seriesIndex = 0; seriesIndex < seriesNames.length; seriesIndex++) {
        const v = seriesMatrix[seriesIndex][idx].value;
        const seriesName = seriesNames[seriesIndex];
        values[seriesName] = total > 0 ? (v / total) * 100 : 0;
        caseIds[seriesName] = seriesMatrix[seriesIndex][idx].caseIds;
      }
      return {
        caseIds,
        date: interval,
        values,
      };
    });

    return normalizedDataPoints;
  }

  /**
   * Finds the initial column (resolution) for the given dimensionId in the given lineList
   * @param completeCaseType
   * @param lineList
   * @param cols
   * @returns
   */
  public static getPreferredTimeColumn(completeCaseType: CaseDbCompleteCaseType, cases: CaseDbCase[], cols: CaseDbCol[]): CaseDbCol {
    const items = EpiCurveUtil.getSortedItems(completeCaseType, cases, cols);

    if (!items?.length) {
      return cols?.[0] ?? null;
    }

    const duration: Duration = {
      years: 0,
      ...intervalToDuration({
        end: items[items.length - 1].date,
        start: items[0].date,
      }),
    };

    const dayCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.TIME_DAY);
    if (dayCol && (duration.years ?? 0) === 0 && duration.months <= 3) {
      return dayCol;
    }
    const weekCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.TIME_WEEK);
    if (weekCol && (duration.years ?? 0) <= 1) {
      return weekCol;
    }
    const monthCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.TIME_MONTH);
    if (monthCol && (duration.years ?? 0) <= 2) {
      return monthCol;
    }
    const quarterCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.TIME_QUARTER);
    if (quarterCol && (duration.years ?? 0) <= 5) {
      return quarterCol;
    }
    const yearCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.TIME_QUARTER);
    if (yearCol) {
      return yearCol;
    }

    return CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
  }

  /**
   * Gets rows sorted by time
   * @param completeCaseType
   * @param cases
   * @param cols
   * @returns
   */
  public static getSortedItems(completeCaseType: CaseDbCompleteCaseType, cases: CaseDbCase[], cols: CaseDbCol[]): EpiCurveChartItem[] {
    if (!cols.length || !cases.length || !completeCaseType) {
      return [];
    }

    // cache the parsers
    const dateParsers: { [key: string]: (date: string) => Date } = {};
    cols.forEach(col => {
      dateParsers[col.id] = EpiFilterUtil.getDateParser(completeCaseType.ref_cols[col.ref_col_id]);
    });

    const items: EpiCurveChartItem[] = cases.map(row => {
      const dates = cols.map(col => {
        const columnDate = row.content[col.id];
        if (!columnDate) {
          return null;
        }
        const parsedColumnDate = dateParsers[col.id](columnDate);
        if (!isValid(parsedColumnDate)) {
          return null;
        }
        return parsedColumnDate;
      }).filter(d => !!d);

      return {
        date: dates[0] ?? null,
        row,
        // when count is null, 1 should be assumed
        value: row.count ?? 1,
      };
    }).filter(item => !!item.date);

    return items.sort((a, b) => {
      const aData = a.date;
      const bData = b.date;

      if (isAfter(aData, bData)) {
        return 1;
      }
      if (isBefore(aData, bData)) {
        return -1;
      }
      return 0;
    });
  }

  /**
   * Gets stratification colors from config
   * @returns Array of colors for stratification
   */
  public static getStratificationColors(): string[] {
    return ConfigManager.getInstance<CaseDbConfig>().config.epi.STRATIFICATION_COLORS;
  }

  public static getXAxisIntervals(colType: CaseDbColType, items: EpiCurveChartItem[]): Date[] {
    if (items.length === 0) {
      return [];
    }

    const start = items[0].date;
    const end = items[items.length - 1].date;

    switch (colType) {
      case CaseDbColType.TIME_DAY:
        return eachDayOfInterval({ end, start });
      case CaseDbColType.TIME_MONTH:
        return eachMonthOfInterval({ end, start });
      case CaseDbColType.TIME_QUARTER:
        return eachQuarterOfInterval({ end, start });
      case CaseDbColType.TIME_WEEK:
        return eachWeekOfInterval({ end, start });
      case CaseDbColType.TIME_YEAR:
        return eachYearOfInterval({ end, start });
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }

  public static getXAxisLabel(colType: CaseDbColType, value: Date): string {
    switch (colType) {
      case CaseDbColType.TIME_DAY:
        return format(value, DATE_FORMAT.DATE);
      case CaseDbColType.TIME_MONTH:
        return format(value, DATE_FORMAT.YEAR_MONTH);
      case CaseDbColType.TIME_QUARTER:
        return format(value, DATE_FORMAT.YEAR_QUARTER);
      case CaseDbColType.TIME_WEEK:
        return format(value, DATE_FORMAT.YEAR_WEEK, { useAdditionalWeekYearTokens: true });
      case CaseDbColType.TIME_YEAR:
        return format(value, DATE_FORMAT.YEAR);
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }

  private static getIntervalBuckets(
    items: EpiCurveChartItem[],
    intervals: Date[],
    caseIdColors?: { [caseId: string]: string },
  ): IntervalBucket[] {
    if (!intervals.length) {
      return [];
    }

    const intervalStartTimes = intervals.map(interval => interval.getTime());
    const lastIntervalIndex = intervalStartTimes.length - 1;
    const buckets: IntervalBucket[] = intervals.map(() => ({
      byColor: {},
      caseIds: [] as string[],
      value: 0,
    }));

    let intervalIndex = 0;
    for (const item of items) {
      const itemTime = item.date.getTime();

      // Move interval pointer until item belongs to [interval, nextInterval).
      while (
        intervalIndex < lastIntervalIndex
        && itemTime >= intervalStartTimes[intervalIndex + 1]
      ) {
        intervalIndex += 1;
      }

      const bucket = buckets[intervalIndex];
      bucket.value += item.value;
      bucket.caseIds.push(item.row.id);

      const color = caseIdColors?.[item.row.id];
      if (!color) {
        continue;
      }

      if (!bucket.byColor[color]) {
        bucket.byColor[color] = {
          caseIds: [] as string[],
          value: 0,
        };
      }
      bucket.byColor[color].value += item.value;
      bucket.byColor[color].caseIds.push(item.row.id);
    }

    return buckets;
  }

  // interpolateAreaChartData is now inlined in getNormalizedAreaChartData for per-series interpolation
}
