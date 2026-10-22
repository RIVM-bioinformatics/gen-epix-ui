import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCaseBatchUploadResult,
  CaseDbCaseForUpload,
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
  CaseDbEtlStatus,
  CaseDbFileCompression,
  CaseDbReadsFileFormat,
  CaseDbSeqFileFormat,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import writeXlsxFile from 'write-excel-file/browser';

import { CaseTypeUtil } from '../CaseTypeUtil';
import type {
  UploadCompleteColStats,
  UploadMappedColumn,
} from '../../models/upload.models';
import { UploadError } from '../../classes/errors';

import { UploadUtil } from './UploadUtil';

const makeCol = (
  id: string,
  refColId: string,
  _colType: CaseDbColType = CaseDbColType.TEXT,
  dimId = 'dim-1',
  overrides: Partial<CaseDbCol> = {},
): CaseDbCol => ({
  case_type_id: 'case-type-1',
  code: id,
  dim_id: dimId,
  id,
  label: id,
  ref_col_id: refColId,
  ...overrides,
} as CaseDbCol);

const makeCompleteCaseType = (
  cols: CaseDbCol[],
  refColOverrides: Record<string, Partial<CaseDbRefCol>> = {},
): CaseDbCompleteCaseType => {
  const orderedDimIds = [...new Set(cols.map(col => col.dim_id))];
  const orderedColIdsByDim = Object.fromEntries(orderedDimIds.map(dimId => [
    dimId,
    cols.filter(col => col.dim_id === dimId).map(col => col.id),
  ]));
  const refCols = Object.fromEntries(cols.map(col => [
    col.ref_col_id,
    {
      col_type: CaseDbColType.TEXT,
      ...refColOverrides[col.ref_col_id],
    },
  ]));

  return {
    cols: Object.fromEntries(cols.map(col => [col.id, col])),
    dims: Object.fromEntries(orderedDimIds.map(dimId => [dimId, { id: dimId, ref_dim_id: `ref-dim-${dimId}` }])),
    genetic_distance_protocols: {},
    id: 'case-type-1',
    ordered_col_ids: cols.map(col => col.id),
    ordered_col_ids_by_dim: orderedColIdsByDim,
    ordered_dim_ids: orderedDimIds,
    ref_cols: refCols,
    ref_dims: Object.fromEntries(orderedDimIds.map(dimId => [`ref-dim-${dimId}`, { dim_type: 'OTHER' }])),
    tree_algorithms: {},
  } as unknown as CaseDbCompleteCaseType;
};

const makeMappedColumn = (overrides: Partial<UploadMappedColumn> = {}): UploadMappedColumn => ({
  col: null,
  isCaseIdColumn: false,
  isSampleIdColumn: false,
  originalIndex: 0,
  originalLabel: 'Header',
  sampleIdentifierIssuerId: null,
  ...overrides,
});

const makeValidatedCase = (id: string, validatedContent: Record<string, string>): CaseDbCaseUploadResult => ({
  id,
  validated_content: validatedContent,
});

const makeFile = (name: string, size = 0, text = ''): File => ({
  name,
  size,
  text: async () => Promise.resolve(text),
} as unknown as File);

const makeDataTransfer = (files: File[]): DataTransfer => {
  const fileList = {
    item: (index: number) => files[index] ?? null,
    length: files.length,
    [Symbol.iterator]: function* iterator() {
      yield* files;
    },
    ...files,
  } as unknown as FileList;
  return { files: fileList } as DataTransfer;
};

const makeFileList = (files: File[]): FileList => {
  const fileList = {
    item: (index: number) => files[index] ?? null,
    length: files.length,
    [Symbol.iterator]: function* iterator() {
      yield* files;
    },
    ...files,
  } as unknown as FileList;
  return fileList;
};

const createExcelFile = async (): Promise<File> => {
  const workbook = writeXlsxFile([
    [
      { type: String, value: 'name' },
      { type: String, value: 'date' },
      { type: String, value: 'count' },
      { type: String, value: 'empty' },
      { type: String, value: 'active' },
    ],
    [
      { type: String, value: 'Alice' },
      { format: 'yyyy-mm-dd', type: Date, value: new Date(2024, 2, 15, 12) },
      { type: Number, value: 2 },
      { type: String, value: null },
      { type: Boolean, value: true },
    ],
  ]);
  const blob = await workbook.toBlob();
  return new File([blob], 'cases.xlsx');
};

const registerCaseApi = (overrides: Record<string, unknown> = {}) => {
  const api = {
    createFileForReadSet: vi.fn().mockResolvedValue(undefined),
    createFileForSeq: vi.fn().mockResolvedValue(undefined),
    uploadCases: vi.fn().mockResolvedValue({
      data: { cases: [], status: CaseDbEtlStatus.SUCCESS },
    }),
    ...overrides,
  };
  container.registerInstance(CaseDbCaseApi, api as unknown as CaseDbCaseApi);
  return api;
};

const makeBatchUploadResult = (
  cases: Array<{ id: string }>,
  status: CaseDbEtlStatus = CaseDbEtlStatus.SUCCESS,
): CaseDbCaseBatchUploadResult => ({
  cases,
  status,
});

afterEach(() => vi.restoreAllMocks());

describe('UploadUtil.areMappedColumnsEqual', () => {
  it('compares ordered original indices and labels', () => {
    const first = [makeMappedColumn({ originalIndex: 0, originalLabel: 'Case ID' })];
    const same = [makeMappedColumn({ originalIndex: 0, originalLabel: 'Case ID' })];
    const changedIndex = [makeMappedColumn({ originalIndex: 1, originalLabel: 'Case ID' })];
    const changedLabel = [makeMappedColumn({ originalIndex: 0, originalLabel: 'case_id' })];

    expect(UploadUtil.areMappedColumnsEqual(first, same)).toBe(true);
    expect(UploadUtil.areMappedColumnsEqual(first, changedIndex)).toBe(false);
    expect(UploadUtil.areMappedColumnsEqual(first, changedLabel)).toBe(false);
    expect(UploadUtil.areMappedColumnsEqual(first, [])).toBe(false);
    expect(UploadUtil.areMappedColumnsEqual([], [])).toBe(true);
  });
});

