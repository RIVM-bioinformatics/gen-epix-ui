import {
  afterAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Theme } from '@mui/material';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import { STRATIFICATION_MODE } from '../../models/stratification.models';
import { CaseTypeUtil } from '../CaseTypeUtil';

import type { EpiCurveChartItem } from './EpiCurveUtil';
import { EpiCurveUtil } from './EpiCurveUtil';

const makeCol = (id: string, refColId: string, _colType: CaseDbColType, label = id): CaseDbCol => {
  return {
    id,
    label,
    ref_col_id: refColId,
  } as unknown as CaseDbCol;
};

const makeCase = (id: string, colId: string, date: string, count?: number): CaseDbCase => {
  return {
    content: {
      [colId]: date,
    },
    count,
    id,
  } as unknown as CaseDbCase;
};

const makeCompleteCaseType = (refCols: Array<{ colType: CaseDbColType; id: string }>): CaseDbCompleteCaseType => {
  const mappedRefCols = refCols.reduce<Record<string, { col_type: CaseDbColType }>>((acc, refCol) => {
    acc[refCol.id] = {
      col_type: refCol.colType,
    };
    return acc;
  }, {});

  return {
    ref_cols: mappedRefCols,
  } as unknown as CaseDbCompleteCaseType;
};

describe('EpiCurveUtil', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('getBarChartItemsWithinInterval', () => {
    it('includes values in [interval, nextInterval) and excludes nextInterval boundary', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2023-12-31T00:00:00Z'), row: { id: 'before' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T12:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'c' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-03T00:00:00Z'), row: { id: 'after' } as CaseDbCase, value: 1 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      ];

      const firstBucket = EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, 0);
      const secondBucket = EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, 1);

      expect(firstBucket.map(x => x.row.id)).toEqual(['a', 'b']);
      expect(secondBucket.map(x => x.row.id)).toEqual(['c', 'after']);
    });
  });

  describe('getBarChartSeriesData', () => {
    const mockTheme = {
      palette: {
        primary: {
          main: '#ff0000',
        },
      },
    } as unknown as Theme;

    it('creates a single non-stratified bar series and computes max', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-01T06:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'c' } as CaseDbCase, value: 5 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
        new Date('2024-01-03T00:00:00Z'),
      ];

      const result = EpiCurveUtil.getBarChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), null, mockTheme);

      expect(result.max).toBe(5);
      expect(result.series).toHaveLength(1);

      const firstSeries = (result.series as Array<{ color: string; data: Array<[string, number, string]>; name: string }>)[0];
      expect(firstSeries.color).toBe('#ff0000');
      expect(firstSeries.name).toBe('');
      expect(firstSeries.data).toEqual([
        ['2024-01-01', 3, JSON.stringify(['a', 'b'])],
        ['2024-01-02', 5, JSON.stringify(['c'])],
        ['2024-01-03', 0, JSON.stringify([])],
      ]);
    });

    it('returns null values when the case list is absent', () => {
      expect(EpiCurveUtil.getBarChartSeriesData(null, [], () => '', null, mockTheme)).toEqual({
        max: null,
        series: null,
      });
    });

    it('returns an empty series when there are no intervals', () => {
      const result = EpiCurveUtil.getBarChartSeriesData([
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'case-1' } as CaseDbCase, value: 1 },
      ], [], () => '', null, mockTheme);

      expect(result.max).toBe(0);
      expect((result.series as Array<{ data: unknown[] }>)[0].data).toEqual([]);
    });

    it('creates stratified bar series with correct per-color values', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'd' } as CaseDbCase, value: 0 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'c' } as CaseDbCase, value: 3 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      ];
      const stratification = {
        caseIdColors: {
          a: '#red',
          b: '#blue',
          c: '#red',
          d: '#red',
        },
        colorForIsMissing: '#missing',
        legendaItems: [
          {
            caseIds: ['a', 'c'],
            color: '#red',
            rowValue: { full: 'Red', long: 'Red', raw: 'Red', short: 'Red' },
          },
          {
            caseIds: ['b'],
            color: '#blue',
            rowValue: { full: 'Blue', long: 'Blue', raw: 'Blue', short: 'Blue' },
          },
        ],
        mode: STRATIFICATION_MODE.FIELD,
      };

      const result = EpiCurveUtil.getBarChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), stratification, mockTheme);

      expect(result.max).toBe(3);
      const series = result.series as Array<{ data: Array<[string, number, string]>; name: string }>;
      expect(series).toHaveLength(2);
      expect(series[0].name).toBe('Red');
      expect(series[0].data).toEqual([
        ['2024-01-01', 2, JSON.stringify(['a', 'd'])],
        ['2024-01-02', 3, JSON.stringify(['c'])],
      ]);
      expect(series[1].name).toBe('Blue');
      expect(series[1].data).toEqual([
        ['2024-01-01', 1, JSON.stringify(['b'])],
        ['2024-01-02', 0, JSON.stringify([])],
      ]);
    });
  });

  describe('getNormalizedAreaChartData', () => {
    it('normalizes to 100% per interval and interpolates interior zero values', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'r1' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'b1' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'r2' } as CaseDbCase, value: 4 },
        { date: new Date('2024-01-03T00:00:00Z'), row: { id: 'b2' } as CaseDbCase, value: 4 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
        new Date('2024-01-03T00:00:00Z'),
      ];
      const stratification = {
        caseIdColors: {
          b1: '#blue',
          b2: '#blue',
          r1: '#red',
          r2: '#red',
        },
        legendaItems: [
          { color: '#red', rowValue: { full: 'Red' } },
          { color: '#blue', rowValue: { full: 'Blue' } },
        ],
      };

      const result = EpiCurveUtil.getNormalizedAreaChartData(items, intervals, stratification);

      expect(result).toHaveLength(3);
      result.forEach((point) => {
        const total = Object.values(point.values).reduce((acc, value) => acc + value, 0);
        expect(total).toBeCloseTo(100, 8);
      });

      expect(result[1].values['Blue']).toBeGreaterThan(40);
      expect(result[1].values['Blue']).toBeLessThan(45);
      expect(result[1].caseIds['Blue']).toEqual([]);
    });

    it('returns empty array without stratification or intervals', () => {
      const items: EpiCurveChartItem[] = [{ date: new Date('2024-01-01'), row: { id: 'a' } as CaseDbCase, value: 1 }];
      expect(EpiCurveUtil.getNormalizedAreaChartData(items, [], null)).toEqual([]);
    });

    it('returns empty array when stratification exists but intervals are absent', () => {
      expect(EpiCurveUtil.getNormalizedAreaChartData([], [], {
        caseIdColors: {},
        legendaItems: [],
      })).toEqual([]);
    });

    it('assigns zero percentages when no cases map to a visible series', () => {
      const interval = new Date('2024-01-01T00:00:00Z');
      const result = EpiCurveUtil.getNormalizedAreaChartData([
        { date: interval, row: { id: 'unmapped' } as CaseDbCase, value: 3 },
      ], [interval], {
        caseIdColors: {},
        legendaItems: [{ color: '#red', rowValue: { full: 'Red' } }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].caseIds['Red']).toEqual([]);
      expect(result[0].date).toBe(interval);
      expect(result[0].values['Red']).toBe(0);
    });
  });

  describe('getAreaChartSeriesData', () => {
    it('returns null series when the case list is absent', () => {
      expect(EpiCurveUtil.getAreaChartSeriesData(
        null,
        [],
        () => '',
        true,
        null,
      )).toEqual({ max: 100, series: null });
    });

    it('includes line stack settings and triggerEvent', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
      ];
      const intervals = [new Date('2024-01-01T00:00:00Z')];
      const stratification = {
        caseIdColors: {
          a: '#red',
          b: '#blue',
        },
        colorForIsMissing: '#missing',
        legendaItems: [
          {
            caseIds: ['a'],
            color: '#red',
            rowValue: { full: 'Red', long: 'Red', raw: 'Red', short: 'Red' },
          },
          {
            caseIds: ['b'],
            color: '#blue',
            rowValue: { full: 'Blue', long: 'Blue', raw: 'Blue', short: 'Blue' },
          },
        ],
        mode: STRATIFICATION_MODE.FIELD,
      };

      const result = EpiCurveUtil.getAreaChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), true, {
        ...stratification,
        colorForIsMissing: '#missing',
      });

      expect(result.max).toBe(100);
      const series = result.series as Array<{ data: unknown[]; stack: string; triggerEvent: boolean; type: string }>;
      expect(series).toHaveLength(2);
      expect(series[0].type).toBe('line');
      expect(series[0].stack).toBe('total');
      expect(series[0].triggerEvent).toBe(true);
      expect(series[0].data).toHaveLength(1);
    });

    it('returns null series when stratification is missing', () => {
      const result = EpiCurveUtil.getAreaChartSeriesData([], [], () => '', true, null);
      expect(result).toEqual({
        max: 100,
        series: null,
      });
    });

    it('returns null series when the stratification has no legend items', () => {
      expect(EpiCurveUtil.getAreaChartSeriesData([], [], () => '', true, {
        caseIdColors: {},
        colorForIsMissing: '',
        legendaItems: [],
        mode: STRATIFICATION_MODE.FIELD,
      })).toEqual({ max: 100, series: null });
    });

    it('returns null series when intervals are empty', () => {
      expect(EpiCurveUtil.getAreaChartSeriesData([], [], () => '', true, {
        caseIdColors: {},
        colorForIsMissing: '#missing',
        legendaItems: [{
          caseIds: [],
          color: '#red',
          rowValue: { full: 'Red', long: 'Red', raw: 'Red', short: 'Red' },
        }],
        mode: STRATIFICATION_MODE.FIELD,
      })).toEqual({ max: 100, series: null });
    });

    it('returns null series when all legend items are filtered as missing', () => {
      expect(EpiCurveUtil.getAreaChartSeriesData([], [], () => '', false, {
        caseIdColors: {},
        colorForIsMissing: '#missing',
        legendaItems: [{
          caseIds: [],
          color: '#missing',
          rowValue: { full: 'Missing', long: 'Missing', raw: 'Missing', short: 'Missing' },
        }],
        mode: STRATIFICATION_MODE.FIELD,
      })).toEqual({ max: 100, series: null });
    });

    it('filters missing-value series when includeMissingValues is false', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'm' } as CaseDbCase, value: 1 },
      ];
      const intervals = [new Date('2024-01-01T00:00:00Z')];
      const stratification = {
        caseIdColors: {
          a: '#red',
          m: '#missing',
        },
        colorForIsMissing: '#missing',
        legendaItems: [
          {
            caseIds: ['m'],
            color: '#missing',
            rowValue: {
              full: 'Missing',
              long: 'Missing',
              raw: 'Missing',
              short: 'Missing',
            },
          },
          {
            caseIds: ['a'],
            color: '#red',
            rowValue: {
              full: 'Red',
              long: 'Red',
              raw: 'Red',
              short: 'Red',
            },
          },
        ],
        mode: STRATIFICATION_MODE.FIELD,
      };

      const withMissing = EpiCurveUtil.getAreaChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), true, stratification);
      const withoutMissing = EpiCurveUtil.getAreaChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), false, stratification);

      expect(withMissing.series).toHaveLength(2);
      expect(withoutMissing.series).toHaveLength(1);
      expect(((withoutMissing.series as Array<{ color: string; name: string }>)[0])).toMatchObject({
        color: '#red',
        name: 'Red',
      });
    });
  });

  describe('getSortedItems', () => {
    it('parses, filters invalid dates and sorts ascending while defaulting count to 1', () => {
      const col = makeCol('col_day', 'ref_day', CaseDbColType.TIME_DAY);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);
      const cases: CaseDbCase[] = [
        makeCase('b', 'col_day', '2024-01-02', 3),
        makeCase('a', 'col_day', '2024-01-01'),
        makeCase('invalid', 'col_day', 'not-a-date', 10),
        ({ content: {}, id: 'missing' } as unknown as CaseDbCase),
      ];

      const result = EpiCurveUtil.getSortedItems(completeCaseType, cases, [col]);

      expect(result.map(item => item.row.id)).toEqual(['a', 'b']);
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(3);
    });

    it('returns empty when required inputs are missing', () => {
      expect(EpiCurveUtil.getSortedItems(null, [], [])).toEqual([]);
    });

    it('returns empty when only the case list is empty', () => {
      const col = makeCol('col_day', 'ref_day', CaseDbColType.TIME_DAY);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);
      expect(EpiCurveUtil.getSortedItems(completeCaseType, [], [col])).toEqual([]);
    });

    it('returns empty when only the column list is empty', () => {
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);
      expect(EpiCurveUtil.getSortedItems(completeCaseType, [makeCase('case-1', 'day', '2024-01-01')], [])).toEqual([]);
    });

    it('sorts already ordered rows and preserves equal-date order', () => {
      const col = makeCol('day', 'ref_day', CaseDbColType.TIME_DAY);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);
      const cases = [
        makeCase('first', 'day', '2024-01-01'),
        makeCase('same-day', 'day', '2024-01-01'),
        makeCase('later', 'day', '2024-01-02'),
      ];

      expect(EpiCurveUtil.getSortedItems(completeCaseType, cases, [col]).map(item => item.row.id)).toEqual([
        'first',
        'same-day',
        'later',
      ]);
    });
  });

  describe('getBarChartSortedItems', () => {
    it('delegates to the sorted-item calculation', () => {
      const col = makeCol('day', 'ref_day', CaseDbColType.TIME_DAY);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);
      const cases = [makeCase('case-1', 'day', '2024-01-01')];

      expect(EpiCurveUtil.getBarChartSortedItems(completeCaseType, cases, [col])).toEqual(
        EpiCurveUtil.getSortedItems(completeCaseType, cases, [col]),
      );
    });
  });

  describe('getPreferredTimeColumn', () => {
    it('prefers day column for short ranges', () => {
      const dayCol = makeCol('day', 'ref_day', CaseDbColType.TIME_DAY);
      const weekCol = makeCol('week', 'ref_week', CaseDbColType.TIME_WEEK);
      const monthCol = makeCol('month', 'ref_month', CaseDbColType.TIME_MONTH);
      const quarterCol = makeCol('quarter', 'ref_quarter', CaseDbColType.TIME_QUARTER);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_DAY, id: 'ref_day' },
        { colType: CaseDbColType.TIME_WEEK, id: 'ref_week' },
        { colType: CaseDbColType.TIME_MONTH, id: 'ref_month' },
        { colType: CaseDbColType.TIME_QUARTER, id: 'ref_quarter' },
      ]);
      const cases = [
        makeCase('a', 'day', '2024-01-01', 1),
        makeCase('b', 'day', '2024-03-15', 1),
      ];

      const preferred = EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [dayCol, weekCol, monthCol, quarterCol]);
      expect(preferred.id).toBe('day');
    });

    it('falls back to first available col when there are no items', () => {
      const dayCol = makeCol('day', 'ref_day', CaseDbColType.TIME_DAY);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_DAY, id: 'ref_day' }]);

      const preferred = EpiCurveUtil.getPreferredTimeColumn(completeCaseType, [], [dayCol]);
      expect(preferred.id).toBe('day');
      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, [], [])).toBeNull();
    });

    it('uses the year column for ranges too long for finer resolutions', () => {
      const yearCol = makeCol('year', 'ref_year', CaseDbColType.TIME_YEAR);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TIME_YEAR, id: 'ref_year' }]);
      const cases = [
        makeCase('first', 'year', '2020', 1),
        makeCase('last', 'year', '2024', 1),
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [yearCol])).toBe(yearCol);
    });

    it('uses a week column for ranges under one year and after the day threshold', () => {
      const dayCol = makeCol('day', 'ref-day', CaseDbColType.TIME_DAY);
      const weekCol = makeCol('week', 'ref-week', CaseDbColType.TIME_WEEK);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_DAY, id: 'ref-day' },
        { colType: CaseDbColType.TIME_WEEK, id: 'ref-week' },
      ]);
      const cases = [
        { content: { day: '2024-01-01', week: '2024-01-01' }, id: 'first' } as unknown as CaseDbCase,
        { content: { day: '2024-05-01', week: '2024-05-01' }, id: 'last' } as unknown as CaseDbCase,
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [dayCol, weekCol])).toBe(weekCol);
    });

    it('keeps day resolution when date-fns omits zero duration units', () => {
      const dayCol = makeCol('day', 'ref-day', CaseDbColType.TIME_DAY);
      const weekCol = makeCol('week', 'ref-week', CaseDbColType.TIME_WEEK);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_DAY, id: 'ref-day' },
        { colType: CaseDbColType.TIME_WEEK, id: 'ref-week' },
      ]);
      const cases = [
        { content: { day: '2024-01-01', week: '2024-01-01' }, id: 'first' } as unknown as CaseDbCase,
        { content: { day: '2024-01-02', week: '2024-01-02' }, id: 'last' } as unknown as CaseDbCase,
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [dayCol, weekCol])).toBe(dayCol);
    });

    it('uses a month column for ranges longer than one year but no longer than two', () => {
      const weekCol = makeCol('week', 'ref-week', CaseDbColType.TIME_WEEK);
      const monthCol = makeCol('month', 'ref-month', CaseDbColType.TIME_MONTH);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_WEEK, id: 'ref-week' },
        { colType: CaseDbColType.TIME_MONTH, id: 'ref-month' },
      ]);
      const cases = [
        { content: { month: '2022-01-01', week: '2022-01-01' }, id: 'first' } as unknown as CaseDbCase,
        { content: { month: '2024-01-01', week: '2024-01-01' }, id: 'last' } as unknown as CaseDbCase,
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [weekCol, monthCol])).toBe(monthCol);
    });

    it('uses a quarter column for ranges longer than two years but no longer than five', () => {
      const monthCol = makeCol('month', 'ref-month', CaseDbColType.TIME_MONTH);
      const quarterCol = makeCol('quarter', 'ref-quarter', CaseDbColType.TIME_QUARTER);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_MONTH, id: 'ref-month' },
        { colType: CaseDbColType.TIME_QUARTER, id: 'ref-quarter' },
      ]);
      const cases = [
        { content: { month: '2020-01-01', quarter: '2020-Q1' }, id: 'first' } as unknown as CaseDbCase,
        { content: { month: '2023-01-01', quarter: '2023-Q1' }, id: 'last' } as unknown as CaseDbCase,
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [monthCol, quarterCol])).toBe(quarterCol);
    });

    it('falls through quarter resolution to the year column for ranges over five years', () => {
      const monthCol = makeCol('month', 'ref-month', CaseDbColType.TIME_MONTH);
      const quarterCol = makeCol('quarter', 'ref-quarter', CaseDbColType.TIME_QUARTER);
      const yearCol = makeCol('year', 'ref-year', CaseDbColType.TIME_YEAR);
      const completeCaseType = makeCompleteCaseType([
        { colType: CaseDbColType.TIME_MONTH, id: 'ref-month' },
        { colType: CaseDbColType.TIME_QUARTER, id: 'ref-quarter' },
        { colType: CaseDbColType.TIME_YEAR, id: 'ref-year' },
      ]);
      const cases = [
        { content: { month: '2018-01-01', quarter: '2018-Q1', year: '2018' }, id: 'first' } as unknown as CaseDbCase,
        { content: { month: '2024-01-01', quarter: '2024-Q1', year: '2024' }, id: 'last' } as unknown as CaseDbCase,
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [monthCol, quarterCol, yearCol])).toBe(yearCol);
    });

    it('falls back to the highest-ranked column when no time resolution matches', () => {
      const textCol = makeCol('text', 'ref-text', CaseDbColType.TEXT);
      const completeCaseType = {
        ref_cols: {
          'ref-text': { col_type: CaseDbColType.TEXT, rank: 1 },
        },
      } as unknown as CaseDbCompleteCaseType;
      const cases = [
        makeCase('first', 'text', '2018-01-01'),
        makeCase('last', 'text', '2024-01-01'),
      ];

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [textCol])).toBe(textCol);
    });

    it('returns null when the fallback selector finds no column', () => {
      const textCol = makeCol('text', 'ref-text', CaseDbColType.TEXT);
      const completeCaseType = makeCompleteCaseType([{ colType: CaseDbColType.TEXT, id: 'ref-text' }]);
      const cases = [
        makeCase('first', 'text', '2018-01-01'),
        makeCase('last', 'text', '2024-01-01'),
      ];
      vi.spyOn(CaseTypeUtil, 'getPreferredColInDimHavingHighestRank').mockReturnValue(undefined);

      expect(EpiCurveUtil.getPreferredTimeColumn(completeCaseType, cases, [textCol])).toBeNull();
    });
  });

  describe('xAxis helpers', () => {
    it('builds day intervals and labels', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-03T00:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
      ];

      const intervals = EpiCurveUtil.getXAxisIntervals(CaseDbColType.TIME_DAY, items);
      expect(intervals).toHaveLength(3);
      expect(EpiCurveUtil.getXAxisLabel(CaseDbColType.TIME_DAY, intervals[0])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it.each([
      CaseDbColType.TIME_MONTH,
      CaseDbColType.TIME_QUARTER,
      CaseDbColType.TIME_WEEK,
      CaseDbColType.TIME_YEAR,
    ])('builds intervals and labels for %s', (colType) => {
      const date = new Date('2024-01-01T00:00:00Z');
      const items: EpiCurveChartItem[] = [{ date, row: { id: 'case-1' } as CaseDbCase, value: 1 }];

      const intervals = EpiCurveUtil.getXAxisIntervals(colType, items);

      expect(intervals).toHaveLength(1);
      expect(EpiCurveUtil.getXAxisLabel(colType, date)).toBeTruthy();
    });

    it('returns no intervals when there are no chart items', () => {
      expect(EpiCurveUtil.getXAxisIntervals(CaseDbColType.TIME_DAY, [])).toEqual([]);
    });

    it('throws on unknown col type for interval and label', () => {
      const unknownType = 'UNKNOWN' as unknown as CaseDbColType;
      const items: EpiCurveChartItem[] = [{ date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 }];

      expect(() => EpiCurveUtil.getXAxisIntervals(unknownType, items)).toThrow('unknown col_type UNKNOWN');
      expect(() => EpiCurveUtil.getXAxisLabel(unknownType, new Date('2024-01-01T00:00:00Z'))).toThrow('unknown col_type UNKNOWN');
    });
  });
});
