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

import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiFilterUtil } from '../EpiFilterUtil';
import type {
  Case,
  CompleteCaseType,
  CaseTypeCol,
} from '../../api';
import { ColType } from '../../api';

interface Item {
  date: Date;
  value: number;
  row: Case;
}

export class EpiCurveUtil {
  /**
   * Gets rows sorted by time
   * @param completeCaseType
   * @param lineList
   * @param caseTypeColumns
   * @returns
   */
  public static getSortedItems(completeCaseType: CompleteCaseType, cases: Case[], caseTypeColumns: CaseTypeCol[]): Item[] {
    if (!caseTypeColumns.length || !cases.length || !completeCaseType) {
      return [];
    }

    // cache the parsers
    const dateParsers: { [key: string]: (date: string) => Date } = {};
    caseTypeColumns.forEach(caseTypeColumn => {
      dateParsers[caseTypeColumn.id] = EpiFilterUtil.getDateParser(completeCaseType.cols[caseTypeColumn.col_id]);
    });

    const items: Item[] = cases.map(row => {
      const dates = caseTypeColumns.map(caseTypeColumn => {
        const columnDate = row.content[caseTypeColumn.id];
        if (!columnDate) {
          return null;
        }
        const parsedColumnDate = dateParsers[caseTypeColumn.id](columnDate);
        if (!isValid(parsedColumnDate)) {
          return null;
        }
        return parsedColumnDate;
      }).filter(d => !!d);

      return {
        date: dates[0] ?? null,
        // when count is null, 1 should be assumed
        value: row.count ?? 1,
        row,
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
   * Finds the initial column (resolution) for the given dimensionId in the given lineList
   * @param completeCaseType
   * @param lineList
   * @param caseTypeColumns
   * @returns
   */
  public static getPreferredTimeColumn(completeCaseType: CompleteCaseType, cases: Case[], caseTypeColumns: CaseTypeCol[]): CaseTypeCol {
    const items = EpiCurveUtil.getSortedItems(completeCaseType, cases, caseTypeColumns);

    if (!items?.length) {
      return caseTypeColumns?.[0] ?? null;
    }

    const duration: Duration = {
      years: 0,
      ...intervalToDuration({
        start: items[0].date,
        end: items[items.length - 1].date,
      }),
    };

    const dayCol = caseTypeColumns.find(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id].col_type === ColType.TIME_DAY);
    if (dayCol && (duration.years ?? 0) === 0 && duration.months <= 3) {
      return dayCol;
    }
    const weekCol = caseTypeColumns.find(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id].col_type === ColType.TIME_WEEK);
    if (weekCol && (duration.years ?? 0) <= 1) {
      return weekCol;
    }
    const monthCol = caseTypeColumns.find(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id].col_type === ColType.TIME_MONTH);
    if (monthCol && (duration.years ?? 0) <= 2) {
      return monthCol;
    }
    const quarterCol = caseTypeColumns.find(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id].col_type === ColType.TIME_QUARTER);
    if (quarterCol && (duration.years ?? 0) <= 5) {
      return quarterCol;
    }
    const yearCol = caseTypeColumns.find(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id].col_type === ColType.TIME_QUARTER);
    if (yearCol) {
      return yearCol;
    }

    return EpiCaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType);
  }

  public static getXAxisLabel(colType: ColType, value: Date): string {
    switch (colType) {
      case ColType.TIME_DAY:
        return format(value, 'yyyy-MM-dd');
      case ColType.TIME_WEEK:
        return format(value, 'yyyy-\'W\'ww');
      case ColType.TIME_MONTH:
        return format(value, 'yyyy-MM');
      case ColType.TIME_QUARTER:
        return format(value, 'yyyy-QQQ');
      case ColType.TIME_YEAR:
        return format(value, 'yyyy');
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }

  public static getXAxisIntervals(colType: ColType, items: Item[]): Date[] {
    if (items.length === 0) {
      return [];
    }

    const start = items[0].date;
    const end = items[items.length - 1].date;

    switch (colType) {
      case ColType.TIME_DAY:
        return eachDayOfInterval({ start, end });
      case ColType.TIME_WEEK:
        return eachWeekOfInterval({ start, end });
      case ColType.TIME_MONTH:
        return eachMonthOfInterval({ start, end });
      case ColType.TIME_QUARTER:
        return eachQuarterOfInterval({ start, end });
      case ColType.TIME_YEAR:
        return eachYearOfInterval({ start, end });
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }

  public static getItemsWithinInterval(items: Item[], intervals: Date[], index: number): Item[] {
    return items.filter(item => {
      const nextInterval = intervals[index + 1];
      const itemDate = item.date;
      return isEqual(itemDate, intervals[index]) || (isAfter(itemDate, intervals[index]) && (!nextInterval || isBefore(itemDate, nextInterval)));
    });
  }
}