it('maps a single reads file to the forward slot', () => {
  vi.spyOn(CaseTypeUtil, 'getWritableColIds').mockReturnValue([]);
  const completeCaseType = makeCompleteCaseType(
    [
      makeCol('sample-col', 'ref-sample'),
      makeCol('reads-col', 'ref-reads'),
    ],
    {
      'ref-reads': { col_type: CaseDbColType.GENETIC_READS },
      'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
    },
  );

  expect(UploadUtil.getEpiUploadSequenceMapping(
    completeCaseType,
    [makeValidatedCase('case-1', { 'sample-col': 'sample-1' })],
    makeDataTransfer([makeFile('sample-1.fastq')]),
  )['case-1']).toEqual({
    readsFileNames: { 'reads-col': { fwd: 'sample-1.fastq', rev: '' } },
    sequenceFileNames: {},
  });
});

describe('UploadUtil.getCasesForUpload', () => {
  it('maps source columns, preserves case IDs, and nullifies empty values in the case payload', () => {
    const result = UploadUtil.getCasesForUpload({
      caseTypeId: 'case-type-1',
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [
        makeMappedColumn({ isCaseIdColumn: true, originalIndex: 0, originalLabel: 'Case ID' }),
        makeMappedColumn({
          col: makeCol('name', 'ref-name'),
          originalIndex: 1,
          originalLabel: 'Name',
        }),
      ],
      rawData: [
        ['Case ID', 'Name'],
        ['case-1', ''],
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      case: {
        case_type_id: 'case-type-1',
        content: { name: null },
        created_in_data_collection_id: 'collection-1',
      },
      content: { name: '' },
      id: 'case-1',
    });
  });

  it('generates IDs when the case ID column or row value is absent', () => {
    vi.spyOn(StringUtil, 'createUuid').mockReturnValue('generated-id');

    const withoutIdColumn = UploadUtil.getCasesForUpload({
      caseTypeId: 'case-type-1',
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [makeMappedColumn({ col: makeCol('name', 'ref-name'), originalIndex: 0 })],
      rawData: [['Name'], ['Alice']],
    });
    const withEmptyId = UploadUtil.getCasesForUpload({
      caseTypeId: 'case-type-1',
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [makeMappedColumn({ isCaseIdColumn: true, originalIndex: 0 })],
      rawData: [['Case ID'], ['']],
    });

    expect(withoutIdColumn[0].id).toBe('generated-id');
    expect(withEmptyId[0].id).toBe('generated-id');
  });

  it('returns no cases when raw data contains only its header row', () => {
    expect(UploadUtil.getCasesForUpload({
      caseTypeId: 'case-type-1',
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [],
      rawData: [['Header']],
    })).toEqual([]);
  });
});

describe('UploadUtil.getCaseTypeFromColumnLabels', () => {
  it('returns null when no column labels match', () => {
    expect(UploadUtil.getCaseTypeFromColumnLabels([makeCol('column', 'ref-column')], ['unknown'])).toBeNull();
  });

  it('returns the case type with the greatest number of label matches', () => {
    const columns = [
      makeCol('a1', 'ra1', CaseDbColType.TEXT, 'dim-1', { case_type_id: 'case-type-a', code: 'A1', label: 'Alpha' }),
      makeCol('a2', 'ra2', CaseDbColType.TEXT, 'dim-1', { case_type_id: 'case-type-a', code: 'A2', label: 'Beta' }),
      makeCol('b1', 'rb1', CaseDbColType.TEXT, 'dim-2', { case_type_id: 'case-type-b', code: 'B1', label: 'Gamma' }),
    ];

    expect(UploadUtil.getCaseTypeFromColumnLabels(columns, ['Alpha', 'Beta', 'B1'])).toEqual({ id: 'case-type-a' });
  });

  it('keeps the first case type when match counts tie', () => {
    const columns = [
      makeCol('a1', 'ra1', CaseDbColType.TEXT, 'dim-1', { case_type_id: 'case-type-a', label: 'Alpha' }),
      makeCol('b1', 'rb1', CaseDbColType.TEXT, 'dim-2', { case_type_id: 'case-type-b', label: 'Beta' }),
    ];

    expect(UploadUtil.getCaseTypeFromColumnLabels(columns, ['Alpha', 'Beta'])).toEqual({ id: 'case-type-a' });
  });
});

describe('UploadUtil.getColumnMappingFormFieldDefinitions', () => {
  it('creates one select field per header with case ID and writable column options', () => {
    const caseCol = makeCol('case-col', 'ref-case');
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const completeCaseType = makeCompleteCaseType([caseCol, sampleCol]);
    vi.spyOn(CaseTypeUtil, 'getWritableImportExportColIds').mockReturnValue(['sample-col']);

    const fields = UploadUtil.getColumnMappingFormFieldDefinitions(completeCaseType, ['Case ID', 'Sample'], 'ignored.csv');

    expect(fields).toHaveLength(2);
    expect(fields.map(field => field.name)).toEqual(['0', '1']);
    expect(fields[0].definition).toBe(FORM_FIELD_DEFINITION_TYPE.SELECT);
    expect(fields[0]).toMatchObject({
      options: [
        { label: 'Case ID', value: 'case_id' },
        { label: 'sample-col', value: 'sample-col' },
      ],
    });
  });
});

describe('UploadUtil.getColumnMappingSchema', () => {
  const completeCaseType = makeCompleteCaseType(
    [makeCol('sample-col', 'ref-sample')],
    { 'ref-sample': { col_type: CaseDbColType.ID_SAMPLE } },
  );

  it('accepts unique mappings and valid UUID case IDs with a sample issuer', async () => {
    const schema = UploadUtil.getColumnMappingSchema(
      [['Case ID', 'Sample'], ['49af1c0e-9a0d-4ed8-889b-7a8c4bb84e56', 'sample-1']],
      completeCaseType,
    );

    await expect(schema.validate({
      0: 'case_id',
      1: 'sample-col',
      'sample-col': 'issuer-1',
    })).resolves.toBeDefined();
  });

  it('rejects duplicate mapped columns', async () => {
    const schema = UploadUtil.getColumnMappingSchema([['A', 'B'], ['a', 'b']], completeCaseType);

    await expect(schema.validate({ 0: 'sample-col', 1: 'sample-col', 'sample-col': 'issuer-1' })).rejects.toThrow();
  });

  it('rejects an invalid UUID in the case ID column', async () => {
    const schema = UploadUtil.getColumnMappingSchema([['Case ID', 'Sample'], ['not-a-uuid', 'sample-1']], completeCaseType);

    await expect(schema.validate({ 0: 'case_id', 1: 'sample-col', 'sample-col': 'issuer-1' })).rejects.toThrow();
  });

  it('requires an issuer when a sample identifier column is mapped', async () => {
    const schema = UploadUtil.getColumnMappingSchema([['Sample'], ['sample-1']], completeCaseType);

    await expect(schema.validate({ 0: 'sample-col' })).rejects.toThrow();
  });

  it('does not require an issuer when the sample identifier column is not mapped', async () => {
    const schema = UploadUtil.getColumnMappingSchema([['Other'], ['value']], completeCaseType);

    await expect(schema.validate({ 0: 'other-col' })).resolves.toBeDefined();
  });
});

describe('UploadUtil.getCompleteCaseTypeColStats', () => {
  it('classifies sample, sequence, reads, and writable columns', () => {
    const sampleCol = makeCol('sample', 'ref-sample');
    const sequenceCol = makeCol('sequence', 'ref-sequence');
    const readsCol = makeCol('reads', 'ref-reads');
    const textCol = makeCol('text', 'ref-text');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol, sequenceCol, readsCol, textCol],
      {
        'ref-reads': { col_type: CaseDbColType.GENETIC_READS },
        'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
        'ref-sequence': { col_type: CaseDbColType.GENETIC_SEQUENCE },
        'ref-text': { col_type: CaseDbColType.TEXT },
      },
    );
    vi.spyOn(CaseTypeUtil, 'getWritableColIds').mockReturnValue(['sample', 'text']);

    expect(UploadUtil.getCompleteCaseTypeColStats(completeCaseType)).toEqual({
      readsColumns: [readsCol],
      sampleIdColumns: [sampleCol],
      sequenceColumns: [sequenceCol],
      writableColumns: [sampleCol, textCol],
    });
  });
});

