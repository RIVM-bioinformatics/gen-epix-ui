import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import type {
  GetTableCellRowComparatorProps,
  GetTableCellValueProps,
  TableColumnText,
} from '@gen-epix/ui-client-common/models/table.models';

import { DataService } from '../../classes/services/DataService';
import type { CaseTypeRowValue } from '../../models/case-db.models';
import { CaseUtil } from '../CaseUtil';

import { CaseDbTableUtil } from './CaseDbTableUtil';

const createColumn = (): CaseDbCol => ({
  case_type_id: 'case-type-1',
  code: 'column-1',
  dim_id: 'dimension-1',
  id: 'column-1',
  rank: 1,
  ref_col_id: 'reference-column-1',
});

const createCompleteCaseType = (colType: CaseDbColType): CaseDbCompleteCaseType => ({
  ref_cols: {
    'reference-column-1': {
      col_type: colType,
      concept_set_id: 'concept-set-1',
    },
  },
} as unknown as CaseDbCompleteCaseType);

const createCase = (id: string): CaseDbCase => ({
  content: {},
  id,
} as CaseDbCase);

const createRowValue = (raw: string, short = raw, isMissing = false): CaseTypeRowValue => ({
  full: raw,
  isMissing,
  long: raw,
  raw,
  short,
});

const createComparator = (colType: CaseDbColType, direction: 'asc' | 'desc') => {
  const completeCaseType = createCompleteCaseType(colType);
  const column = {
    columnContext: createColumn(),
    id: 'column-1',
  } as unknown as TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>;
  const comparatorProps: GetTableCellRowComparatorProps<
    TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>,
    CaseDbCompleteCaseType
  > = {
    column,
    dataContext: completeCaseType,
    direction,
  };
  return CaseDbTableUtil.createCaseTypeCellRowComperator(comparatorProps);
};

afterEach(() => {
  vi.restoreAllMocks();
  container.clearInstances();
});

describe('CaseDbTableUtil.createCaseTypeCellRowComperator', () => {
  it('returns zero for equal raw values and orders missing values after present values', () => {
    const comparator = createComparator(CaseDbColType.TEXT, 'asc');
    const getRowValue = vi.spyOn(CaseUtil, 'getRowValue')
      .mockReturnValueOnce(createRowValue('same', 'same', true))
      .mockReturnValueOnce(createRowValue('same'));

    expect(comparator(createCase('case-1'), createCase('case-2'))).toBe(0);

    getRowValue
      .mockReturnValueOnce(createRowValue('missing', 'missing', true))
      .mockReturnValueOnce(createRowValue('present'));
    expect(comparator(createCase('case-1'), createCase('case-2'))).toBe(1);

    getRowValue
      .mockReturnValueOnce(createRowValue('present'))
      .mockReturnValueOnce(createRowValue('missing', 'missing', true));
    expect(comparator(createCase('case-1'), createCase('case-2'))).toBe(-1);
  });

  it('orders ordinal values by their concept-set order and direction', () => {
    container.registerInstance(DataService, {
      data: {
        conceptsIdsBySetId: {
          'concept-set-1': ['low', 'high'],
        },
      },
    } as unknown as DataService);
    vi.spyOn(CaseUtil, 'getRowValue')
      .mockReturnValueOnce(createRowValue('low'))
      .mockReturnValueOnce(createRowValue('high'))
      .mockReturnValueOnce(createRowValue('low'))
      .mockReturnValueOnce(createRowValue('high'));
    const ascending = createComparator(CaseDbColType.ORDINAL, 'asc');
    const descending = createComparator(CaseDbColType.ORDINAL, 'desc');

    expect(ascending(createCase('case-1'), createCase('case-2'))).toBe(-1);
    expect(descending(createCase('case-1'), createCase('case-2'))).toBe(1);
  });

  it('compares decimals numerically and other values by short label', () => {
    vi.spyOn(CaseUtil, 'getRowValue')
      .mockReturnValueOnce(createRowValue('10'))
      .mockReturnValueOnce(createRowValue('2'))
      .mockReturnValueOnce(createRowValue('Alpha'))
      .mockReturnValueOnce(createRowValue('Beta'));
    const decimalComparator = createComparator(CaseDbColType.DECIMAL_2, 'asc');
    const textComparator = createComparator(CaseDbColType.TEXT, 'desc');

    expect(decimalComparator(createCase('case-1'), createCase('case-2'))).toBeGreaterThan(0);
    expect(textComparator(createCase('case-1'), createCase('case-2'))).toBeGreaterThan(0);
  });
});

describe('CaseDbTableUtil.getTableCaseTypeCellValue', () => {
  it('uses a custom value getter when the column provides one', () => {
    const valueGetter = vi.fn(() => 'custom value');
    const column = {
      columnContext: createColumn(),
      id: 'column-1',
      valueGetter,
    } as unknown as TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>;
    const props: GetTableCellValueProps<
      CaseDbCase,
      TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>,
      CaseDbCompleteCaseType
    > = {
      column,
      dataContext: createCompleteCaseType(CaseDbColType.TEXT),
      row: createCase('case-1'),
      rowIndex: 3,
    };

    expect(CaseDbTableUtil.getTableCaseTypeCellValue(props)).toBe('custom value');
    expect(valueGetter).toHaveBeenCalledWith(expect.objectContaining({
      id: 'column-1',
      rowIndex: 3,
    }));
  });

  it('returns the raw case value when no custom getter exists', () => {
    const column = {
      columnContext: createColumn(),
      id: 'column-1',
    } as unknown as TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>;
    const props: GetTableCellValueProps<
      CaseDbCase,
      TableColumnText<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>,
      CaseDbCompleteCaseType
    > = {
      column,
      dataContext: createCompleteCaseType(CaseDbColType.TEXT),
      row: createCase('case-1'),
      rowIndex: 0,
    };
    vi.spyOn(CaseUtil, 'getRowValue').mockReturnValue(createRowValue('raw value'));

    expect(CaseDbTableUtil.getTableCaseTypeCellValue(props)).toBe('raw value');
  });
});
