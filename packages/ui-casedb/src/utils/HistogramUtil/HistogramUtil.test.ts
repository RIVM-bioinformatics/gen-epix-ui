import {
  afterEach,
  beforeEach,
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
  CaseDbConcept,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { ConfigService } from '@gen-epix/ui';

import { DataService } from '../../classes/services/DataService';
import type { CaseDbConfig } from '../../models/config';
import { STRATIFICATION_MODE } from '../../models/stratification';
import { StratificationUtil } from '../StratificationUtil';
import type { DataCache } from '../../models/caseDb';

import {
  HISTOGRAM_ALLOWED_COL_TYPES,
  HistogramUtil,
} from './HistogramUtil';
import type { SeriesItem } from './HistogramUtil';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCol = (
  id: string,
  refColId: string,
  dimId = 'dim1',
  label = id,
): CaseDbCol =>
  ({ dim_id: dimId, id, label, ref_col_id: refColId }) as unknown as CaseDbCol;

const makeRefCol = (
  colType: CaseDbColType,
  conceptSetId?: string,
): CaseDbCompleteCaseType['ref_cols'][string] =>
  ({ col_type: colType, concept_set_id: conceptSetId }) as unknown as CaseDbCompleteCaseType['ref_cols'][string];

const makeCase = (
  id: string,
  colAId: string,
  colAValue: string,
  colBId: string,
  colBValue: string,
  count?: number,
): CaseDbCase =>
  ({
    content: { [colAId]: colAValue, [colBId]: colBValue },
    count,
    id,
  }) as unknown as CaseDbCase;

const makeConcept = (id: string, rank: number, name = `Name ${id}`, conceptSetId = 'setA'): CaseDbConcept =>
  ({ code: id.toUpperCase(), concept_set_id: conceptSetId, id, name, rank });

const makeCompleteCaseType = (
  cols: CaseDbCol[],
  refColsMap: Record<string, ReturnType<typeof makeRefCol>>,
  orderedDimIds: string[] = [],
): CaseDbCompleteCaseType => {
  const colsById = Object.fromEntries(cols.map(c => [c.id, c]));
  return {
    cols: colsById,
    ordered_col_ids: cols.map(c => c.id),
    ordered_dim_ids: orderedDimIds,
    ref_cols: refColsMap,
  } as unknown as CaseDbCompleteCaseType;
};

// ---------------------------------------------------------------------------
// DataService setup
// ---------------------------------------------------------------------------

let savedData: DataCache;

beforeEach(() => {
  savedData = { ...DataService.getInstance().data };
  DataService.getInstance().data.conceptsIdsBySetId = {};
  DataService.getInstance().data.conceptsById = {};
});

afterEach(() => {
  Object.assign(DataService.getInstance().data, savedData);
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HistogramUtil', () => {
  describe('HISTOGRAM_ALLOWED_COL_TYPES', () => {
    it('contains INTERVAL, NOMINAL and ORDINAL', () => {
      expect(HISTOGRAM_ALLOWED_COL_TYPES).toContain(CaseDbColType.INTERVAL);
      expect(HISTOGRAM_ALLOWED_COL_TYPES).toContain(CaseDbColType.NOMINAL);
      expect(HISTOGRAM_ALLOWED_COL_TYPES).toContain(CaseDbColType.ORDINAL);
      expect(HISTOGRAM_ALLOWED_COL_TYPES).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  describe('getAllowedCols', () => {
    const MAX = ConfigService.getInstance<CaseDbConfig>().config.epi.STRATIFICATION.MAX_ALLOWED_UNIQUE_VALUES;

    const populateConcepts = (setId: string, count: number) => {
      const ids = Array.from({ length: count }, (_, i) => `${setId}_c${i}`);
      DataService.getInstance().data.conceptsIdsBySetId[setId] = ids;
      ids.forEach(id => {
        DataService.getInstance().data.conceptsById[id] = makeConcept(id, 0, id, setId);
      });
    };

    it('returns empty array when completeCaseType is null', () => {
      expect(HistogramUtil.getAllowedCols(null, HISTOGRAM_ALLOWED_COL_TYPES)).toEqual([]);
    });

    it('returns only cols whose refCol col_type is in allowedColTypes', () => {
      const nominalCol = makeCol('col1', 'ref1');
      const timeCol = makeCol('col2', 'ref2');
      const ordinalCol = makeCol('col3', 'ref3');
      populateConcepts('setNominal', 1);
      populateConcepts('setOrdinal', 1);
      const cct = makeCompleteCaseType(
        [nominalCol, timeCol, ordinalCol],
        {
          ref1: makeRefCol(CaseDbColType.NOMINAL, 'setNominal'),
          ref2: makeRefCol(CaseDbColType.TIME_DAY),
          ref3: makeRefCol(CaseDbColType.ORDINAL, 'setOrdinal'),
        },
      );

      const result = HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES);
      expect(result.map(c => c.id)).toEqual(['col1', 'col3']);
    });

    it('returns empty array when no cols match', () => {
      const timeCol = makeCol('col1', 'ref1');
      const cct = makeCompleteCaseType(
        [timeCol],
        { ref1: makeRefCol(CaseDbColType.TIME_WEEK) },
      );
      expect(HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES)).toEqual([]);
    });

    it('preserves ordered_col_ids ordering', () => {
      const col1 = makeCol('c1', 'r1');
      const col2 = makeCol('c2', 'r2');
      const col3 = makeCol('c3', 'r3');
      populateConcepts('s1', 1);
      populateConcepts('s2', 1);
      populateConcepts('s3', 1);
      const cct = makeCompleteCaseType(
        [col1, col2, col3],
        {
          r1: makeRefCol(CaseDbColType.INTERVAL, 's1'),
          r2: makeRefCol(CaseDbColType.NOMINAL, 's2'),
          r3: makeRefCol(CaseDbColType.ORDINAL, 's3'),
        },
      );
      const result = HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES);
      expect(result.map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
    });

    it('excludes cols whose concept count exceeds MAX_ALLOWED_UNIQUE_VALUES', () => {
      const withinCol = makeCol('within', 'rWithin');
      const exceedsCol = makeCol('exceeds', 'rExceeds');
      populateConcepts('setWithin', MAX);
      populateConcepts('setExceeds', MAX + 1);
      const cct = makeCompleteCaseType(
        [withinCol, exceedsCol],
        {
          rExceeds: makeRefCol(CaseDbColType.NOMINAL, 'setExceeds'),
          rWithin: makeRefCol(CaseDbColType.NOMINAL, 'setWithin'),
        },
      );
      const result = HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES);
      expect(result.map(c => c.id)).toEqual(['within']);
    });

    it('includes cols whose concept count equals MAX_ALLOWED_UNIQUE_VALUES', () => {
      const col = makeCol('exact', 'rExact');
      populateConcepts('setExact', MAX);
      const cct = makeCompleteCaseType(
        [col],
        { rExact: makeRefCol(CaseDbColType.NOMINAL, 'setExact') },
      );
      expect(HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES).map(c => c.id)).toEqual(['exact']);
    });

    it('includes cols with an empty concept set (0 concepts)', () => {
      const col = makeCol('empty', 'rEmpty');
      // no concepts registered → getConceptsForCol returns []
      const cct = makeCompleteCaseType(
        [col],
        { rEmpty: makeRefCol(CaseDbColType.NOMINAL, 'setEmpty') },
      );
      expect(HistogramUtil.getAllowedCols(cct, HISTOGRAM_ALLOWED_COL_TYPES).map(c => c.id)).toEqual(['empty']);
    });
  });

  // -------------------------------------------------------------------------
  describe('getConceptsForCol', () => {
    it('returns sorted concepts for the given col', () => {
      const col = makeCol('c1', 'r1');
      const cct = makeCompleteCaseType([col], { r1: makeRefCol(CaseDbColType.NOMINAL, 'setX') });
      const c1 = makeConcept('x1', 3, 'X1', 'setX');
      const c2 = makeConcept('x2', 1, 'X2', 'setX');
      const c3 = makeConcept('x3', 2, 'X3', 'setX');
      DataService.getInstance().data.conceptsIdsBySetId['setX'] = ['x1', 'x2', 'x3'];
      DataService.getInstance().data.conceptsById['x1'] = c1;
      DataService.getInstance().data.conceptsById['x2'] = c2;
      DataService.getInstance().data.conceptsById['x3'] = c3;

      const result = HistogramUtil.getConceptsForCol(col, cct);
      expect(result.map(c => c.id)).toEqual(['x2', 'x3', 'x1']);
    });

    it('returns empty array when the concept set has no entries', () => {
      const col = makeCol('c1', 'r1');
      const cct = makeCompleteCaseType([col], { r1: makeRefCol(CaseDbColType.NOMINAL, 'setY') });
      // no entries in conceptsIdsBySetId
      expect(HistogramUtil.getConceptsForCol(col, cct)).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('getDefaultCols', () => {
    it('returns null when allowedCols is empty', () => {
      const cct = makeCompleteCaseType([], {}, ['dim1', 'dim2']);
      expect(HistogramUtil.getDefaultCols([], cct)).toBeNull();
    });

    it('returns null when there is only one dimension with cols', () => {
      const col = makeCol('c1', 'r1', 'dim1');
      const cct = makeCompleteCaseType([col], { r1: makeRefCol(CaseDbColType.NOMINAL) }, ['dim1']);
      expect(HistogramUtil.getDefaultCols([col], cct)).toBeNull();
    });

    it('returns null when second dimension has no cols', () => {
      const col1 = makeCol('c1', 'r1', 'dim1');
      const cct = makeCompleteCaseType(
        [col1],
        { r1: makeRefCol(CaseDbColType.NOMINAL) },
        ['dim1', 'dim2'],
      );
      expect(HistogramUtil.getDefaultCols([col1], cct)).toBeNull();
    });

    it('returns first col of second dim as newColA and last col of first dim as newColB', () => {
      const d1c1 = makeCol('d1c1', 'r1', 'dim1');
      const d1c2 = makeCol('d1c2', 'r2', 'dim1');
      const d2c1 = makeCol('d2c1', 'r3', 'dim2');
      const d2c2 = makeCol('d2c2', 'r4', 'dim2');
      const refColsMap = {
        r1: makeRefCol(CaseDbColType.NOMINAL),
        r2: makeRefCol(CaseDbColType.NOMINAL),
        r3: makeRefCol(CaseDbColType.ORDINAL),
        r4: makeRefCol(CaseDbColType.ORDINAL),
      };
      const cct = makeCompleteCaseType([d1c1, d1c2, d2c1, d2c2], refColsMap, ['dim1', 'dim2']);
      const result = HistogramUtil.getDefaultCols([d1c1, d1c2, d2c1, d2c2], cct);

      expect(result).not.toBeNull();
      // newColA = first of second dimension (dim2)
      expect(result.newColA.id).toBe('d2c1');
      // newColB = last of first dimension (dim1)
      expect(result.newColB.id).toBe('d1c2');
    });

    it('ignores dim ids that have no cols in allowedCols', () => {
      // Only dim2 has cols in allowedCols; dim1 has none → insufficient → null
      const d2c1 = makeCol('d2c1', 'r1', 'dim2');
      const refColsMap = { r1: makeRefCol(CaseDbColType.NOMINAL) };
      const cct = makeCompleteCaseType([d2c1], refColsMap, ['dim1', 'dim2']);
      expect(HistogramUtil.getDefaultCols([d2c1], cct)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('getConcepts', () => {
    it('returns two empty arrays when aCol is null', () => {
      const bCol = makeCol('b', 'rb');
      const cct = makeCompleteCaseType([bCol], { rb: makeRefCol(CaseDbColType.NOMINAL, 'setB') });
      expect(HistogramUtil.getConcepts(null, bCol, cct)).toEqual([[], []]);
    });

    it('returns two empty arrays when bCol is null', () => {
      const aCol = makeCol('a', 'ra');
      const cct = makeCompleteCaseType([aCol], { ra: makeRefCol(CaseDbColType.NOMINAL, 'setA') });
      expect(HistogramUtil.getConcepts(aCol, null, cct)).toEqual([[], []]);
    });

    it('returns two empty arrays when completeCaseType is null', () => {
      const aCol = makeCol('a', 'ra');
      const bCol = makeCol('b', 'rb');
      expect(HistogramUtil.getConcepts(aCol, bCol, null)).toEqual([[], []]);
    });

    it('returns sorted concepts for both cols', () => {
      const aCol = makeCol('a', 'ra');
      const bCol = makeCol('b', 'rb');
      const cct = makeCompleteCaseType(
        [aCol, bCol],
        {
          ra: makeRefCol(CaseDbColType.NOMINAL, 'setA'),
          rb: makeRefCol(CaseDbColType.ORDINAL, 'setB'),
        },
      );

      const conceptA1 = makeConcept('a1', 2, 'Concept A1', 'setA');
      const conceptA2 = makeConcept('a2', 1, 'Concept A2', 'setA');
      const conceptB1 = makeConcept('b1', 3, 'Concept B1', 'setB');
      const conceptB2 = makeConcept('b2', 1, 'Concept B2', 'setB');

      DataService.getInstance().data.conceptsIdsBySetId['setA'] = ['a1', 'a2'];
      DataService.getInstance().data.conceptsIdsBySetId['setB'] = ['b1', 'b2'];
      DataService.getInstance().data.conceptsById['a1'] = conceptA1;
      DataService.getInstance().data.conceptsById['a2'] = conceptA2;
      DataService.getInstance().data.conceptsById['b1'] = conceptB1;
      DataService.getInstance().data.conceptsById['b2'] = conceptB2;

      const [conceptsA, conceptsB] = HistogramUtil.getConcepts(aCol, bCol, cct);

      // sorted by rank ascending
      expect(conceptsA.map(c => c.id)).toEqual(['a2', 'a1']);
      expect(conceptsB.map(c => c.id)).toEqual(['b2', 'b1']);
    });

    it('returns empty arrays when concept set has no entries', () => {
      const aCol = makeCol('a', 'ra');
      const bCol = makeCol('b', 'rb');
      const cct = makeCompleteCaseType(
        [aCol, bCol],
        {
          ra: makeRefCol(CaseDbColType.NOMINAL, 'setA'),
          rb: makeRefCol(CaseDbColType.ORDINAL, 'setB'),
        },
      );
      // conceptsIdsBySetId left empty

      const [conceptsA, conceptsB] = HistogramUtil.getConcepts(aCol, bCol, cct);
      expect(conceptsA).toEqual([]);
      expect(conceptsB).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('getSeries', () => {
    const aCol = makeCol('colA', 'rA');
    const bCol = makeCol('colB', 'rB');

    const conceptA1 = makeConcept('a1', 1, 'A1', 'setA');
    const conceptA2 = makeConcept('a2', 2, 'A2', 'setA');
    const conceptB1 = makeConcept('b1', 1, 'B1', 'setB');
    const conceptB2 = makeConcept('b2', 2, 'B2', 'setB');

    const cct = makeCompleteCaseType(
      [aCol, bCol],
      {
        rA: makeRefCol(CaseDbColType.NOMINAL, 'setA'),
        rB: makeRefCol(CaseDbColType.ORDINAL, 'setB'),
      },
    );

    beforeEach(() => {
      DataService.getInstance().data.conceptsById['a1'] = conceptA1;
      DataService.getInstance().data.conceptsById['a2'] = conceptA2;
      DataService.getInstance().data.conceptsById['b1'] = conceptB1;
      DataService.getInstance().data.conceptsById['b2'] = conceptB2;
    });

    it('returns empty array when aCol is null', () => {
      expect(HistogramUtil.getSeries(null, bCol, cct, [], [conceptA1], [conceptB1])).toEqual([]);
    });

    it('returns empty array when bCol is null', () => {
      expect(HistogramUtil.getSeries(aCol, null, cct, [], [conceptA1], [conceptB1])).toEqual([]);
    });

    it('returns empty array when completeCaseType is null', () => {
      expect(HistogramUtil.getSeries(aCol, bCol, null, [], [conceptA1], [conceptB1])).toEqual([]);
    });

    it('counts cases correctly and groups by conceptA x conceptB', () => {
      const cases: CaseDbCase[] = [
        makeCase('c1', 'colA', 'a1', 'colB', 'b1'),
        makeCase('c2', 'colA', 'a1', 'colB', 'b2'),
        makeCase('c3', 'colA', 'a2', 'colB', 'b1'),
        makeCase('c4', 'colA', 'a1', 'colB', 'b1'),
      ];

      const result = HistogramUtil.getSeries(
        aCol, bCol, cct, cases, [conceptA1, conceptA2], [conceptB1, conceptB2],
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('A1');
      expect(result[0].type).toBe('bar');
      // a1/b1 = 2 cases, a1/b2 = 1 case
      expect(result[0].data).toEqual([2, 1]);
      expect(result[0].xCaseIds).toEqual([['c1', 'c4'], ['c2']]);
      // a2/b1 = 1 case, a2/b2 = 0
      expect(result[1].data).toEqual([1, 0]);
      expect(result[1].xCaseIds).toEqual([['c3'], []]);
    });

    it('respects the count field on cases', () => {
      const cases: CaseDbCase[] = [
        makeCase('c1', 'colA', 'a1', 'colB', 'b1', 5),
        makeCase('c2', 'colA', 'a1', 'colB', 'b1', 3),
      ];

      const result = HistogramUtil.getSeries(
        aCol, bCol, cct, cases, [conceptA1], [conceptB1],
      );

      expect(result[0].data[0]).toBe(8);
    });

    it('uses count=1 when case.count is null', () => {
      const cases: CaseDbCase[] = [
        makeCase('c1', 'colA', 'a1', 'colB', 'b1', null),
      ];

      const result = HistogramUtil.getSeries(
        aCol, bCol, cct, cases, [conceptA1], [conceptB1],
      );

      expect(result[0].data[0]).toBe(1);
    });

    it('skips cases where the aCol value is missing', () => {
      const caseWithMissingA: CaseDbCase = {
        content: { colB: 'b1' }, // colA missing
        count: null,
        id: 'missing',
      } as unknown as CaseDbCase;

      const result = HistogramUtil.getSeries(
        aCol, bCol, cct, [caseWithMissingA], [conceptA1], [conceptB1],
      );
      expect(result[0].data[0]).toBe(0);
      expect(result[0].xCaseIds).toEqual([[]]);
    });

    it('skips cases where the bCol value is missing', () => {
      const caseWithMissingB: CaseDbCase = {
        content: { colA: 'a1' }, // colB missing
        count: null,
        id: 'missing',
      } as unknown as CaseDbCase;

      const result = HistogramUtil.getSeries(
        aCol, bCol, cct, [caseWithMissingB], [conceptA1], [conceptB1],
      );
      expect(result[0].data[0]).toBe(0);
      expect(result[0].xCaseIds).toEqual([[]]);
    });
  });

  // -------------------------------------------------------------------------
  describe('getCaseCount', () => {
    it('returns 0 for empty series', () => {
      expect(HistogramUtil.getCaseCount([])).toBe(0);
    });

    it('returns 0 for null/undefined series', () => {
      expect(HistogramUtil.getCaseCount(null)).toBe(0);
    });

    it('sums numeric values across all series and all data points', () => {
      const series: SeriesItem[] = [
        { data: [1, 2, 3], emphasis: { focus: 'self' }, name: 'A', type: 'bar', xCaseIds: [] },
        { data: [4, 5], emphasis: { focus: 'self' }, name: 'B', type: 'bar', xCaseIds: [] },
      ];
      expect(HistogramUtil.getCaseCount(series)).toBe(15);
    });

    it('ignores non-numeric (string) data points', () => {
      const series: SeriesItem[] = [
        { data: [1, 'N/A', 2], emphasis: { focus: 'self' }, name: 'A', type: 'bar', xCaseIds: [] },
      ];
      expect(HistogramUtil.getCaseCount(series)).toBe(3);
    });

    it('handles series with all-zero data', () => {
      const series: SeriesItem[] = [
        { data: [0, 0, 0], emphasis: { focus: 'self' }, name: 'A', type: 'bar', xCaseIds: [] },
      ];
      expect(HistogramUtil.getCaseCount(series)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('getColors', () => {
    it('returns empty array when stratification returns null', () => {
      vi.spyOn(StratificationUtil, 'getStratification').mockReturnValue(null);
      const result = HistogramUtil.getColors(null, null, []);
      expect(result).toEqual([]);
    });

    it('returns colors from stratification legendaItems', () => {
      vi.spyOn(StratificationUtil, 'getStratification').mockReturnValue({
        caseIdColors: {},
        colorForIsMissing: '#ccc',
        legendaItems: [
          { caseIds: [], color: '#ff0000', rowValue: { full: 'A', long: 'A', raw: 'a', short: 'A' } },
          { caseIds: [], color: '#00ff00', rowValue: { full: 'B', long: 'B', raw: 'b', short: 'B' } },
        ],
        mode: STRATIFICATION_MODE.FIELD,
      });
      const aCol = makeCol('a', 'ra');
      const result = HistogramUtil.getColors(aCol, null, []);
      expect(result).toEqual(['#ff0000', '#00ff00']);
    });
  });

  // -------------------------------------------------------------------------
  describe('getColValuesFromPayload', () => {
    const conceptsA = [makeConcept('a1', 1, 'Concept A1'), makeConcept('a2', 2, 'Concept A2')];
    const conceptsB = [makeConcept('b1', 1, 'Concept B1'), makeConcept('b2', 2, 'Concept B2')];

    it('returns concept ids for an item payload', () => {
      const result = HistogramUtil.getColValuesFromPayload(
        { name: 'Concept B2', seriesName: 'Concept A1' },
        conceptsA,
        conceptsB,
      );

      expect(result).toEqual({ a: 'a1', b: 'b2' });
    });

    it('returns null when either concept cannot be found', () => {
      expect(HistogramUtil.getColValuesFromPayload(
        { name: 'Concept B2', seriesName: 'Unknown' },
        conceptsA,
        conceptsB,
      )).toBeNull();
      expect(HistogramUtil.getColValuesFromPayload(
        { name: 'Unknown', seriesName: 'Concept A1' },
        conceptsA,
        conceptsB,
      )).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('getChartOptions', () => {
    const mockT = (key: string, opts?: Record<string, unknown>) => {
      if (opts) {
        return Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, v !== null && v !== undefined ? String(v as boolean | number | string) : ''),
          key,
        );
      }
      return key;
    };

    const mockTheme = {
      palette: {
        primary: { main: '#0000ff' },
        text: { disabled: '#aaaaaa' },
      },
      spacing: (n: number) => `${n * 8}px`,
      typography: {
        caption: { fontSize: 12 },
      },
    } as unknown as Theme;

    const aCol = makeCol('colA', 'rA', 'dim1', 'Label A');
    const bCol = makeCol('colB', 'rB', 'dim1', 'Label B');

    const conceptA1 = makeConcept('a1', 1, 'Concept A1');
    const conceptB1 = makeConcept('b1', 1, 'Concept B1');

    const series: SeriesItem[] = [
      { data: [3], emphasis: { focus: 'self' }, name: 'Concept A1', type: 'bar', xCaseIds: [] },
    ];

    const baseParams = {
      aCol,
      bCol,
      colors: ['#ff0000'],
      conceptsA: [conceptA1],
      conceptsB: [conceptB1],
      series,
      t: mockT,
      theme: mockTheme,
    };

    it('returns a valid EChartsOption object', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      expect(opts).toBeDefined();
      expect(opts.series).toBe(series);
      expect(opts.color).toEqual(['#ff0000']);
    });

    it('sets title.text to aCol.label', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      expect((opts.title as { text: string }).text).toBe('Label A');
    });

    it('sets xAxis data from conceptsB names', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      const xAxis = (opts.xAxis as Array<{ data: string[] }>)[0];
      expect(xAxis.data).toEqual(['Concept B1']);
    });

    it('sets legend data from conceptsA names', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      const legend = opts.legend as { data: string[]; selectedMode: boolean };
      expect(legend.data).toEqual(['Concept A1']);
      expect(legend.selectedMode).toBe(false);
    });

    it('keeps bar emphasis enabled for external highlight actions', () => {
      const result = HistogramUtil.getSeries(
        aCol,
        bCol,
        makeCompleteCaseType([aCol, bCol], {
          rA: makeRefCol(CaseDbColType.NOMINAL),
          rB: makeRefCol(CaseDbColType.NOMINAL),
        }),
        [],
        [conceptA1],
        [conceptB1],
      );
      expect(result[0].emphasis).toEqual({ focus: 'self' });
    });

    it('configures tooltip for item payloads', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      const tooltip = opts.tooltip as { renderMode: string; trigger: string };
      expect(tooltip.renderMode).toBe('richText');
      expect(tooltip.trigger).toBe('item');
    });

    it('tooltip formatter builds text for item params', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      const tooltip = opts.tooltip as { formatter: (p: unknown) => string };
      const params = {
        marker: '<span style="color:#f00">●</span>',
        name: 'Concept B1',
        seriesName: 'Concept A1',
        value: 3,
      };
      const text = tooltip.formatter(params);
      expect(text).toBe('Concept B1 (Label B)\nConcept A1: 3 (Label A)');
    });

    it('valueFormatter returns translated string', () => {
      const opts = HistogramUtil.getChartOptions(baseParams);
      const tooltip = opts.tooltip as { valueFormatter: (v: unknown) => string };
      expect(tooltip.valueFormatter(5)).toBe('5 case(s)');
    });
  });
});