describe('UploadUtil.getDefaultColumnMappingFormValues', () => {
  it('sets defaults for case ID, mapped columns, and a sole issuer option', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const values = UploadUtil.getDefaultColumnMappingFormValues(
      ['Case ID', 'Sample'],
      [
        makeMappedColumn({ isCaseIdColumn: true, originalIndex: 0 }),
        makeMappedColumn({ col: sampleCol, isSampleIdColumn: true, originalIndex: 1 }),
      ],
      [{ label: 'Issuer one', value: 'issuer-1' }],
    );

    expect(values).toEqual({
      0: 'case_id',
      1: 'sample-col',
      'sample-col': 'issuer-1',
    });
  });

  it('preserves an existing issuer choice instead of replacing it with the first option', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');

    expect(UploadUtil.getDefaultColumnMappingFormValues(
      ['Sample'],
      [makeMappedColumn({
        col: sampleCol,
        isSampleIdColumn: true,
        originalIndex: 0,
        sampleIdentifierIssuerId: 'issuer-2',
      })],
      [
        { label: 'Issuer one', value: 'issuer-1' },
        { label: 'Issuer two', value: 'issuer-2' },
      ],
    )['sample-col']).toBe('issuer-2');
  });

  it('leaves the issuer unset when there are multiple options and none is selected', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');

    expect(UploadUtil.getDefaultColumnMappingFormValues(
      ['Sample'],
      [makeMappedColumn({ col: sampleCol, isSampleIdColumn: true, originalIndex: 0 })],
      [{ label: 'Issuer one', value: 'issuer-1' }, { label: 'Issuer two', value: 'issuer-2' }],
    )['sample-col']).toBeNull();
  });

  it('keeps a mapped non-sample column without adding an issuer field', () => {
    const textCol = makeCol('text-col', 'ref-text');

    expect(UploadUtil.getDefaultColumnMappingFormValues(
      ['Text'],
      [makeMappedColumn({ col: textCol, originalIndex: 0 })],
      [],
    )).toEqual({ 0: 'text-col' });
  });
});

describe('UploadUtil.getMappedColumnsFromFormData', () => {
  it('maps numeric raw-column keys and preserves the issuer while ignoring issuer-only form keys', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol],
      { 'ref-sample': { col_type: CaseDbColType.ID_SAMPLE } },
    );

    expect(UploadUtil.getMappedColumnsFromFormData(
      {
        '-1': 'sample-col',
        0: 'case_id',
        1: 'sample-col',
        2: 'missing-col',
        'sample-col': 'issuer-2',
      },
      [['Case ID', 'Sample', ''], ['case-1', 'sample-1', '']],
      new Map([['sample-col', sampleCol]]),
      completeCaseType,
    )).toEqual([
      {
        col: null,
        isCaseIdColumn: true,
        isSampleIdColumn: false,
        originalIndex: 0,
        originalLabel: 'Case ID',
        sampleIdentifierIssuerId: null,
      },
      {
        col: sampleCol,
        isCaseIdColumn: false,
        isSampleIdColumn: true,
        originalIndex: 1,
        originalLabel: 'Sample',
        sampleIdentifierIssuerId: 'issuer-2',
      },
      {
        col: null,
        isCaseIdColumn: false,
        isSampleIdColumn: false,
        originalIndex: 2,
        originalLabel: '',
        sampleIdentifierIssuerId: null,
      },
    ]);
  });

  it('leaves the issuer unset when a sample ID is mapped without an issuer value', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol],
      { 'ref-sample': { col_type: CaseDbColType.ID_SAMPLE } },
    );

    expect(UploadUtil.getMappedColumnsFromFormData(
      { 0: 'sample-col' },
      [['Sample']],
      new Map([['sample-col', sampleCol]]),
      completeCaseType,
    )[0].sampleIdentifierIssuerId).toBeNull();
  });

  it('skips empty entries and maps unknown column IDs as unmapped selections', () => {
    const completeCaseType = makeCompleteCaseType([]);

    expect(UploadUtil.getMappedColumnsFromFormData(
      { 0: '', 1: 'missing-col' },
      [['A', 'B']],
      new Map(),
      completeCaseType,
    )).toEqual([{
      col: null,
      isCaseIdColumn: false,
      isSampleIdColumn: false,
      originalIndex: 1,
      originalLabel: 'B',
      sampleIdentifierIssuerId: null,
    }]);
  });
});

describe('UploadUtil.getSampleIdColIds', () => {
  it('returns only columns whose ref column has the sample-ID type', () => {
    const sampleCol = makeCol('sample', 'ref-sample');
    const textCol = makeCol('text', 'ref-text');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol, textCol],
      {
        'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
        'ref-text': { col_type: CaseDbColType.TEXT },
      },
    );

    expect(UploadUtil.getSampleIdColIds(completeCaseType)).toEqual(['sample']);
  });
});

