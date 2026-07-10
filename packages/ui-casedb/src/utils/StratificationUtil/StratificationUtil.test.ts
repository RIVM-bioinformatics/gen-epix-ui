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
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SIMILAR_CASE,
} from '../../models/stratification';
import type { DataCache } from '../../models/caseDb';

import { StratificationUtil } from './StratificationUtil';

const makeCol = (id: string, refColId: string, label = id, dimId = 'dim1'): CaseDbCol =>
  ({ dim_id: dimId, id, label, ref_col_id: refColId }) as unknown as CaseDbCol;

const makeRefCol = (colType: CaseDbColType, conceptSetId?: string) =>
  ({ col_type: colType, concept_set_id: conceptSetId }) as unknown as CaseDbCompleteCaseType['ref_cols'][string];

const makeCase = (id: string, colId: string, value?: string): CaseDbCase =>
  ({ content: value !== undefined ? { [colId]: value } : {}, id }) as unknown as CaseDbCase;

const makeCompleteCaseType = (
  cols: CaseDbCol[],
  refCols: CaseDbCompleteCaseType['ref_cols'],
  dims: CaseDbCompleteCaseType['dims'] = { dim1: { id: 'dim1' } } as unknown as CaseDbCompleteCaseType['dims'],
): CaseDbCompleteCaseType => {
  const colsMap = Object.fromEntries(cols.map(c => [c.id, c]));
  const orderedColIds = cols.map(c => c.id);
  return { cols: colsMap, dims, ordered_col_ids: orderedColIds, ref_cols: refCols } as unknown as CaseDbCompleteCaseType;
};

const makeConcept = (
  id: string,
  rank: number,
  props: CaseDbConcept['props'],
  conceptSetId = 'set1',
): CaseDbConcept =>
  ({ code: id.toUpperCase(), concept_set_id: conceptSetId, id, name: `Name ${id}`, props, rank });

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

const getStratificationConfig = () =>
  ConfigService.getInstance<CaseDbConfig>().config.epi.STRATIFICATION;

