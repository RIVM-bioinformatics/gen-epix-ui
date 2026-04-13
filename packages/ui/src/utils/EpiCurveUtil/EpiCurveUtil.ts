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

import { CaseTypeUtil } from '../CaseTypeUtil';
import { EpiFilterUtil } from '../EpiFilterUtil';
import type {
  Case,
  Col,
  CompleteCaseType,
} from '../../api';
import { ColType } from '../../api';
import { DATE_FORMAT } from '../../data/date';

interface Item {
  date: Date;
  row: Case;
  value: number;
}

export class EpiCurveUtil {
  public static getItemsWithinInterval(items: Item[], intervals: Date[], index: number): Item[] {
    return items.filter(item => {
      const nextInterval = intervals[index + 1];
      const itemDate = item.date;
      return isEqual(itemDate, intervals[index]) || (isAfter(itemDate, intervals[index]) && (!nextInterval || isBefore(itemDate, nextInterval)));
    });
  }

  /**
   * Finds the initial column (resolution) for the given dimensionId in the given lineList
   * @param completeCaseType
   * @param lineList
   * @param cols
   * @returns
   */
  public static getPreferredTimeColumn(completeCaseType: CompleteCaseType, cases: Case[], cols: Col[]): Col {
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

    const dayCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === ColType.TIME_DAY);
    if (dayCol && (duration.years ?? 0) === 0 && duration.months <= 3) {
      return dayCol;
    }
    const weekCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === ColType.TIME_WEEK);
    if (weekCol && (duration.years ?? 0) <= 1) {
      return weekCol;
    }
    const monthCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === ColType.TIME_MONTH);
    if (monthCol && (duration.years ?? 0) <= 2) {
      return monthCol;
    }
    const quarterCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === ColType.TIME_QUARTER);
    if (quarterCol && (duration.years ?? 0) <= 5) {
      return quarterCol;
    }
    const yearCol = cols.find(col => completeCaseType.ref_cols[col.ref_col_id].col_type === ColType.TIME_QUARTER);
    if (yearCol) {
      return yearCol;
    }

    return CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
  }

  /**
   * Gets rows sorted by time
   * @param completeCaseType
   * @param lineList
   * @param cols
   * @returns
   */
  public static getSortedItems(completeCaseType: CompleteCaseType, cases: Case[], cols: Col[]): Item[] {
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

  public static getXAxisIntervals(colType: ColType, items: Item[]): Date[] {
    if (items.length === 0) {
      return [];
    }

    const start = items[0].date;
    const end = items[items.length - 1].date;

    switch (colType) {
      case ColType.TIME_DAY:
        return eachDayOfInterval({ end, start });
      case ColType.TIME_MONTH:
        return eachMonthOfInterval({ end, start });
      case ColType.TIME_QUARTER:
        return eachQuarterOfInterval({ end, start });
      case ColType.TIME_WEEK:
        return eachWeekOfInterval({ end, start });
      case ColType.TIME_YEAR:
        return eachYearOfInterval({ end, start });
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }

  public static getXAxisLabel(colType: ColType, value: Date): string {
    switch (colType) {
      case ColType.TIME_DAY:
        return format(value, DATE_FORMAT.DATE);
      case ColType.TIME_MONTH:
        return format(value, DATE_FORMAT.YEAR_MONTH);
      case ColType.TIME_QUARTER:
        return format(value, DATE_FORMAT.YEAR_QUARTER);
      case ColType.TIME_WEEK:
        return format(value, DATE_FORMAT.YEAR_WEEK, { useAdditionalWeekYearTokens: true });
      case ColType.TIME_YEAR:
        return format(value, DATE_FORMAT.YEAR);
      default:
        throw Error(`unknown col_type ${colType}`);
    }
  }
}