describe('UploadUtil.getInitialMappedColumns', () => {
  it('maps known writable columns and retains only case ID or column matches', () => {
    const sampleCol = makeCol('sample-col', 'ref-sample', CaseDbColType.ID_SAMPLE);
    const writableCol = makeCol('writable-col', 'ref-writable');
    const readOnlyCol = makeCol('readonly-col', 'ref-readonly');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol, writableCol, readOnlyCol],
      { 'ref-sample': { col_type: CaseDbColType.ID_SAMPLE } },
    );
    vi.spyOn(CaseTypeUtil, 'getWritableColIds').mockReturnValue(['sample-col', 'writable-col']);
    vi.spyOn(CaseTypeUtil, 'getWritableImportExportColIds').mockReturnValue([
      'sample-col',
      'writable-col',
      'readonly-col',
    ]);

    expect(UploadUtil.getInitialMappedColumns(completeCaseType, [[
      '_case_id',
      '_case_type',
      'sample-col',
      'writable-col',
      'readonly-col',
      'unknown',
    ]])).toEqual([
      makeMappedColumn({
        isCaseIdColumn: true,
        isCol: false,
        originalIndex: 0,
        originalLabel: '_case_id',
      }),
      makeMappedColumn({
        col: sampleCol,
        isCol: false,
        isSampleIdColumn: true,
        originalIndex: 2,
        originalLabel: 'sample-col',
        sampleIdentifierIssuerId: null,
      }),
      makeMappedColumn({
        col: writableCol,
        isCol: false,
        originalIndex: 3,
        originalLabel: 'writable-col',
      }),
    ]);
  });

  it('returns empty when raw data has no headers', () => {
    expect(UploadUtil.getInitialMappedColumns(makeCompleteCaseType([]), [])).toEqual([]);
  });
});

describe('UploadUtil.getSheetNameOptions', () => {
  it('returns sheet options for an XLSX file', async () => {
    const file = await createExcelFile();

    await expect(UploadUtil.getSheetNameOptions(makeFileList([file]))).resolves.toEqual([
      { label: 'Sheet1', value: 'Sheet1' },
    ]);
  });

  it('returns no sheet options for a non-XLSX file', async () => {
    await expect(UploadUtil.getSheetNameOptions(makeFileList([makeFile('data.csv')]))).resolves.toEqual([]);
  });
});

describe('UploadUtil.readRawData', () => {
  it('parses CSV and TSV text files into trimmed cells', async () => {
    await expect(UploadUtil.readRawData(makeFileList([
      makeFile('cases.csv', 0, ' name , value \n Alice , 1 \n'),
    ]))).resolves.toEqual([['name', 'value'], ['Alice', '1']]);
    await expect(UploadUtil.readRawData(makeFileList([
      makeFile('cases.tsv', 0, 'name\tvalue\nAlice\t1'),
    ]))).resolves.toEqual([['name', 'value'], ['Alice', '1']]);
  });

  it('detects tab and semicolon delimiters in TXT files', async () => {
    await expect(UploadUtil.readRawData(makeFileList([
      makeFile('cases.txt', 0, 'name\tvalue\nAlice\t1'),
    ]))).resolves.toEqual([['name', 'value'], ['Alice', '1']]);
    await expect(UploadUtil.readRawData(makeFileList([
      makeFile('cases.txt', 0, 'name;value\nAlice;1'),
    ]))).resolves.toEqual([['name', 'value'], ['Alice', '1']]);
  });

  it('uses comma delimiters when TXT delimiter detection finds no alternatives', async () => {
    await expect(UploadUtil.readRawData(makeFileList([
      makeFile('cases.txt', 0, 'name,value\nAlice,1'),
    ]))).resolves.toEqual([['name', 'value'], ['Alice', '1']]);
  });

  it('reads XLSX data with and without an explicit sheet and maps cell types', async () => {
    const file = await createExcelFile();

    await expect(UploadUtil.readRawData(makeFileList([file]), 'Sheet1')).resolves.toEqual([
      ['name', 'date', 'count', 'empty', 'active'],
      ['Alice', '2024-03-15', '2', '', 'true'],
    ]);
    await expect(UploadUtil.readRawData(makeFileList([file]))).resolves.toEqual([
      ['name', 'date', 'count', 'empty', 'active'],
      ['Alice', '2024-03-15', '2', '', 'true'],
    ]);
  });

  it('rejects unsupported file types and files without enough rows or columns', async () => {
    await expect(UploadUtil.readRawData(makeFileList([makeFile('cases.pdf')]))).rejects.toThrow('Unsupported file format');
    await expect(UploadUtil.readRawData(makeFileList([makeFile('empty.csv', 0, '')]))).rejects.toThrow('does not contain enough data');
    await expect(UploadUtil.readRawData(makeFileList([makeFile('header-only.csv', 0, 'name,value')]))).rejects.toThrow('does not contain enough data');
    await expect(UploadUtil.readRawData(makeFileList([makeFile('one-column.csv', 0, 'name\nAlice')]))).rejects.toThrow('does not contain enough data');
    await expect(UploadUtil.readRawData(makeFileList([makeFile('blank.txt', 0, ' \n \t \n')]))).rejects.toThrow('does not contain enough data');
  });
});

describe('UploadUtil.readFileAsBase64', () => {
  it('reads a file and returns the base64 data without its data URL prefix', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await expect(UploadUtil.readFileAsBase64(file)).resolves.toBe('aGVsbG8=');
  });

  it('rejects when FileReader reports an error', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function dispatchReadError(this: FileReader) {
      this.dispatchEvent(new ProgressEvent('error'));
    });

    await expect(UploadUtil.readFileAsBase64(new File(['x'], 'error.txt'))).rejects.toThrow('File read error');
  });
});

describe('UploadUtil.reportFileUploadProgress', () => {
  it('reports progress proportional to uploaded and current file sizes', () => {
    const onProgress = vi.fn();

    UploadUtil.reportFileUploadProgress({
      endPercentage: 100,
      fileSize: 20,
      message: 'Uploading',
      onProgress,
      startPercentage: 10,
      totalFileSizeToUpload: 100,
      uploadedFileSize: 30,
    });

    expect(onProgress).toHaveBeenCalledWith(55, 'Uploading');
  });
});