describe('StratificationUtil', () => {
  // -------------------------------------------------------------------------
  describe('getEchartsColors', () => {
    it('returns an array with the primary colour when stratification is null', () => {
      const theme = { palette: { primary: { main: '#123456' } } } as unknown as Theme;
      expect(StratificationUtil.getEchartsColors(null, theme)).toEqual(['#123456']);
    });

    it('maps legendaItems to their colours', () => {
      const theme = { palette: { primary: { main: '#000' } } } as unknown as Theme;
      const stratification = {
        legendaItems: [
          { color: '#aaa', rowValue: { raw: 'a' } },
          { color: '#bbb', rowValue: { raw: 'b' } },
        ],
      } as ReturnType<typeof StratificationUtil.getStratification>;
      expect(StratificationUtil.getEchartsColors(stratification, theme)).toEqual(['#aaa', '#bbb']);
    });

    it('returns empty array when legendaItems is undefined', () => {
      const theme = { palette: { primary: { main: '#000' } } } as unknown as Theme;
      const stratification = {} as ReturnType<typeof StratificationUtil.getStratification>;
      expect(StratificationUtil.getEchartsColors(stratification, theme)).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('getStratification', () => {
    it('returns null when mode is falsy', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      expect(StratificationUtil.getStratification({
        col,
        completeCaseType: cct,
        mode: null,
        sortedData: [],
      })).toBeNull();
    });

    it('returns null for SELECTION mode when selectedIds is not provided', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      expect(StratificationUtil.getStratification({
        col,
        completeCaseType: cct,
        mode: STRATIFICATION_MODE.SELECTION,
        sortedData: [],
      })).toBeNull();
    });

    it('returns null for SIMILAR_CASES mode when similarCaseIds is not provided', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      expect(StratificationUtil.getStratification({
        col,
        completeCaseType: cct,
        mode: STRATIFICATION_MODE.SIMILAR_CASES,
        sortedData: [],
      })).toBeNull();
    });

    it('returns null for FIELD mode when col is not provided', () => {
      const cct = makeCompleteCaseType([], {});
      expect(StratificationUtil.getStratification({
        completeCaseType: cct,
        mode: STRATIFICATION_MODE.FIELD,
        sortedData: [],
      })).toBeNull();
    });

    it('returns a stratification object for FIELD mode when col is provided', () => {
      const col = makeCol('c', 'rc', 'My Col');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'val1'), makeCase('r2', 'c', 'val2')];
      const result = StratificationUtil.getStratification({
        col,
        completeCaseType: cct,
        mode: STRATIFICATION_MODE.FIELD,
        sortedData: cases,
      });
      expect(result).not.toBeNull();
      expect(result.mode).toBe(STRATIFICATION_MODE.FIELD);
      expect(result.col).toBe(col);
    });

    it('returns a stratification object for SELECTION mode when selectedIds is provided', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'v1'), makeCase('r2', 'c', 'v2')];
      const result = StratificationUtil.getStratification({
        col,
        completeCaseType: cct,
        mode: STRATIFICATION_MODE.SELECTION,
        selectedIds: ['r1'],
        sortedData: cases,
      });
      expect(result).not.toBeNull();
      expect(result.mode).toBe(STRATIFICATION_MODE.SELECTION);
    });
  });

  // -------------------------------------------------------------------------
  describe('getStratifyableColumns', () => {
    const { ALLOWED_COL_TYPES, MAX_ALLOWED_UNIQUE_VALUES } = getStratificationConfig();

    it('excludes columns with non-allowed col types', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.GENETIC_SEQUENCE) });
      const result = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data: [] });
      expect(result).toHaveLength(0);
    });

    it('includes columns with allowed col types', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(ALLOWED_COL_TYPES[0]) });
      const data = [makeCase('r1', 'c', 'v1'), makeCase('r2', 'c', 'v2')];
      const result = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result).toHaveLength(1);
    });

    it('marks a column as disabled when there is only 1 unique non-empty value', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const data = [makeCase('r1', 'c', 'same'), makeCase('r2', 'c', 'same')];
      const [result] = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result.enabled).toBe(false);
    });

    it('marks a column as disabled when there are no non-empty values', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const data = [makeCase('r1', 'c'), makeCase('r2', 'c')];
      const [result] = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result.enabled).toBe(false);
    });

    it('marks a column as enabled when unique value count is within allowed range', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const data = [makeCase('r1', 'c', 'v1'), makeCase('r2', 'c', 'v2')];
      const [result] = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result.enabled).toBe(true);
    });

    it('marks a column as disabled when unique value count exceeds MAX_ALLOWED_UNIQUE_VALUES', () => {
      const col = makeCol('c', 'rc', 'C');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const data = Array.from({ length: MAX_ALLOWED_UNIQUE_VALUES + 1 }, (_, i) =>
        makeCase(`r${i}`, 'c', `val${i}`));
      const [result] = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result.enabled).toBe(false);
    });

    it('preserves the ordered_col_ids ordering', () => {
      const colA = makeCol('ca', 'rca', 'Zebra');
      const colB = makeCol('cb', 'rcb', 'Apple');
      const cct = makeCompleteCaseType(
        [colA, colB],
        { rca: makeRefCol(CaseDbColType.NOMINAL), rcb: makeRefCol(CaseDbColType.NOMINAL) },
      );
      const data = [makeCase('r1', 'ca', 'v1'), makeCase('r2', 'ca', 'v2'), makeCase('r1', 'cb', 'x1'), makeCase('r2', 'cb', 'x2')];
      const result = StratificationUtil.getStratifyableColumns({ completeCaseType: cct, data });
      expect(result.map(r => r.col.label)).toEqual(['Zebra', 'Apple']);
    });
  });

  // -------------------------------------------------------------------------
  describe('field stratification colour assignment', () => {
    describe('BASE_COLORS path (non-gradient type, few unique values)', () => {
      it('assigns colours from BASE_COLORS when uniqueRowValues.length <= BASE_COLORS.length', () => {
        const { BASE_COLORS } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
        // 2 unique values → well within BASE_COLORS (12)
        const cases = [makeCase('r1', 'c', 'alpha'), makeCase('r2', 'c', 'beta')];

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        expect(result.legendaItems[0].color).toBe(BASE_COLORS[0]);
        expect(result.legendaItems[1].color).toBe(BASE_COLORS[1]);
      });
    });

    describe('gradient path', () => {
      it('uses BASE_ORDERED_GRADIENT with equal spacing for gradient col type without concept set', () => {
        const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        // INTERVAL is a gradient col type; no concept_set_id → equal spacing
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.INTERVAL) });
        const cases = [makeCase('r1', 'c', 'v1'), makeCase('r2', 'c', 'v2')];

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        const expectedColors = [0, 1].map(i =>
          BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
        expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
      });

      it('uses BASE_UNORDERED_GRADIENT for many unique values when useExtraGradients is false', () => {
        const { BASE_COLORS, BASE_UNORDERED_GRADIENT } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
        // Create BASE_COLORS.length + 1 unique values to exceed BASE_COLORS
        const numValues = BASE_COLORS.length + 1;
        const cases = Array.from({ length: numValues }, (_, i) => makeCase(`r${i}`, 'c', `val${i}`));

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        const expectedColors = Array.from({ length: numValues }, (_, i) =>
          BASE_UNORDERED_GRADIENT(i / numValues).toString({ format: 'hex' }));
        expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
      });

      it('uses EXTRA_GRADIENTS[colIndex % n] for many unique values when useExtraGradients is true', () => {
        const { BASE_COLORS, EXTRA_GRADIENTS } = getStratificationConfig();
        const col = makeCol('c', 'rc', 'c', 'dim1');
        const dims = {
          dim1: { id: 'dim1' },
          dim2: { id: 'dim2' },
        } as unknown as CaseDbCompleteCaseType['dims'];
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) }, dims);
        const numValues = BASE_COLORS.length + 1;
        const cases = Array.from({ length: numValues }, (_, i) => makeCase(`r${i}`, 'c', `val${i}`));

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases, useExtraGradients: true,
        });

        // dim1 is at index 0 in Object.values(dims), so gradient = EXTRA_GRADIENTS[0 % n]
        const gradient = EXTRA_GRADIENTS[0 % EXTRA_GRADIENTS.length];
        const expectedColors = Array.from({ length: numValues }, (_, i) =>
          gradient(i / numValues).toString({ format: 'hex' }));
        expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
      });

      describe('boundary-props gradient', () => {
        const COL_ID = 'c';
        const REF_COL_ID = 'rc';
        const SET_ID = 'set1';

        const setUpConcepts = (concepts: CaseDbConcept[]) => {
          DataService.getInstance().data.conceptsIdsBySetId[SET_ID] = concepts.map(c => c.id);
          concepts.forEach(c => {
            DataService.getInstance().data.conceptsById[c.id] = c;
          });
        };

        it('positions colours using the midpoint of each boundary, normalised to the global range', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const concepts = [
            makeConcept('c1', 1, { lb: 0, lb_in: true, ub: 10, ub_in: false, unit: 'x' }),
            makeConcept('c2', 2, { lb: 10, lb_in: true, ub: 20, ub_in: false, unit: 'x' }),
            makeConcept('c3', 3, { lb: 20, lb_in: true, ub: 30, ub_in: true, unit: 'x' }),
          ];
          setUpConcepts(concepts);

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          // globalMin=0, globalMax=30; midpoints: 5, 15, 25 → positions: 5/30, 15/30, 25/30
          const expectedColors = [5, 15, 25].map(midpoint =>
            BASE_ORDERED_GRADIENT(midpoint / 30).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('clamps infinite lower/upper bounds to the finite global extremes', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const concepts = [
            // lb=-Infinity → clamped to globalMin (10); ub=10 → finite
            makeConcept('c1', 1, { lb: -Infinity, lb_in: false, ub: 10, ub_in: false, unit: 'x' }),
            makeConcept('c2', 2, { lb: 10, lb_in: true, ub: 20, ub_in: true, unit: 'x' }),
            // ub=+Infinity → clamped to globalMax (20); lb=20 → finite
            makeConcept('c3', 3, { lb: 20, lb_in: true, ub: Infinity, ub_in: false, unit: 'x' }),
          ];
          setUpConcepts(concepts);

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          // finiteLbs=[10,20], finiteUbs=[10,20] → globalMin=10, globalMax=20
          // c1: lb=10(clamped), ub=10 → mid=10, pos=0
          // c2: lb=10, ub=20 → mid=15, pos=0.5
          // c3: lb=20, ub=20(clamped) → mid=20, pos=1
          const expectedColors = [10, 15, 20].map(midpoint =>
            BASE_ORDERED_GRADIENT((midpoint - 10) / 10).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('falls back to equal spacing when global range is degenerate (globalMin === globalMax)', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const concepts = [
            // All concepts have the same midpoint value → globalMin === globalMax after clamping
            makeConcept('c1', 1, { lb: 5, lb_in: true, ub: 5, ub_in: true, unit: 'x' }),
            makeConcept('c2', 2, { lb: 5, lb_in: true, ub: 5, ub_in: true, unit: 'x' }),
          ];
          setUpConcepts(concepts);

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          // globalMin === globalMax → boundary path skipped, fallback to equal spacing
          const expectedColors = [0, 1].map(i =>
            BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('falls back to equal spacing when concepts have no boundary props', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const concepts = [
            makeConcept('c1', 1, { some: 'other', structure: true }),
            makeConcept('c2', 2, { some: 'other', structure: true }),
          ];
          setUpConcepts(concepts);

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          const expectedColors = [0, 1].map(i =>
            BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('falls back to equal spacing when only some concepts have boundary props', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const concepts = [
            makeConcept('c1', 1, { lb: 0, lb_in: true, ub: 10, ub_in: false, unit: 'x' }),
            makeConcept('c2', 2, null),
          ];
          setUpConcepts(concepts);

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          const expectedColors = [0, 1].map(i =>
            BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('falls back to equal spacing when concept_set_id is set on refCol but conceptsIdsBySetId has no entry', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          // Populate conceptsById so rows are non-missing, but intentionally leave
          // conceptsIdsBySetId empty → the boundary block is never entered, and
          // getUniqueRowValues falls back to the sortedData path
          const concepts = [
            makeConcept('c1', 1, null),
            makeConcept('c2', 2, null),
          ];
          concepts.forEach(c => {
            DataService.getInstance().data.conceptsById[c.id] = c;
          });
          // conceptsIdsBySetId[SET_ID] is intentionally left unset

          const col = makeCol(COL_ID, REF_COL_ID);
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL, SET_ID) });
          const cases = concepts.map(c => makeCase(`row_${c.id}`, COL_ID, c.id));

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          const expectedColors = [0, 1].map(i =>
            BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });

        it('falls back to equal spacing when refCol has no concept_set_id', () => {
          const { BASE_ORDERED_GRADIENT } = getStratificationConfig();
          const col = makeCol(COL_ID, REF_COL_ID);
          // No concept_set_id on refCol
          const cct = makeCompleteCaseType([col], { [REF_COL_ID]: makeRefCol(CaseDbColType.INTERVAL) });
          const cases = [makeCase('r1', COL_ID, 'v1'), makeCase('r2', COL_ID, 'v2')];

          const result = StratificationUtil.getStratification({
            col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
          });

          const expectedColors = [0, 1].map(i =>
            BASE_ORDERED_GRADIENT(i / 2).toString({ format: 'hex' }));
          expect(result.legendaItems.map(li => li.color)).toEqual(expectedColors);
        });
      });
    });

    // -----------------------------------------------------------------------
    describe('missing data handling', () => {
      it('appends a missing-data legenda item when some rows have no value for the column', () => {
        const { ITEM_MISSING_COLOR } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
        const cases = [
          makeCase('r1', 'c', 'val1'),
          makeCase('r_missing', 'c'), // no value
        ];

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        const missingItem = result.legendaItems.find(li => li.color === ITEM_MISSING_COLOR);
        expect(missingItem).toBeDefined();
        expect(missingItem.caseIds).toContain('r_missing');
        expect(result.caseIdColors['r_missing']).toBe(ITEM_MISSING_COLOR);
      });

      it('does not append a missing-data legenda item when all rows have values', () => {
        const { ITEM_MISSING_COLOR } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
        const cases = [makeCase('r1', 'c', 'val1'), makeCase('r2', 'c', 'val2')];

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        const missingItem = result.legendaItems.find(li => li.color === ITEM_MISSING_COLOR);
        expect(missingItem).toBeUndefined();
      });
    });

    // -----------------------------------------------------------------------
    describe('lookup maps', () => {
      it('builds caseIdColors, legendaItemsByColor and legendaItemsByValue correctly', () => {
        const { BASE_COLORS } = getStratificationConfig();
        const col = makeCol('c', 'rc');
        const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
        const cases = [
          makeCase('r1', 'c', 'alpha'),
          makeCase('r2', 'c', 'beta'),
          makeCase('r3', 'c', 'alpha'), // same value as r1
        ];

        const result = StratificationUtil.getStratification({
          col, completeCaseType: cct, mode: STRATIFICATION_MODE.FIELD, sortedData: cases,
        });

        // caseIdColors
        expect(result.caseIdColors['r1']).toBe(result.caseIdColors['r3']);
        expect(result.caseIdColors['r1']).not.toBe(result.caseIdColors['r2']);

        // legendaItemsByValue: keyed by raw value
        expect(result.legendaItemsByValue['alpha']).toBeDefined();
        expect(result.legendaItemsByValue['alpha'].caseIds).toContain('r1');
        expect(result.legendaItemsByValue['alpha'].caseIds).toContain('r3');

        // legendaItemsByColor: keyed by hex colour string
        const color0 = BASE_COLORS[0];
        expect(result.legendaItemsByColor[color0]).toBeDefined();

        // mode and colorForIsMissing are set
        expect(result.mode).toBe(STRATIFICATION_MODE.FIELD);
        expect(result.colorForIsMissing).toBe(getStratificationConfig().ITEM_MISSING_COLOR);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('selection stratification', () => {
    it('creates SELECTED and UNSELECTED legenda items', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'v'), makeCase('r2', 'c', 'v')];

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SELECTION, selectedIds: ['r1'], sortedData: cases,
      });

      expect(result.legendaItems).toHaveLength(2);
      const rawValues = result.legendaItems.map(li => li.rowValue.raw);
      expect(rawValues).toContain('SELECTED');
      expect(rawValues).toContain('UNSELECTED');
    });

    it('assigns selected case IDs to SELECTED colour and others to UNSELECTED colour', () => {
      const { BASE_COLORS } = getStratificationConfig();
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'v'), makeCase('r2', 'c', 'v'), makeCase('r3', 'c', 'v')];

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SELECTION, selectedIds: ['r1', 'r3'], sortedData: cases,
      });

      const selectedColor = BASE_COLORS[0];
      const unselectedColor = BASE_COLORS[1];

      expect(result.caseIdColors['r1']).toBe(selectedColor);
      expect(result.caseIdColors['r3']).toBe(selectedColor);
      expect(result.caseIdColors['r2']).toBe(unselectedColor);
    });

    it('sets colorForIsMissing and mode correctly', () => {
      const { ITEM_MISSING_COLOR } = getStratificationConfig();
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SELECTION, selectedIds: [], sortedData: [],
      });

      expect(result.colorForIsMissing).toBe(ITEM_MISSING_COLOR);
      expect(result.mode).toBe(STRATIFICATION_MODE.SELECTION);
    });

    it('does not include a column in the returned stratification', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SELECTION, selectedIds: [], sortedData: [],
      });

      expect(result.col).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('similar cases stratification', () => {
    it('creates YES and NO legenda items', () => {
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'v'), makeCase('r2', 'c', 'v')];

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SIMILAR_CASES, similarCaseIds: ['r1'], sortedData: cases,
      });

      expect(result.legendaItems).toHaveLength(2);
      const rawValues = result.legendaItems.map(li => li.rowValue.raw);
      expect(rawValues).toContain(STRATIFICATION_SIMILAR_CASE.YES);
      expect(rawValues).toContain(STRATIFICATION_SIMILAR_CASE.NO);
    });

    it('assigns similar case IDs to YES colour and others to NO colour', () => {
      const { BASE_COLORS } = getStratificationConfig();
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });
      const cases = [makeCase('r1', 'c', 'v'), makeCase('r2', 'c', 'v'), makeCase('r3', 'c', 'v')];

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SIMILAR_CASES, similarCaseIds: ['r1', 'r3'], sortedData: cases,
      });

      const similarColor = BASE_COLORS[0];
      const regularColor = BASE_COLORS[1];

      expect(result.caseIdColors.r1).toBe(similarColor);
      expect(result.caseIdColors.r3).toBe(similarColor);
      expect(result.caseIdColors.r2).toBe(regularColor);
      expect(result.legendaItemsByValue[STRATIFICATION_SIMILAR_CASE.YES].caseIds).toEqual(['r1', 'r3']);
      expect(result.legendaItemsByValue[STRATIFICATION_SIMILAR_CASE.NO].caseIds).toEqual(['r2']);
    });

    it('sets colorForIsMissing, mode, and no column', () => {
      const { ITEM_MISSING_COLOR } = getStratificationConfig();
      const col = makeCol('c', 'rc');
      const cct = makeCompleteCaseType([col], { rc: makeRefCol(CaseDbColType.NOMINAL) });

      const result = StratificationUtil.getStratification({
        col, completeCaseType: cct, mode: STRATIFICATION_MODE.SIMILAR_CASES, similarCaseIds: [], sortedData: [],
      });

      expect(result.colorForIsMissing).toBe(ITEM_MISSING_COLOR);
      expect(result.mode).toBe(STRATIFICATION_MODE.SIMILAR_CASES);
      expect(result.col).toBeUndefined();
    });
  });
});
