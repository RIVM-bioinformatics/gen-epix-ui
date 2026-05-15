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
import sum from 'lodash/sum';
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

interface Item {
  date: Date;
  row: CaseDbCase;
  value: number;
}

interface NormalizedAreaChartDataPoint {
  caseIds: { [seriesName: string]: string[] };
  date: Date;
  values: { [seriesName: string]: number };
}

export type { Item, NormalizedAreaChartDataPoint };

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
    items: Item[],
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
    const areaSeries: unknown[] = seriesNames.map((seriesName, seriesIdx) => {
      return {
        areaStyle: {},
        color: stratification.legendaItems[seriesIdx].color,
        data: normalizedDataPoints.map(point => [
          getXAxisLabel(point.date),
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
  public static getBarChartItemsWithinInterval(items: Item[], intervals: Date[], index: number): Item[] {
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
    items: Item[],
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

    xAxisIntervals.forEach((interval, intervalIndex) => {
      const itemsWithinInterval = EpiCurveUtil.getBarChartItemsWithinInterval(items, xAxisIntervals, intervalIndex);
      const xAxisLabel = getXAxisLabel(interval);
      const intervalTotal = sum(itemsWithinInterval.map(item => item.value));

      if (intervalTotal > max) {
        max = intervalTotal;
      }

      if (!hasStratification) {
        const firstBarSerie = (barSeries as Array<{ data: unknown[] }>)[0];
        firstBarSerie?.data.push([
          xAxisLabel,
          intervalTotal,
          JSON.stringify(itemsWithinInterval.map(item => item.row.id)),
        ]);
      } else {
        barSeries.forEach((barSerie) => {
          const barSerieData = (barSerie as { color: string; data: unknown[] });
          const caseIdColors = stratification.caseIdColors || {};
          const filteredItems = itemsWithinInterval.filter(item => caseIdColors[item.row.id] === barSerieData.color);
          barSerieData.data.push([
            xAxisLabel,
            sum(filteredItems.map(item => item.value)),
            JSON.stringify(filteredItems.map(item => item.row.id)),
          ]);
        });
      }
    });

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
  public static getBarChartSortedItems(completeCaseType: CaseDbCompleteCaseType, cases: CaseDbCase[], cols: CaseDbCol[]): Item[] {
    return EpiCurveUtil.getSortedItems(completeCaseType, cases, cols);
  }

  /**
   * Alias for backward compatibility
   * @deprecated Use getBarChartItemsWithinInterval instead
   */
  public static getItemsWithinInterval(items: Item[], intervals: Date[], index: number): Item[] {
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
    items: Item[],
    xAxisIntervals: Date[],
    stratification: { caseIdColors: { [caseId: string]: string }; legendaItems: Array<{ color: string; rowValue: { full: string } }> } | null,
  ): NormalizedAreaChartDataPoint[] {
    if (!stratification || !xAxisIntervals.length) {
      return [];
    }

    // Step 1: Build value matrix for each series at each interval
    const seriesNames = stratification.legendaItems.map(item => item.rowValue.full);
    // Matrix: seriesName -> array of {date, value, caseIds}
    const seriesMatrix: {
      [seriesName: string]: Array<{ caseIds: string[]; date: Date; value: number }>;
    } = {};
    seriesNames.forEach(seriesName => {
      seriesMatrix[seriesName] = xAxisIntervals.map((interval, intervalIndex) => {
        const itemsWithinInterval = EpiCurveUtil.getBarChartItemsWithinInterval(items, xAxisIntervals, intervalIndex);
        const filteredItems = itemsWithinInterval.filter(
          item => stratification.caseIdColors[item.row.id] === stratification.legendaItems.find(l => l.rowValue.full === seriesName)?.color,
        );
        return {
          caseIds: filteredItems.map(item => item.row.id),
          date: interval,
          value: filteredItems.length > 0 ? sum(filteredItems.map(item => item.value)) : 0,
        };
      });
    });

    // Step 2: Interpolate missing values for each series
    seriesNames.forEach(seriesName => {
      const arr = seriesMatrix[seriesName];
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
    });

    // Step 3: For each interval, collect values for all series and normalize to 100%
    const normalizedDataPoints: NormalizedAreaChartDataPoint[] = xAxisIntervals.map((interval, idx) => {
      const values: { [seriesName: string]: number } = {};
      const caseIds: { [seriesName: string]: string[] } = {};
      let total = 0;
      seriesNames.forEach(seriesName => {
        const v = seriesMatrix[seriesName][idx].value;
        total += v;
      });
      seriesNames.forEach(seriesName => {
        const v = seriesMatrix[seriesName][idx].value;
        values[seriesName] = total > 0 ? (v / total) * 100 : 0;
        caseIds[seriesName] = seriesMatrix[seriesName][idx].caseIds;
      });
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
  public static getSortedItems(completeCaseType: CaseDbCompleteCaseType, cases: CaseDbCase[], cols: CaseDbCol[]): Item[] {
    if (!cols.length || !cases.length || !completeCaseType) {
      return [];
    }

    // cache the parsers
    const dateParsers: { [key: string]: (date: string) => Date } = {};
    cols.forEach(col => {
      dateParsers[col.id] = EpiFilterUtil.getDateParser(completeCaseType.ref_cols[col.ref_col_id]);
    });

    const items: Item[] = cases.map(row => {
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

  public static getXAxisIntervals(colType: CaseDbColType, items: Item[]): Date[] {
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

  // interpolateAreaChartData is now inlined in getNormalizedAreaChartData for per-series interpolation
}