describe('UploadUtil.createCases', () => {
  it('uploads cases with their sequences, read sets, and source collection values', async () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const sequenceCol = makeCol('sequence-col', 'ref-sequence');
    const readsCol = makeCol('reads-col', 'ref-reads');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol, sequenceCol, readsCol],
      {
        'ref-reads': { col_type: CaseDbColType.GENETIC_READS },
        'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
        'ref-sequence': { col_type: CaseDbColType.GENETIC_SEQUENCE },
      },
    );
    const response = makeBatchUploadResult([{ id: 'uploaded-case-1' }]);
    const api = registerCaseApi({
      uploadCases: vi.fn().mockResolvedValue({ data: response }),
    });
    const abortController = new AbortController();

    const result = await UploadUtil.createCases({
      assemblyProtocolId: 'assembly-1',
      casesForVerificationFromSourceData: [{
        case: { created_in_data_collection_id: 'source-collection' },
        id: 'case-1',
      } as CaseDbCaseForUpload],
      completeCaseType,
      createdInDataCollectionId: 'default-collection',
      mappedColumns: [makeMappedColumn({
        col: sampleCol,
        isSampleIdColumn: true,
        sampleIdentifierIssuerId: 'issuer-1',
      })],
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [
        makeValidatedCase('case-1', { 'sample-col': 'sample-1' }),
        makeValidatedCase('case-2', { 'sample-col': '' }),
      ],
      sequenceMapping: {
        'case-1': {
          readsFileNames: { 'reads-col': { fwd: 'reads.fq', rev: '' } },
          sequenceFileNames: { 'sequence-col': 'sequence.fa', unused: '' },
        },
        'case-2': {
          readsFileNames: { 'reads-col': { fwd: 'unused.fq', rev: '' } },
          sequenceFileNames: { 'sequence-col': 'unused.fa' },
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: abortController.signal,
    });

    expect(result).toBe(response);
    const uploadRequest: unknown = api.uploadCases.mock.calls[0]?.[0] as unknown;
    expect(uploadRequest).toMatchObject({
      case_batch: {
        cases: [
          {
            case: {
              created_in_data_collection_id: 'source-collection',
              id: 'case-1',
            },
            read_sets: [{
              case_id: 'case-1',
              col_id: 'reads-col',
              other_sample_identifier: { external_id: 'sample-1', identifier_issuer_id: 'issuer-1' },
              protocol_id: 'sequencing-1',
            }],
            seqs: [{
              case_id: 'case-1',
              col_id: 'sequence-col',
              other_sample_identifier: { external_id: 'sample-1', identifier_issuer_id: 'issuer-1' },
              protocol_id: 'assembly-1',
            }],
          },
          {
            case: { created_in_data_collection_id: 'default-collection' },
            read_sets: [],
            seqs: [],
          },
        ],
      },
      case_type_id: 'case-type-1',
      default_created_in_data_collection_id: 'default-collection',
      on_exists: CaseDbUploadAction.UPDATE,
    });
  });

  it('does not upload associated files when no sample identifier column is mapped', async () => {
    const completeCaseType = makeCompleteCaseType([makeCol('text-col', 'ref-text')]);
    const api = registerCaseApi();

    await UploadUtil.createCases({
      assemblyProtocolId: 'assembly-1',
      casesForVerificationFromSourceData: [],
      completeCaseType,
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [],
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [makeValidatedCase('case-1', { 'text-col': 'value' })],
      sequenceMapping: {
        'case-1': {
          readsFileNames: { reads: { fwd: 'reads.fq', rev: '' } },
          sequenceFileNames: { sequence: 'sequence.fa' },
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: new AbortController().signal,
    });

    const request = api.uploadCases.mock.calls[0]?.[0] as {
      case_batch: { cases: Array<{ read_sets: unknown[]; seqs: unknown[] }> };
    };
    expect(request.case_batch.cases[0]).toMatchObject({ read_sets: [], seqs: [] });
  });

  it('skips missing file mappings when an external sample ID is present', async () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol],
      { 'ref-sample': { col_type: CaseDbColType.ID_SAMPLE } },
    );
    const api = registerCaseApi();

    await UploadUtil.createCases({
      assemblyProtocolId: 'assembly-1',
      casesForVerificationFromSourceData: [],
      completeCaseType,
      createdInDataCollectionId: 'collection-1',
      mappedColumns: [makeMappedColumn({ col: sampleCol, isSampleIdColumn: true })],
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [
        makeValidatedCase('case-1', { 'sample-col': 'sample-1' }),
        makeValidatedCase('case-2', { 'sample-col': 'sample-2' }),
      ],
      sequenceMapping: {
        'case-2': {
          readsFileNames: { 'reads-col': { fwd: '', rev: '' } },
          sequenceFileNames: {},
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: new AbortController().signal,
    });

    const request: unknown = api.uploadCases.mock.calls[0]?.[0] as unknown;
    expect(request).toMatchObject({
      case_batch: {
        cases: [
          { read_sets: [], seqs: [] },
          { read_sets: [], seqs: [] },
        ],
      },
    });
  });

  it('supports absent case and collection IDs without failing the upload request', async () => {
    const sampleCol = makeCol('sample-col', 'ref-sample');
    const sequenceCol = makeCol('sequence-col', 'ref-sequence');
    const readsCol = makeCol('reads-col', 'ref-reads');
    const completeCaseType = makeCompleteCaseType(
      [sampleCol, sequenceCol, readsCol],
      {
        'ref-reads': { col_type: CaseDbColType.GENETIC_READS },
        'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
        'ref-sequence': { col_type: CaseDbColType.GENETIC_SEQUENCE },
      },
    );
    const api = registerCaseApi();
    const validatedCase = {
      id: undefined,
      validated_content: { 'sample-col': 'sample-1' },
    } as unknown as CaseDbCaseUploadResult;

    await UploadUtil.createCases({
      assemblyProtocolId: 'assembly-1',
      casesForVerificationFromSourceData: [],
      completeCaseType,
      createdInDataCollectionId: null,
      mappedColumns: [makeMappedColumn({ col: sampleCol, isSampleIdColumn: true })],
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [validatedCase],
      sequenceMapping: {
        undefined: {
          readsFileNames: { 'reads-col': { fwd: '', rev: 'reads.fq' } },
          sequenceFileNames: { 'sequence-col': 'sequence.fa' },
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: new AbortController().signal,
    });

    const request: unknown = api.uploadCases.mock.calls[0]?.[0] as unknown;
    expect(request).toMatchObject({
      case_batch: {
        cases: [{
          read_sets: [{ col_id: 'reads-col' }],
          seqs: [{ col_id: 'sequence-col' }],
        }],
      },
      default_created_in_data_collection_id: undefined,
    });
  });
});

describe('UploadUtil.createCasesAndUploadFiles', () => {
  const createArgs = (
    overrides: Partial<Parameters<typeof UploadUtil.createCasesAndUploadFiles>[0]> = {},
  ): Parameters<typeof UploadUtil.createCasesAndUploadFiles>[0] => ({
    assemblyProtocolId: 'assembly-1',
    casesForVerificationFromSourceData: [],
    completeCaseType: makeCompleteCaseType([]),
    createdInDataCollectionId: 'collection-1',
    mappedColumns: [],
    onComplete: vi.fn(),
    onError: vi.fn(),
    onProgress: vi.fn(),
    sampleIdColId: 'sample-col',
    selectedValidatedCases: [],
    sequenceFilesDataTransfer: makeDataTransfer([]),
    sequenceMapping: {},
    sequencingProtocolId: 'sequencing-1',
    signal: new AbortController().signal,
    ...overrides,
  });

  it('creates cases, uploads files, reports completion, and invalidates case queries', async () => {
    const response = makeBatchUploadResult([{ id: 'case-1' }]);
    const onProgress = vi.fn();
    const args = createArgs({ onProgress });
    const createCasesSpy = vi.spyOn(UploadUtil, 'createCases').mockResolvedValue(response);
    const uploadFilesSpy = vi.spyOn(UploadUtil, 'uploadFilesForCases').mockResolvedValue(undefined);
    const queryClientService = {
      getQueryKeyDependencies: vi.fn().mockReturnValue([['cases']]),
      invalidateQueryKeys: vi.fn().mockResolvedValue(undefined),
    };
    container.registerInstance(QueryClientService, queryClientService as unknown as QueryClientService);

    await expect(UploadUtil.createCasesAndUploadFiles(args)).resolves.toBe(response);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress.mock.calls[0]?.[0]).toBe(0);
    expect(onProgress.mock.calls.at(-1)?.[0]).toBe(100);
    expect(createCasesSpy).toHaveBeenCalledWith(args);
    expect(uploadFilesSpy).toHaveBeenCalledWith({
      ...args,
      caseBatchUploadResult: response,
      endPercentage: 99,
      startPercentage: 1,
    });
    expect(queryClientService.getQueryKeyDependencies).toHaveBeenCalled();
    expect(queryClientService.invalidateQueryKeys).toHaveBeenCalledWith([['cases']]);
    expect(args.onComplete).toHaveBeenCalledOnce();
    expect(args.onError).not.toHaveBeenCalled();
  });

  it('reports a failed case batch and rethrows UploadError', async () => {
    const failedResult = makeBatchUploadResult([], CaseDbEtlStatus.FAILED);
    const args = createArgs();
    vi.spyOn(UploadUtil, 'createCases').mockResolvedValue(failedResult);
    const uploadFilesSpy = vi.spyOn(UploadUtil, 'uploadFilesForCases').mockResolvedValue(undefined);

    await expect(UploadUtil.createCasesAndUploadFiles(args)).rejects.toBeInstanceOf(UploadError);

    expect(uploadFilesSpy).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(expect.any(UploadError));
    expect(args.onComplete).not.toHaveBeenCalled();
  });

  it('wraps non-Error failures for the callback and rethrows the original value', async () => {
    const args = createArgs();
    vi.spyOn(UploadUtil, 'createCases').mockRejectedValue('upload failure');

    await expect(UploadUtil.createCasesAndUploadFiles(args)).rejects.toBe('upload failure');

    expect(args.onError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Unknown error occurred during upload',
    }));
  });
});

