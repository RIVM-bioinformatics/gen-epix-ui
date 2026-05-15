import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { ConfigManager } from '@gen-epix/ui';

import { STRATIFICATION_MODE } from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';

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
  beforeAll(() => {
    vi.spyOn(ConfigManager.getInstance<CaseDbConfig>(), 'config', 'get').mockReturnValue({
      epi: {
        STRATIFICATION_COLORS: ['#ff0000', '#00ff00', '#0000ff'],
      },
    } as CaseDbConfig);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('getStratificationColors', () => {
    it('returns stratification colors from ConfigManager', () => {
      expect(EpiCurveUtil.getStratificationColors()).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });
  });

  describe('getBarChartItemsWithinInterval', () => {
    it('includes values in [interval, nextInterval) and excludes nextInterval boundary', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-01T12:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'c' } as CaseDbCase, value: 1 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      ];

      const firstBucket = EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, 0);
      const secondBucket = EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, 1);

      expect(firstBucket.map(x => x.row.id)).toEqual(['a', 'b']);
      expect(secondBucket.map(x => x.row.id)).toEqual(['c']);
    });
  });

  describe('getItemsWithinInterval', () => {
    it('matches getBarChartItemsWithinInterval for backward compatibility', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 },
      ];
      const intervals = [new Date('2024-01-01T00:00:00Z')];

      expect(EpiCurveUtil.getItemsWithinInterval(items, intervals, 0)).toEqual(
        EpiCurveUtil.getBarChartItemsWithinInterval(items, intervals, 0),
      );
    });
  });

  describe('getBarChartSeriesData', () => {
    it('creates a single non-stratified bar series and computes max', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-01T06:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
        { date: new Date('2024-01-02T00:00:00Z'), row: { id: 'c' } as CaseDbCase, value: 5 },
      ];
      const intervals = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      ];

      const result = EpiCurveUtil.getBarChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), null);

      expect(result.max).toBe(5);
      expect(result.series).toHaveLength(1);

      const firstSeries = (result.series as Array<{ color: string; data: Array<[string, number, string]>; name: string }>)[0];
      expect(firstSeries.color).toBe('#ff0000');
      expect(firstSeries.name).toBe('');
      expect(firstSeries.data).toEqual([
        ['2024-01-01', 3, JSON.stringify(['a', 'b'])],
        ['2024-01-02', 5, JSON.stringify(['c'])],
      ]);
    });

    it('creates stratified bar series with correct per-color values', () => {
      const items: EpiCurveChartItem[] = [
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 2 },
        { date: new Date('2024-01-01T00:00:00Z'), row: { id: 'b' } as CaseDbCase, value: 1 },
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

      const result = EpiCurveUtil.getBarChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), stratification);

      expect(result.max).toBe(3);
      const series = result.series as Array<{ data: Array<[string, number, string]>; name: string }>;
      expect(series).toHaveLength(2);
      expect(series[0].name).toBe('Red');
      expect(series[0].data).toEqual([
        ['2024-01-01', 2, JSON.stringify(['a'])],
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
  });

  describe('getAreaChartSeriesData', () => {
    it('includes line stack settings and triggerLineEvent', () => {
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
      const series = result.series as Array<{ data: unknown[]; stack: string; triggerLineEvent: boolean; type: string }>;
      expect(series).toHaveLength(2);
      expect(series[0].type).toBe('line');
      expect(series[0].stack).toBe('total');
      expect(series[0].triggerLineEvent).toBe(true);
      expect(series[0].data).toHaveLength(1);
    });

    it('returns null series when stratification is missing', () => {
      const result = EpiCurveUtil.getAreaChartSeriesData([], [], () => '', true, null);
      expect(result).toEqual({
        max: 100,
        series: null,
      });
    });

    it('filters missing-value series when showMissingValues is false', () => {
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
            caseIds: ['a'],
            color: '#red',
            rowValue: {
              full: 'Red',
              long: 'Red',
              raw: 'Red',
              short: 'Red',
            },
          },
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
        ],
        mode: STRATIFICATION_MODE.FIELD,
      };

      const withMissing = EpiCurveUtil.getAreaChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), true, stratification);
      const withoutMissing = EpiCurveUtil.getAreaChartSeriesData(items, intervals, d => d.toISOString().slice(0, 10), false, stratification);

      expect(withMissing.series).toHaveLength(2);
      expect(withoutMissing.series).toHaveLength(1);
      expect(((withoutMissing.series as Array<{ name: string }>)[0]).name).toBe('Red');
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

    it('throws on unknown col type for interval and label', () => {
      const unknownType = 'UNKNOWN' as unknown as CaseDbColType;
      const items: EpiCurveChartItem[] = [{ date: new Date('2024-01-01T00:00:00Z'), row: { id: 'a' } as CaseDbCase, value: 1 }];

      expect(() => EpiCurveUtil.getXAxisIntervals(unknownType, items)).toThrow('unknown col_type UNKNOWN');
      expect(() => EpiCurveUtil.getXAxisLabel(unknownType, new Date('2024-01-01T00:00:00Z'))).toThrow('unknown col_type UNKNOWN');
    });
  });
});
