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
  CaseDbCaseSet,
  CaseDbCol,
  CaseDbConcept,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

import { CaseDbDataUtil } from './CaseDbDataUtil';

const createConcept = (code: string, rank?: null | number): CaseDbConcept => ({
  code,
  concept_set_id: 'concept-set-1',
  ...(rank === undefined ? {} : { rank }),
});

const createRefDim = (id: string, dimType = CaseDbDimType.GEO): CaseDbRefDim => ({
  code: id,
  dim_type: dimType,
  id,
  label: id,
});

const createRefCol = (id: string, refDimId: string, colType: CaseDbColType): CaseDbRefCol => ({
  code: id,
  col_type: colType,
  id,
  ref_dim_id: refDimId,
});

const createDim = (id: string, refDimId: string, caseTypeId = 'case-type-1'): CaseDbDim => ({
  case_type_id: caseTypeId,
  code: id,
  id,
  rank: 1,
  ref_dim_id: refDimId,
});

const createCol = (id: string, dimId: string, refColId: string, caseTypeId = 'case-type-1'): CaseDbCol => ({
  case_type_id: caseTypeId,
  code: id,
  dim_id: dimId,
  id,
  rank: 1,
  ref_col_id: refColId,
});

const createOption = (value: string): OptionBase<string> => ({
  label: value,
  value,
});

describe('CaseDbDataUtil.conceptComparator', () => {
  it('sorts unranked concepts by code and treats null rank as unranked', () => {
    expect(CaseDbDataUtil.conceptComparator(createConcept('B', null), createConcept('A'))).toBe(1);
    expect(CaseDbDataUtil.conceptComparator(createConcept('A'), createConcept('B', null))).toBe(-1);
    expect(CaseDbDataUtil.conceptComparator(createConcept('A'), createConcept('B'))).toBeLessThan(0);
  });

  it('sorts ranked concepts before unranked concepts and preserves rank zero', () => {
    expect(CaseDbDataUtil.conceptComparator(createConcept('rank-zero', 0), createConcept('rank-two', 2))).toBe(-2);
    expect(CaseDbDataUtil.conceptComparator(createConcept('ranked', 1), createConcept('unranked'))).toBe(-1);
    expect(CaseDbDataUtil.conceptComparator(createConcept('unranked'), createConcept('ranked', 1))).toBe(1);
  });
});

describe('CaseDbDataUtil.getCaseSetName', () => {
  it('formats the case-set date with its name', () => {
    const caseSet: CaseDbCaseSet = {
      case_set_category_id: 'category-1',
      case_set_date: '2024-01-02',
      case_set_status_id: 'status-1',
      case_type_id: 'case-type-1',
      code: 'CS1',
      created_in_data_collection_id: 'collection-1',
      description: '',
      name: 'Case set one',
    };

    expect(CaseDbDataUtil.getCaseSetName(caseSet)).toBe('Case set one (2024-01-02)');
  });
});

describe('CaseDbDataUtil.getColTypeOptionsForRefDimId', () => {
  const colTypeOptions = [
    createOption(CaseDbColType.GEO_REGION),
    createOption(CaseDbColType.TEXT),
  ];

  it('returns no options when the reference dimension is missing', () => {
    expect(CaseDbDataUtil.getColTypeOptionsForRefDimId({
      colsValidationRules: { GEO: [CaseDbColType.GEO_REGION] },
      colTypeOptions,
      refDimId: 'missing',
      refDimMap: new Map(),
    })).toEqual([]);
  });

  it('returns no options when rules are missing for the reference dimension type', () => {
    expect(CaseDbDataUtil.getColTypeOptionsForRefDimId({
      colsValidationRules: undefined,
      colTypeOptions,
      refDimId: 'dim-1',
      refDimMap: new Map([['dim-1', createRefDim('dim-1')]]),
    })).toEqual([]);
    expect(CaseDbDataUtil.getColTypeOptionsForRefDimId({
      colsValidationRules: {},
      colTypeOptions,
      refDimId: 'dim-1',
      refDimMap: new Map([['dim-1', createRefDim('dim-1')]]),
    })).toEqual([]);
  });

  it('filters column types using the selected dimension rules', () => {
    expect(CaseDbDataUtil.getColTypeOptionsForRefDimId({
      colsValidationRules: { GEO: [CaseDbColType.GEO_REGION] },
      colTypeOptions,
      refDimId: 'dim-1',
      refDimMap: new Map([['dim-1', createRefDim('dim-1')]]),
    })).toEqual([createOption(CaseDbColType.GEO_REGION)]);
  });
});

