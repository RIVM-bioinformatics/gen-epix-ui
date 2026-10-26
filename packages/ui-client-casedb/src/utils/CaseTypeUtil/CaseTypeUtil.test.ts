import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseType,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { WINDOW_SERVICE_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';

import { CaseTypeUtil } from './CaseTypeUtil';

const createColumn = (id: string, refColId: string, dimId: string): CaseDbCol => ({
  case_type_id: 'case-type-1',
  code: id,
  dim_id: dimId,
  id,
  label: id,
  rank: 1,
  ref_col_id: refColId,
});

const createRefCol = (
  id: string,
  colType: CaseDbColType,
  refDimId: string,
  rank?: number,
  regionSetId?: string,
): CaseDbRefCol => ({
  code: id,
  col_type: colType,
  id,
  rank,
  ref_dim_id: refDimId,
  region_set_id: regionSetId,
});

const createDim = (id: string, refDimId: string, code = id): CaseDbDim => ({
  case_type_id: 'case-type-1',
  code,
  id,
  rank: 1,
  ref_dim_id: refDimId,
});

const createRefDim = (id: string, dimType: CaseDbDimType): CaseDbRefDim => ({
  code: id,
  dim_type: dimType,
  id,
  label: id,
});

type CompleteCaseTypeOptions = {
  caseTypeAccess?: Array<{ writeColIds: string[] }>;
  columns?: CaseDbCol[];
  dims?: CaseDbDim[];
  refCols?: CaseDbRefCol[];
  refDims?: CaseDbRefDim[];
};

const createCompleteCaseType = ({
  caseTypeAccess = [],
  columns = [],
  dims = [],
  refCols = [],
  refDims = [],
}: CompleteCaseTypeOptions = {}): CaseDbCompleteCaseType => {
  const columnsByDim = Object.fromEntries(dims.map(dim => [
    dim.id,
    columns.filter(column => column.dim_id === dim.id).map(column => column.id),
  ]));
  return {
    case_date_dim_id: null,
    case_type_access_abacs: Object.fromEntries(caseTypeAccess.map((policy, index) => [
      `access-${index}`,
      { write_col_ids: policy.writeColIds },
    ])),
    case_type_share_abacs: {},
    cols: Object.fromEntries(columns.map(column => [column.id, column])),
    dims: Object.fromEntries(dims.map(dim => [dim.id, dim])),
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: 'case-type-1',
    name: 'Case type one',
    ordered_col_ids: columns.map(column => column.id),
    ordered_col_ids_by_dim: columnsByDim,
    ordered_dim_ids: dims.map(dim => dim.id),
    ref_cols: Object.fromEntries(refCols.map(refCol => [refCol.id, refCol])),
    ref_dims: Object.fromEntries(refDims.map(refDim => [refDim.id, refDim])),
    tree_algorithms: {},
    user_id: null,
  } as unknown as CaseDbCompleteCaseType;
};

describe('CaseTypeUtil.createCaseTypeLink', () => {
  it('creates relative and full case-type links', () => {
    const caseType: CaseDbCaseType = { id: 'case-type-1', name: 'Case Type One' };
    const relativeLink = '/cases/case-type-one/case-type-1';

    expect(CaseTypeUtil.createCaseTypeLink(caseType)).toBe(relativeLink);
    expect(CaseTypeUtil.createCaseTypeLink(caseType, false)).toBe(relativeLink);
    expect(CaseTypeUtil.createCaseTypeLink(caseType, true)).toBe(`${container.resolve(WINDOW_SERVICE_TOKEN).window.location.origin}${relativeLink}`);
  });
});

describe('CaseTypeUtil.findPairedReadsCols', () => {
  it('returns pairs only for dimensions containing exactly two read columns', () => {
    const dims = [
      createDim('pair-dim', 'pair-ref-dim'),
      createDim('three-dim', 'three-ref-dim'),
      createDim('single-dim', 'single-ref-dim'),
    ];
    const columns = [
      createColumn('fwd', 'fwd-ref', 'pair-dim'),
      createColumn('rev', 'rev-ref', 'pair-dim'),
      createColumn('read-1', 'read-ref-1', 'three-dim'),
      createColumn('read-2', 'read-ref-2', 'three-dim'),
      createColumn('read-3', 'read-ref-3', 'three-dim'),
      createColumn('read-only', 'read-only-ref', 'single-dim'),
      createColumn('text', 'missing-ref', 'single-dim'),
    ];
    const refCols = columns.slice(0, 6).map(column => createRefCol(
      column.ref_col_id,
      CaseDbColType.GENETIC_READS,
      `ref-${column.dim_id}`,
    ));
    const completeCaseType = createCompleteCaseType({ columns, dims, refCols });

    expect(CaseTypeUtil.findPairedReadsCols(completeCaseType)).toEqual([
      { fwd: columns[0], rev: columns[1] },
    ]);
  });
});

describe('CaseTypeUtil.findUniqueColByColIdRefOrColId', () => {
  it('finds a column by its own ID or reference-column ID', () => {
    const column = createColumn('column-id', 'ref-col-id', 'dim-1');
    const completeCaseType = createCompleteCaseType({
      columns: [column],
      dims: [createDim('dim-1', 'ref-dim-1')],
      refCols: [createRefCol('ref-col-id', CaseDbColType.TEXT, 'ref-dim-1')],
      refDims: [createRefDim('ref-dim-1', CaseDbDimType.TEXT)],
    });

    expect(CaseTypeUtil.findUniqueColByColIdRefOrColId(completeCaseType, 'column-id')).toEqual(column);
    expect(CaseTypeUtil.findUniqueColByColIdRefOrColId(completeCaseType, 'ref-col-id')).toEqual(column);
    expect(CaseTypeUtil.findUniqueColByColIdRefOrColId(completeCaseType, 'missing')).toBeNull();
  });

  it('returns null when a reference ID matches multiple columns', () => {
    const firstColumn = createColumn('column-1', 'ref-shared', 'dim-1');
    const secondColumn = createColumn('column-2', 'ref-shared', 'dim-1');
    const completeCaseType = createCompleteCaseType({
      columns: [firstColumn, secondColumn],
    });

    expect(CaseTypeUtil.findUniqueColByColIdRefOrColId(completeCaseType, 'ref-shared')).toBeNull();
  });
});

describe('CaseTypeUtil column and dimension lookups', () => {
  it('returns all columns or columns ordered within a dimension', () => {
    const first = createColumn('first', 'ref-1', 'dim-1');
    const second = createColumn('second', 'ref-2', 'dim-2');
    const completeCaseType = createCompleteCaseType({
      columns: [first, second],
      dims: [createDim('dim-1', 'ref-dim-1'), createDim('dim-2', 'ref-dim-2')],
      refCols: [
        createRefCol('ref-1', CaseDbColType.TEXT, 'ref-dim-1'),
        createRefCol('ref-2', CaseDbColType.TEXT, 'ref-dim-2'),
      ],
      refDims: [
        createRefDim('ref-dim-1', CaseDbDimType.TEXT),
        createRefDim('ref-dim-2', CaseDbDimType.TEXT),
      ],
    });

    expect(CaseTypeUtil.getCols(completeCaseType)).toEqual([first, second]);
    expect(CaseTypeUtil.getCols(completeCaseType, 'dim-2')).toEqual([second]);
  });

  it('filters columns by reference-column type and skips missing reference columns', () => {
    const text = createColumn('text', 'text-ref', 'dim-1');
    const geo = createColumn('geo', 'geo-ref', 'dim-1');
    const missing = createColumn('missing', 'missing-ref', 'dim-1');
    const completeCaseType = createCompleteCaseType({
      columns: [text, geo, missing],
      refCols: [
        createRefCol('text-ref', CaseDbColType.TEXT, 'ref-dim-1'),
        createRefCol('geo-ref', CaseDbColType.GEO_REGION, 'ref-dim-1'),
      ],
    });

    expect(CaseTypeUtil.getColsByType(completeCaseType, [CaseDbColType.TEXT])).toEqual([text]);
  });

  it('returns a dimension code and filters dimensions by type', () => {
    const geoDim = createDim('geo-dim', 'geo-ref-dim', 'Geo');
    const timeDim = createDim('time-dim', 'time-ref-dim', 'Time');
    const completeCaseType = createCompleteCaseType({
      dims: [geoDim, timeDim],
      refDims: [
        createRefDim('geo-ref-dim', CaseDbDimType.GEO),
        createRefDim('time-ref-dim', CaseDbDimType.TIME),
      ],
    });

    expect(CaseTypeUtil.getDimLabel(completeCaseType, 'geo-dim')).toBe('Geo');
    expect(CaseTypeUtil.getDims(completeCaseType)).toEqual([geoDim, timeDim]);
    expect(CaseTypeUtil.getDims(completeCaseType, [])).toEqual([geoDim, timeDim]);
    expect(CaseTypeUtil.getDims(completeCaseType, [CaseDbDimType.TIME])).toEqual([timeDim]);
  });
});

describe('CaseTypeUtil.getInitialVisibleColIds', () => {
  it('selects representative geographic, ranked, genetic-distance, and visible columns', () => {
    const dimensions = [
      createDim('geo-dim', 'geo-ref-dim'),
      createDim('time-dim', 'time-ref-dim'),
      createDim('number-dim', 'number-ref-dim'),
      createDim('distance-dim', 'distance-ref-dim'),
      createDim('other-dim', 'other-ref-dim'),
    ];
    const columns = [
      createColumn('geo-1', 'geo-ref-1', 'geo-dim'),
      createColumn('geo-2', 'geo-ref-2', 'geo-dim'),
      createColumn('geo-3', 'geo-ref-3', 'geo-dim'),
      createColumn('time-first', 'time-ref-1', 'time-dim'),
      createColumn('time-ranked', 'time-ref-2', 'time-dim'),
      createColumn('number-first', 'number-ref-1', 'number-dim'),
      createColumn('number-ranked', 'number-ref-2', 'number-dim'),
      createColumn('distance-first', 'distance-ref-1', 'distance-dim'),
      createColumn('distance-ranked', 'distance-ref-2', 'distance-dim'),
      createColumn('other-visible', 'other-ref-1', 'other-dim'),
      createColumn('other-reads', 'other-ref-2', 'other-dim'),
      createColumn('other-sequence', 'other-ref-3', 'other-dim'),
    ];
    const refCols = [
      createRefCol('geo-ref-1', CaseDbColType.GEO_REGION, 'geo-ref-dim'),
      createRefCol('geo-ref-2', CaseDbColType.GEO_REGION, 'geo-ref-dim'),
      createRefCol('geo-ref-3', CaseDbColType.GEO_REGION, 'geo-ref-dim'),
      createRefCol('time-ref-1', CaseDbColType.TIME_DAY, 'time-ref-dim', 2),
      createRefCol('time-ref-2', CaseDbColType.TIME_MONTH, 'time-ref-dim', 1),
      createRefCol('number-ref-1', CaseDbColType.DECIMAL_0, 'number-ref-dim', 2),
      createRefCol('number-ref-2', CaseDbColType.DECIMAL_1, 'number-ref-dim', 1),
      createRefCol('distance-ref-1', CaseDbColType.TEXT, 'distance-ref-dim', 2),
      createRefCol('distance-ref-2', CaseDbColType.GENETIC_DISTANCE, 'distance-ref-dim', 1),
      createRefCol('other-ref-1', CaseDbColType.TEXT, 'other-ref-dim'),
      createRefCol('other-ref-2', CaseDbColType.GENETIC_READS, 'other-ref-dim'),
      createRefCol('other-ref-3', CaseDbColType.GENETIC_SEQUENCE, 'other-ref-dim'),
    ];
    const refDims = [
      createRefDim('geo-ref-dim', CaseDbDimType.GEO),
      createRefDim('time-ref-dim', CaseDbDimType.TIME),
      createRefDim('number-ref-dim', CaseDbDimType.NUMBER),
      createRefDim('distance-ref-dim', CaseDbDimType.OTHER),
      createRefDim('other-ref-dim', CaseDbDimType.OTHER),
    ];
    const completeCaseType = createCompleteCaseType({ columns, dims: dimensions, refCols, refDims });

    expect(CaseTypeUtil.getInitialVisibleColIds(completeCaseType)).toEqual([
      'geo-2',
      'time-ranked',
      'number-ranked',
      'distance-ranked',
      'other-visible',
    ]);
  });

  it('skips dimensions with no columns', () => {
    const emptyGeoDimension = createDim('empty-geo', 'empty-geo-ref');
    const emptyTimeDimension = createDim('empty-time', 'empty-time-ref');
    const completeCaseType = createCompleteCaseType({
      dims: [emptyGeoDimension, emptyTimeDimension],
      refDims: [
        createRefDim('empty-geo-ref', CaseDbDimType.GEO),
        createRefDim('empty-time-ref', CaseDbDimType.TIME),
      ],
    });

    expect(CaseTypeUtil.getInitialVisibleColIds(completeCaseType)).toEqual([]);
  });
});

describe('CaseTypeUtil preferred columns', () => {
  it('prefers rank one or falls back to the first column', () => {
    const first = createColumn('first', 'ref-first', 'dim-1');
    const ranked = createColumn('ranked', 'ref-ranked', 'dim-1');
    const completeCaseType = createCompleteCaseType({
      columns: [first, ranked],
      refCols: [
        createRefCol('ref-first', CaseDbColType.TEXT, 'ref-dim-1', 2),
        createRefCol('ref-ranked', CaseDbColType.TEXT, 'ref-dim-1', 1),
      ],
    });

    expect(CaseTypeUtil.getPreferredColInDimHavingHighestRank([first, ranked], completeCaseType)).toBe(ranked);
    expect(CaseTypeUtil.getPreferredColInDimHavingHighestRank([first], completeCaseType)).toBe(first);
    expect(CaseTypeUtil.getPreferredColInDimHavingHighestRank([], completeCaseType)).toBeUndefined();
  });

  it('selects the middle geographic column and handles short lists', () => {
    const columns = [
      createColumn('first', 'ref-first', 'dim-1'),
      createColumn('middle', 'ref-middle', 'dim-1'),
      createColumn('last', 'ref-last', 'dim-1'),
    ];

    expect(CaseTypeUtil.getPreferredGEOCol(columns)).toBe(columns[1]);
    expect(CaseTypeUtil.getPreferredGEOCol(columns.slice(0, 2))).toBe(columns[0]);
    expect(CaseTypeUtil.getPreferredGEOCol(columns.slice(0, 1))).toBe(columns[0]);
    expect(CaseTypeUtil.getPreferredGEOCol([])).toBeUndefined();
  });
});

describe('CaseTypeUtil set and access helpers', () => {
  it('returns unique region-set IDs in column order', () => {
    const columns = [
      createColumn('col-1', 'ref-1', 'dim-1'),
      createColumn('col-2', 'ref-2', 'dim-1'),
      createColumn('col-3', 'ref-3', 'dim-1'),
    ];
    const completeCaseType = createCompleteCaseType({
      columns,
      refCols: [
        createRefCol('ref-1', CaseDbColType.GEO_REGION, 'ref-dim-1', undefined, 'region-set-1'),
        createRefCol('ref-2', CaseDbColType.GEO_REGION, 'ref-dim-1', undefined, 'region-set-1'),
        createRefCol('ref-3', CaseDbColType.TEXT, 'ref-dim-1'),
      ],
    });

    expect(CaseTypeUtil.getRegionSetIds(completeCaseType)).toEqual(['region-set-1']);
  });

  it('combines writable columns without duplicates and excludes non-importable types', () => {
    const columns = [
      createColumn('text', 'text-ref', 'dim-1'),
      createColumn('distance', 'distance-ref', 'dim-1'),
      createColumn('profile', 'profile-ref', 'dim-1'),
      createColumn('reads', 'reads-ref', 'dim-1'),
      createColumn('sequence', 'sequence-ref', 'dim-1'),
      createColumn('unwritable', 'unwritable-ref', 'dim-1'),
    ];
    const completeCaseType = createCompleteCaseType({
      caseTypeAccess: [
        { writeColIds: ['text', 'distance', 'profile'] },
        { writeColIds: ['text', 'reads', 'sequence'] },
      ],
      columns,
      refCols: [
        createRefCol('text-ref', CaseDbColType.TEXT, 'ref-dim-1'),
        createRefCol('distance-ref', CaseDbColType.GENETIC_DISTANCE, 'ref-dim-1'),
        createRefCol('profile-ref', CaseDbColType.GENETIC_PROFILE, 'ref-dim-1'),
        createRefCol('reads-ref', CaseDbColType.GENETIC_READS, 'ref-dim-1'),
        createRefCol('sequence-ref', CaseDbColType.GENETIC_SEQUENCE, 'ref-dim-1'),
        createRefCol('unwritable-ref', CaseDbColType.TEXT, 'ref-dim-1'),
      ],
    });

    expect(CaseTypeUtil.getWritableColIds(completeCaseType)).toEqual(['text', 'distance', 'profile', 'reads', 'sequence']);
    expect(CaseTypeUtil.getWritableImportExportColIds(completeCaseType)).toEqual(['text']);
  });

  it('detects genetic-distance dimensions only for OTHER dimensions with a genetic-distance column', () => {
    const distanceRefCol = createRefCol('distance', CaseDbColType.GENETIC_DISTANCE, 'ref-other');
    const textRefCol = createRefCol('text', CaseDbColType.TEXT, 'ref-other');

    expect(CaseTypeUtil.isGeneticDistanceDim(createRefDim('ref-other', CaseDbDimType.OTHER), [textRefCol, distanceRefCol])).toBe(true);
    expect(CaseTypeUtil.isGeneticDistanceDim(createRefDim('ref-other', CaseDbDimType.GEO), [distanceRefCol])).toBe(false);
    expect(CaseTypeUtil.isGeneticDistanceDim(createRefDim('ref-other', CaseDbDimType.OTHER), [textRefCol])).toBe(false);
  });
});