describe('UploadUtil.uploadFilesForCases', () => {
  it('uploads matched sequence and reads files with formats, compression, and progress', async () => {
    const api = registerCaseApi();
    const readFileSpy = vi.spyOn(UploadUtil, 'readFileAsBase64').mockResolvedValue('base64-content');
    const onProgress = vi.fn();
    const files = [
      makeFile('sequence.fa.gz', 10),
      makeFile('zero-sequence.fa', 0),
      makeFile('reads_R1.fastq.gzip', 20),
      makeFile('reads_R2.fq', 30),
      makeFile('zero_R1.fq', 0),
      makeFile('zero_R2.fq', 0),
    ];
    const result = makeBatchUploadResult([{ id: 'uploaded-case' }]);
    const signal = new AbortController().signal;

    await UploadUtil.uploadFilesForCases({
      assemblyProtocolId: 'assembly-1',
      caseBatchUploadResult: result,
      completeCaseType: makeCompleteCaseType([]),
      createdInDataCollectionId: 'collection-1',
      endPercentage: 100,
      mappedColumns: [],
      onComplete: vi.fn(),
      onError: vi.fn(),
      onProgress,
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [makeValidatedCase('source-case', {})],
      sequenceFilesDataTransfer: makeDataTransfer(files),
      sequenceMapping: {
        'source-case': {
          readsFileNames: {
            'empty-reads': { fwd: '', rev: '' },
            'missing-reads': { fwd: 'missing_R1.fq', rev: 'missing_R2.fq' },
            'reads-col': { fwd: 'reads_R1.fastq.gzip', rev: 'reads_R2.fq' },
            'zero-forward': { fwd: 'zero_R1.fq', rev: '' },
            'zero-reverse': { fwd: '', rev: 'zero_R2.fq' },
          },
          sequenceFileNames: {
            'empty-sequence': '',
            'missing-sequence': 'missing.fa',
            'sequence-col': 'sequence.fa.gz',
            'zero-sequence': 'zero-sequence.fa',
          },
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal,
      startPercentage: 10,
    });

    expect(readFileSpy).toHaveBeenCalledTimes(5);
    expect(api.createFileForSeq).toHaveBeenCalledWith('uploaded-case', 'sequence-col', {
      file_compression: CaseDbFileCompression.GZIP,
      file_content: 'base64-content',
      file_format: CaseDbSeqFileFormat.FASTA,
    }, { signal });
    expect(api.createFileForReadSet).toHaveBeenNthCalledWith(1, 'uploaded-case', 'reads-col', {
      file_compression: CaseDbFileCompression.GZIP,
      file_content: 'base64-content',
      file_format: CaseDbReadsFileFormat.FASTQ,
      is_fwd: true,
    }, { signal });
    expect(api.createFileForReadSet).toHaveBeenNthCalledWith(2, 'uploaded-case', 'reads-col', {
      file_compression: CaseDbFileCompression.NONE,
      file_content: 'base64-content',
      file_format: CaseDbReadsFileFormat.FASTQ,
      is_fwd: false,
    }, { signal });
    expect(api.createFileForReadSet).toHaveBeenCalledTimes(4);
    expect(onProgress).toHaveBeenCalledTimes(5);
  });

  it('handles files disappearing between mapping and upload passes', async () => {
    const api = registerCaseApi();
    const sequenceFile = makeFile('sequence.fa', 10);
    const readsFile = makeFile('reads.fq', 20);
    const populatedFiles = makeFileList([sequenceFile, readsFile]);
    const emptyFiles = makeFileList([]);
    let fileListReads = 0;
    const sequenceFilesDataTransfer = {
      get files() {
        fileListReads += 1;
        return fileListReads <= 2 ? populatedFiles : emptyFiles;
      },
    } as unknown as DataTransfer;
    const readFileSpy = vi.spyOn(UploadUtil, 'readFileAsBase64');

    await UploadUtil.uploadFilesForCases({
      assemblyProtocolId: 'assembly-1',
      caseBatchUploadResult: makeBatchUploadResult([{ id: 'uploaded-case' }]),
      completeCaseType: makeCompleteCaseType([]),
      createdInDataCollectionId: 'collection-1',
      endPercentage: 100,
      mappedColumns: [],
      onComplete: vi.fn(),
      onError: vi.fn(),
      onProgress: vi.fn(),
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [makeValidatedCase('source-case', {})],
      sequenceFilesDataTransfer,
      sequenceMapping: {
        'source-case': {
          readsFileNames: { reads: { fwd: 'reads.fq', rev: '' } },
          sequenceFileNames: { sequence: 'sequence.fa' },
        },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: new AbortController().signal,
      startPercentage: 1,
    });

    expect(fileListReads).toBeGreaterThan(2);
    expect(api.createFileForSeq).not.toHaveBeenCalled();
    expect(api.createFileForReadSet).not.toHaveBeenCalled();
    expect(readFileSpy).not.toHaveBeenCalled();
  });

  it('skips files missing from the transfer and mappings without files', async () => {
    const api = registerCaseApi();
    const onProgress = vi.fn();

    await UploadUtil.uploadFilesForCases({
      assemblyProtocolId: 'assembly-1',
      caseBatchUploadResult: makeBatchUploadResult([{ id: 'case-1' }, { id: 'case-2' }]),
      completeCaseType: makeCompleteCaseType([]),
      createdInDataCollectionId: 'collection-1',
      endPercentage: 100,
      mappedColumns: [],
      onComplete: vi.fn(),
      onError: vi.fn(),
      onProgress,
      sampleIdColId: 'sample-col',
      selectedValidatedCases: [makeValidatedCase('source-1', {}), makeValidatedCase('source-2', {})],
      sequenceFilesDataTransfer: makeDataTransfer([makeFile('present.fa')]),
      sequenceMapping: {
        'source-1': { readsFileNames: {}, sequenceFileNames: { sequence: 'missing.fa' } },
      },
      sequencingProtocolId: 'sequencing-1',
      signal: new AbortController().signal,
      startPercentage: 1,
    });

    expect(api.createFileForSeq).not.toHaveBeenCalled();
    expect(api.createFileForReadSet).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe('UploadUtil.getEpiUploadSequenceMapping', () => {
  beforeEach(() => {
    vi.spyOn(CaseTypeUtil, 'getWritableColIds').mockReturnValue([]);
  });

  const makeSequenceCaseType = (includeSampleId = true): CaseDbCompleteCaseType => {
    const cols = [
      ...(includeSampleId ? [makeCol('sample-col', 'ref-sample')] : []),
      makeCol('sequence-col', 'ref-sequence'),
      makeCol('reads-col', 'ref-reads'),
    ];
    return makeCompleteCaseType(cols, {
      'ref-reads': { col_type: CaseDbColType.GENETIC_READS },
      'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
      'ref-sequence': { col_type: CaseDbColType.GENETIC_SEQUENCE },
    });
  };

  it('returns an empty mapping when no files are provided', () => {
    expect(UploadUtil.getEpiUploadSequenceMapping(makeSequenceCaseType(), [], makeDataTransfer([]))).toEqual({});
  });

  it('maps a genome file and sorted forward/reverse reads to their columns', () => {
    const completeCaseType = makeSequenceCaseType();
    const files = [
      makeFile('sample+1.fa.gz'),
      makeFile('sample+1_R2.fastq.gz'),
      makeFile('sample+1_R1.fastq'),
      makeFile('different-sample.fa'),
      makeFile('sample+1.txt'),
    ];
    const result = UploadUtil.getEpiUploadSequenceMapping(
      completeCaseType,
      [makeValidatedCase('case-1', { 'sample-col': 'sample+1' })],
      makeDataTransfer(files),
    );

    expect(result['case-1']).toEqual({
      readsFileNames: {
        'reads-col': {
          fwd: 'sample+1_R1.fastq',
          rev: 'sample+1_R2.fastq.gz',
        },
      },
      sequenceFileNames: {
        'sequence-col': 'sample+1.fa.gz',
      },
    });
  });

  it('returns empty file slots when no sample ID value is available', () => {
    const result = UploadUtil.getEpiUploadSequenceMapping(
      makeSequenceCaseType(),
      [makeValidatedCase('case-1', {})],
      makeDataTransfer([makeFile('sample.fa')]),
    );

    expect(result['case-1']).toEqual({ readsFileNames: {}, sequenceFileNames: {} });
  });

  it('keeps an empty mapping entry when neither sequences nor reads has exactly one column', () => {
    const completeCaseType = makeCompleteCaseType([makeCol('text-col', 'ref-text')]);

    expect(UploadUtil.getEpiUploadSequenceMapping(
      completeCaseType,
      [makeValidatedCase('case-1', {})],
      makeDataTransfer([makeFile('sample.fa')]),
    )).toEqual({
      'case-1': { readsFileNames: {}, sequenceFileNames: {} },
    });
  });

  it('supports a single sequence column without reads columns', () => {
    const completeCaseType = makeCompleteCaseType(
      [
        makeCol('sample-col', 'ref-sample'),
        makeCol('sequence-col', 'ref-sequence'),
      ],
      {
        'ref-sample': { col_type: CaseDbColType.ID_SAMPLE },
        'ref-sequence': { col_type: CaseDbColType.GENETIC_SEQUENCE },
      },
    );

    expect(UploadUtil.getEpiUploadSequenceMapping(
      completeCaseType,
      [makeValidatedCase('case-1', { 'sample-col': 'sample-1' })],
      makeDataTransfer([makeFile('sample-1.fa')]),
    )['case-1']).toEqual({
      readsFileNames: {},
      sequenceFileNames: { 'sequence-col': 'sample-1.fa' },
    });
  });

  it('does not assign ambiguous file matches', () => {
    const completeCaseType = makeSequenceCaseType();
    const result = UploadUtil.getEpiUploadSequenceMapping(
      completeCaseType,
      [makeValidatedCase('case-1', { 'sample-col': 'sample-1' })],
      makeDataTransfer([
        makeFile('sample-1-a.fa'),
        makeFile('sample-1-b.fa'),
        makeFile('sample-1-a.fq'),
        makeFile('sample-1-b.fq'),
        makeFile('sample-1-c.fq'),
      ]),
    );

    expect(result['case-1']).toEqual({
      readsFileNames: { 'reads-col': { fwd: '', rev: '' } },
      sequenceFileNames: { 'sequence-col': '' },
    });
  });
});

describe('UploadUtil.getSequenceMappingStats', () => {
  it('counts genetic files and separates mapped from unmapped files without duplicates', () => {
    const stats = UploadUtil.getSequenceMappingStats({
      'case-1': {
        readsFileNames: {
          reads: { fwd: 'reads_R1.fq', rev: '' },
        },
        sequenceFileNames: {
          sequence: 'genome.fa.gz',
        },
      },
      'case-2': {
        readsFileNames: {
          reads: { fwd: 'reads_R1.fq', rev: 'reads_R2.fastq' },
        },
        sequenceFileNames: {
          sequence: '',
        },
      },
    }, makeDataTransfer([
      makeFile('genome.fa.gz'),
      makeFile('reads_R1.fq'),
      makeFile('reads_R2.fastq'),
      makeFile('unmapped.fasta'),
      makeFile('notes.txt'),
    ]));

    expect(stats).toEqual({
      mappedFiles: ['genome.fa.gz', 'reads_R1.fq', 'reads_R2.fastq'],
      mappedReadsFiles: ['reads_R1.fq', 'reads_R2.fastq'],
      mappedSequenceFiles: ['genome.fa.gz'],
      numberOfFilesToMap: 4,
      unmappedFileNames: ['unmapped.fasta'],
      unmappedReadsFiles: [],
      unmappedSequenceFiles: ['unmapped.fasta'],
    });
  });

  it('returns zero counts when no supported genetic files are present', () => {
    expect(UploadUtil.getSequenceMappingStats({}, makeDataTransfer([makeFile('notes.txt')]))).toEqual({
      mappedFiles: [],
      mappedReadsFiles: [],
      mappedSequenceFiles: [],
      numberOfFilesToMap: 0,
      unmappedFileNames: [],
      unmappedReadsFiles: [],
      unmappedSequenceFiles: [],
    });
  });
});

describe('UploadUtil.hasReadsColumnMapped and hasSequenceColumnMapped', () => {
  const completeCaseTypeColStats: UploadCompleteColStats = {
    readsColumns: [makeCol('reads-col', 'ref-reads')],
    sampleIdColumns: [],
    sequenceColumns: [makeCol('sequence-col', 'ref-sequence')],
    writableColumns: [],
  };

  it('detects mapped reads and sequence columns', () => {
    expect(UploadUtil.hasReadsColumnMapped([
      makeMappedColumn({ col: makeCol('reads-col', 'ref-reads') }),
    ], completeCaseTypeColStats)).toBe(true);
    expect(UploadUtil.hasSequenceColumnMapped([
      makeMappedColumn({ col: makeCol('sequence-col', 'ref-sequence') }),
    ], completeCaseTypeColStats)).toBe(true);
  });

  it('returns false when no mapped column matches', () => {
    expect(UploadUtil.hasReadsColumnMapped([
      makeMappedColumn({ col: makeCol('other-col', 'ref-other') }),
    ], completeCaseTypeColStats)).toBe(false);
    expect(UploadUtil.hasSequenceColumnMapped([], completeCaseTypeColStats)).toBe(false);
  });
});

describe('UploadUtil column and file name predicates', () => {
  it('matches known date, case ID, and case type aliases case-insensitively', () => {
    expect(UploadUtil.isCaseDateColumn('TIMED_AT')).toBe(true);
    expect(UploadUtil.isCaseDateColumn('other')).toBe(false);
    expect(UploadUtil.isCaseIdColumn('Case ID')).toBe(true);
    expect(UploadUtil.isCaseIdColumn('other')).toBe(false);
    expect(UploadUtil.isCol('CASE TYPE')).toBe(true);
    expect(UploadUtil.isCol('other')).toBe(false);
  });

  it.each([
    ['sample.fa', true],
    ['sample.fasta', true],
    ['sample.fa.gz', true],
    ['sample.fasta.gz', true],
    ['sample.FASTA.GZ', true],
    ['sample.fq', false],
    ['sample.fastq', false],
  ])('recognizes genome file %s', (fileName, expected) => {
    expect(UploadUtil.isGenomeFile(fileName)).toBe(expected);
  });

  it.each([
    ['reads.fq', true],
    ['reads.fastq', true],
    ['reads.fq.gz', true],
    ['reads.fastq.gz', true],
    ['reads.FASTQ.GZ', true],
    ['reads.fa', false],
  ])('recognizes reads file %s', (fileName, expected) => {
    expect(UploadUtil.isReadsFile(fileName)).toBe(expected);
  });

  it('recognizes supported genetic, text, and Excel file names', () => {
    expect(UploadUtil.isSupportedGeneticFile('genome.fa')).toBe(true);
    expect(UploadUtil.isSupportedGeneticFile('reads.fastq')).toBe(true);
    expect(UploadUtil.isSupportedGeneticFile('notes.txt')).toBe(false);
    expect(UploadUtil.isTextFile('data.csv')).toBe(true);
    expect(UploadUtil.isTextFile('data.tsv')).toBe(true);
    expect(UploadUtil.isTextFile('data.txt')).toBe(true);
    expect(UploadUtil.isTextFile('data.xlsx')).toBe(false);
    expect(UploadUtil.isTextFile(undefined)).toBeUndefined();
    expect(UploadUtil.isXlsxFile('data.xlsx')).toBe(true);
    expect(UploadUtil.isXlsxFile('data.csv')).toBe(false);
    expect(UploadUtil.isXlsxFile(undefined)).toBeUndefined();
  });

  it('matches labels against label, code, and ID, while rejecting empty or invalid labels', () => {
    const col = makeCol('column-id', 'ref-col', CaseDbColType.TEXT, 'dim-1', {
      code: 'CODE',
      label: 'Column label',
    });

    expect(UploadUtil.matchColumnLabel('COLUMN LABEL', col)).toBe(true);
    expect(UploadUtil.matchColumnLabel('code', col)).toBe(true);
    expect(UploadUtil.matchColumnLabel('COLUMN-ID', col)).toBe(true);
    expect(UploadUtil.matchColumnLabel('unknown', col)).toBe(false);
    expect(UploadUtil.matchColumnLabel('', col)).toBe(false);
    expect(UploadUtil.matchColumnLabel(null, col)).toBe(false);
  });
});