describe('CaseDbDataUtil.getDimOptionsForCaseTypeId', () => {
  const dimOptions = [createOption('dim-1'), createOption('dim-2'), createOption('missing-dim')];

  it('returns no dimensions without a case-type ID', () => {
    expect(CaseDbDataUtil.getDimOptionsForCaseTypeId({
      caseTypeId: '',
      dimMap: new Map(),
      dimOptions,
    })).toEqual([]);
  });

  it('filters dimensions by case type and skips missing map entries', () => {
    expect(CaseDbDataUtil.getDimOptionsForCaseTypeId({
      caseTypeId: 'case-type-1',
      dimMap: new Map([
        ['dim-1', createDim('dim-1', 'ref-dim-1', 'case-type-1')],
        ['dim-2', createDim('dim-2', 'ref-dim-2', 'case-type-2')],
      ]),
      dimOptions,
    })).toEqual([createOption('dim-1')]);
  });
});

describe('CaseDbDataUtil.getGeneticSequenceColOptionsForCaseTypeId', () => {
  const colOptions = [
    createOption('sequence-col'),
    createOption('text-col'),
    createOption('other-case-type-col'),
    createOption('missing-col'),
  ];

  it('returns no columns without a case-type ID', () => {
    expect(CaseDbDataUtil.getGeneticSequenceColOptionsForCaseTypeId({
      caseTypeId: '',
      colMap: new Map(),
      colOptions,
      refColMap: new Map(),
    })).toEqual([]);
  });

  it('selects only genetic-sequence columns in the requested case type', () => {
    const sequenceCol = createCol('sequence-col', 'dim-1', 'ref-sequence');
    const textCol = createCol('text-col', 'dim-1', 'ref-text');
    const otherCaseTypeCol = createCol('other-case-type-col', 'dim-1', 'ref-sequence', 'case-type-2');

    expect(CaseDbDataUtil.getGeneticSequenceColOptionsForCaseTypeId({
      caseTypeId: 'case-type-1',
      colMap: new Map([
        ['other-case-type-col', otherCaseTypeCol],
        ['sequence-col', sequenceCol],
        ['text-col', textCol],
      ]),
      colOptions,
      refColMap: new Map([
        ['ref-sequence', createRefCol('ref-sequence', 'ref-dim-1', CaseDbColType.GENETIC_SEQUENCE)],
        ['ref-text', createRefCol('ref-text', 'ref-dim-1', CaseDbColType.TEXT)],
      ]),
    })).toEqual([createOption('sequence-col')]);
  });
});

describe('CaseDbDataUtil.getRefColOptionsForDimId', () => {
  const refColOptions = [createOption('ref-col-1'), createOption('ref-col-2'), createOption('missing-ref-col')];
  const dimMap = new Map([['dim-1', createDim('dim-1', 'ref-dim-1')]]);
  const refDimMap = new Map([['ref-dim-1', createRefDim('ref-dim-1')]]);

  it('returns no reference columns when the dimension or reference dimension is missing', () => {
    expect(CaseDbDataUtil.getRefColOptionsForDimId({
      colsValidationRules: {},
      dimId: 'missing-dim',
      dimMap: new Map(),
      refColMap: new Map(),
      refColOptions,
      refDimMap,
    })).toEqual([]);

    expect(CaseDbDataUtil.getRefColOptionsForDimId({
      colsValidationRules: {},
      dimId: 'dim-1',
      dimMap,
      refColMap: new Map(),
      refColOptions,
      refDimMap: new Map(),
    })).toEqual([]);
  });

  it('returns no options when validation rules for the dimension type are absent', () => {
    expect(CaseDbDataUtil.getRefColOptionsForDimId({
      colsValidationRules: undefined,
      dimId: 'dim-1',
      dimMap,
      refColMap: new Map(),
      refColOptions,
      refDimMap,
    })).toEqual([]);
  });

  it('filters reference columns by dimension and allowed column type', () => {
    expect(CaseDbDataUtil.getRefColOptionsForDimId({
      colsValidationRules: { GEO: [CaseDbColType.GEO_REGION] },
      dimId: 'dim-1',
      dimMap,
      refColMap: new Map([
        ['ref-col-1', createRefCol('ref-col-1', 'ref-dim-1', CaseDbColType.GEO_REGION)],
        ['ref-col-2', createRefCol('ref-col-2', 'ref-dim-2', CaseDbColType.GEO_REGION)],
      ]),
      refColOptions,
      refDimMap,
    })).toEqual([createOption('ref-col-1')]);
  });
});
