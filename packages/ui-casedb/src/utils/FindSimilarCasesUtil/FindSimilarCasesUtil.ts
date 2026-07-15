import {
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';
import { DATE_FORMAT } from '@gen-epix/ui';

import type {
  FindSimilarCasesChartDataPoint,
  FindSimilarCasesChartGranularity,
  FindSimilarCasesChartInterval,
} from '../../models/caseDb';

export class FindSimilarCasesUtil {
  public static buildChartIntervals(data: FindSimilarCasesChartDataPoint[]): FindSimilarCasesChartInterval[] {
    if (data.length === 0) {
      return [];
    }

    const minDate = parseISO(data[0].date);
    const maxDate = parseISO(data[data.length - 1].date);
    const granularity = FindSimilarCasesUtil.pickGranularity(minDate, maxDate);

    const countsMap = new Map<string, number>();
    const ownCaseCountsMap = new Map<string, number>();
    const otherOrganizationCaseCountsMap = new Map<string, number>();
    for (const { count, date, otherOrganizationCaseCount, ownCaseCount } of data) {
      const { label } = FindSimilarCasesUtil.getIntervalBoundsAndLabel(parseISO(date), granularity);
      countsMap.set(label, (countsMap.get(label) ?? 0) + count);
      ownCaseCountsMap.set(label, (ownCaseCountsMap.get(label) ?? 0) + ownCaseCount);
      otherOrganizationCaseCountsMap.set(label, (otherOrganizationCaseCountsMap.get(label) ?? 0) + otherOrganizationCaseCount);
    }

    const { start: rangeStart } = FindSimilarCasesUtil.getIntervalBoundsAndLabel(minDate, granularity);
    const { start: rangeEnd } = FindSimilarCasesUtil.getIntervalBoundsAndLabel(maxDate, granularity);
    const intervalDates = FindSimilarCasesUtil.generateIntervalStartDates(rangeStart, rangeEnd, granularity);

    return intervalDates.map(d => {
      const { end, label, start } = FindSimilarCasesUtil.getIntervalBoundsAndLabel(d, granularity);
      return {
        count: countsMap.get(label) ?? 0,
        endDate: format(end, DATE_FORMAT.DATE),
        label,
        otherOrganizationCaseCount: otherOrganizationCaseCountsMap.get(label) ?? 0,
        ownCaseCount: ownCaseCountsMap.get(label) ?? 0,
        startDate: format(start, DATE_FORMAT.DATE),
      };
    });
  }

  private static generateIntervalStartDates(rangeStart: Date, rangeEnd: Date, granularity: FindSimilarCasesChartGranularity): Date[] {
    switch (granularity) {
      case 'day': return eachDayOfInterval({ end: rangeEnd, start: rangeStart });
      case 'month': return eachMonthOfInterval({ end: rangeEnd, start: rangeStart });
      case 'quarter': return eachQuarterOfInterval({ end: rangeEnd, start: rangeStart });
      case 'year': return eachYearOfInterval({ end: rangeEnd, start: rangeStart });
      default: throw new Error(`Unhandled granularity: ${String(granularity)}`);
    }
  }

  private static getIntervalBoundsAndLabel(d: Date, granularity: FindSimilarCasesChartGranularity): { end: Date; label: string; start: Date } {
    switch (granularity) {
      case 'day': return { end: endOfDay(d), label: format(startOfDay(d), DATE_FORMAT.DATE), start: startOfDay(d) };
      case 'month': return { end: endOfMonth(d), label: format(startOfMonth(d), DATE_FORMAT.YEAR_MONTH), start: startOfMonth(d) };
      case 'quarter': return { end: endOfQuarter(d), label: format(startOfQuarter(d), DATE_FORMAT.YEAR_QUARTER), start: startOfQuarter(d) };
      case 'year': return { end: endOfYear(d), label: format(startOfYear(d), DATE_FORMAT.YEAR), start: startOfYear(d) };
      default: throw new Error(`Unhandled granularity: ${String(granularity)}`);
    }
  }

  private static pickGranularity(minDate: Date, maxDate: Date): FindSimilarCasesChartGranularity {
    const days = differenceInDays(maxDate, minDate);
    if (days <= 90) {
      return 'day';
    }
    if (days <= 730) {
      return 'month';
    }
    if (days <= 2920) {
      return 'quarter';
    }
    return 'year';
  }
}
