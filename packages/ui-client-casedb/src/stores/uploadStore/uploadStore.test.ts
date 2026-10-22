import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import i18next from 'i18next';
import { container } from 'tsyringe';
import type {
  CaseDbCaseForUpload,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

import { UPLOAD_STEP } from '../../models/upload.models';
import type {
  UploadMappedColumn,
  UploadSequenceMapping,
} from '../../models/upload.models';
import { UploadUtil } from '../../utils/UploadUtil';

import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
} from './uploadStore';

class TestDataTransfer {
  public readonly items = {
    add: (file: File) => {
      this.fileItems.push(file);
      return {} as unknown as DataTransferItem;
    },
  };

  public get files(): FileList {
    const files = [...this.fileItems];
    return Object.assign(files, {
      item: (index: number) => files[index] ?? null,
    });
  }

  private readonly fileItems: File[] = [];
}

const createCompleteCaseType = (id: string, access: Record<string, { add_case_set: boolean; is_private: boolean }> = {}): CaseDbCompleteCaseType => ({
  case_type_access_abacs: access,
  id,
} as unknown as CaseDbCompleteCaseType);

const createMappedColumn = (id: string): UploadMappedColumn => ({
  col: { id } as CaseDbCol,
  originalIndex: 0,
  originalLabel: id,
});

const createSequenceMapping = (): UploadSequenceMapping => ({
  'case-1': {
    readsFileNames: {},
    sequenceFileNames: { 'col-1': 'sequence.fasta' },
  },
});

const createSequenceMappingStats = (numberOfFilesToMap: number) => ({
  mappedFiles: [] as string[],
  mappedReadsFiles: [] as string[],
  mappedSequenceFiles: [] as string[],
  numberOfFilesToMap,
  unmappedFileNames: [] as string[],
  unmappedReadsFiles: [] as string[],
  unmappedSequenceFiles: [] as string[],
});

const createUploadStoreForTest = (stepOrder: UPLOAD_STEP[] = STEP_ORDER_UPLOAD, overrides: Partial<Parameters<typeof createUploadStore>[0]> = {}) => {
  const queryClientService = container.resolve(QueryClientService);
  const store = createUploadStore({
    stepOrder,
    ...overrides,
  });
  return { queryClientService, store };
};

const createFileList = (name: string): FileList => {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(new File(['file contents'], name));
  return dataTransfer.files;
};

beforeAll(async () => {
  vi.stubGlobal('DataTransfer', TestDataTransfer);
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Error reading file': 'Error reading file',
          'Error reading sheet': 'Error reading sheet',
        },
      },
    },
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
  container.resolve(QueryClientService).queryClient.clear();
});

describe('createUploadStore', () => {
  it('initializes upload state and handles step boundaries', () => {
    const { store } = createUploadStoreForTest();
    const state = store.getState();

    expect(state.activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
    expect(state.stepOrder).toEqual(STEP_ORDER_UPLOAD);
    expect(state.sequenceMapping).toEqual({});
    expect(state.sequenceFilesDataTransfer).toBeInstanceOf(DataTransfer);
    expect(state.findNextStep(UPLOAD_STEP.SELECT_FILE)).toBe(UPLOAD_STEP.MAP_COLUMNS);
    expect(state.findNextStep(UPLOAD_STEP.CREATE_CASES)).toBeNull();
    expect(state.findNextStep(99 as UPLOAD_STEP)).toBeNull();
    expect(state.findPreviousStep(UPLOAD_STEP.SELECT_FILE)).toBeNull();
    expect(state.findPreviousStep(UPLOAD_STEP.PREVIEW)).toBe(UPLOAD_STEP.MAP_COLUMNS);
    expect(state.findPreviousStep(99 as UPLOAD_STEP)).toBeNull();

    state.goToPreviousStep();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });

  it('invalidates validation when the store is destroyed', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);

    await store.getState().destroy();

    expect(invalidateQueryKeys).toHaveBeenCalledWith([store.getState().validateCasesQueryKey]);
  });

  it('goes backward through the sequence-mapping step only when files remain to map', () => {
    const { store } = createUploadStoreForTest([
      UPLOAD_STEP.SELECT_FILE,
      UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      UPLOAD_STEP.MAP_SEQUENCES,
      UPLOAD_STEP.CREATE_CASES,
    ]);
    const getStats = vi.spyOn(UploadUtil, 'getSequenceMappingStats')
      .mockReturnValueOnce(createSequenceMappingStats(0))
      .mockReturnValueOnce(createSequenceMappingStats(1));
    store.setState({ activeStep: UPLOAD_STEP.CREATE_CASES });

    store.getState().goToPreviousStep();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);

    store.setState({ activeStep: UPLOAD_STEP.CREATE_CASES });
    store.getState().goToPreviousStep();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.MAP_SEQUENCES);
    expect(getStats).toHaveBeenCalledTimes(2);
  });

  it('initializes and resets column mappings while advancing', async () => {
    const { store } = createUploadStoreForTest();
    const completeCaseType = createCompleteCaseType('case-type-1');
    const previousMapping = createMappedColumn('previous');
    const nextMapping = createMappedColumn('next');
    const getInitialMappedColumns = vi.spyOn(UploadUtil, 'getInitialMappedColumns').mockReturnValue([nextMapping]);
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');
    store.setState({
      completeCaseType,
      mappedColumns: [previousMapping],
      rawData: [['case id']],
      shouldResetColumnMapping: true,
    });

    await store.getState().goToNextStep();

    expect(getInitialMappedColumns).toHaveBeenCalledWith(completeCaseType, [['case id']]);
    expect(showNotification).toHaveBeenCalledOnce();
    expect(store.getState().mappedColumns).toEqual([nextMapping]);
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.MAP_COLUMNS);
    expect(store.getState().shouldResetColumnMapping).toBe(false);
  });

  it('keeps existing mappings when no reset is required and creates mappings for an empty selection', async () => {
    const { store } = createUploadStoreForTest([UPLOAD_STEP.SELECT_FILE, UPLOAD_STEP.MAP_COLUMNS]);
    const completeCaseType = createCompleteCaseType('case-type-1');
    const existingMapping = createMappedColumn('existing');
    const createMappings = vi.spyOn(UploadUtil, 'getInitialMappedColumns').mockReturnValue([createMappedColumn('new')]);
    store.setState({
      activeStep: UPLOAD_STEP.SELECT_FILE,
      completeCaseType,
      mappedColumns: [existingMapping],
      rawData: [['case id']],
      shouldResetColumnMapping: false,
    });

    await store.getState().goToNextStep();
    expect(createMappings).not.toHaveBeenCalled();
    expect(store.getState().mappedColumns).toEqual([existingMapping]);

    store.setState({
      activeStep: UPLOAD_STEP.SELECT_FILE,
      mappedColumns: [],
    });
    await store.getState().goToNextStep();
    expect(createMappings).toHaveBeenCalledWith(completeCaseType, [['case id']]);
    expect(store.getState().mappedColumns).toEqual([createMappedColumn('new')]);
  });

  it('builds case previews when advancing to the preview step', async () => {
    const { store } = createUploadStoreForTest([UPLOAD_STEP.MAP_COLUMNS, UPLOAD_STEP.PREVIEW]);
    const completeCaseType = createCompleteCaseType('case-type-1');
    const mappedColumns = [createMappedColumn('col-1')];
    const rawData = [['case id'], ['case-1']];
    const casesForUpload = [{ id: 'case-1' }] as CaseDbCaseForUpload[];
    const getCasesForUpload = vi.spyOn(UploadUtil, 'getCasesForUpload').mockReturnValue(casesForUpload);
    store.setState({
      activeStep: UPLOAD_STEP.MAP_COLUMNS,
      completeCaseType,
      createdInDataCollectionId: 'collection-1',
      mappedColumns,
      rawData,
    });

    await store.getState().goToNextStep();

    expect(getCasesForUpload).toHaveBeenCalledWith({
      caseTypeId: completeCaseType.id,
      createdInDataCollectionId: 'collection-1',
      mappedColumns,
      rawData,
    });
    expect(store.getState().casesForVerificationFromSourceData).toEqual(casesForUpload);
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.PREVIEW);
  });

  it('resets sequence mapping and skips the mapping step when there are no files to map', async () => {
    const { store } = createUploadStoreForTest([
      UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      UPLOAD_STEP.MAP_SEQUENCES,
      UPLOAD_STEP.CREATE_CASES,
    ]);
    const sequenceMapping = createSequenceMapping();
    const nextSequenceMapping: UploadSequenceMapping = {};
    const getMapping = vi.spyOn(UploadUtil, 'getEpiUploadSequenceMapping').mockReturnValue(nextSequenceMapping);
    vi.spyOn(UploadUtil, 'getSequenceMappingStats').mockReturnValue(createSequenceMappingStats(0));
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');
    store.setState({
      activeStep: UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      completeCaseType: createCompleteCaseType('case-type-1'),
      sequenceMapping,
      shouldResetSequenceMapping: true,
    });

    await store.getState().goToNextStep();

    expect(showNotification).toHaveBeenCalledOnce();
    expect(getMapping).toHaveBeenCalledOnce();
    expect(store.getState().sequenceMapping).toEqual(nextSequenceMapping);
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.CREATE_CASES);
    expect(store.getState().shouldResetSequenceMapping).toBe(false);
  });

  it('retains the sequence mapping step when files still need mapping', async () => {
    const { store } = createUploadStoreForTest([
      UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      UPLOAD_STEP.MAP_SEQUENCES,
      UPLOAD_STEP.CREATE_CASES,
    ]);
    const getMapping = vi.spyOn(UploadUtil, 'getEpiUploadSequenceMapping');
    vi.spyOn(UploadUtil, 'getSequenceMappingStats').mockReturnValue(createSequenceMappingStats(1));
    store.setState({
      activeStep: UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      completeCaseType: createCompleteCaseType('case-type-1'),
      sequenceMapping: {},
      shouldResetSequenceMapping: false,
    });

    await store.getState().goToNextStep();

    expect(getMapping).not.toHaveBeenCalled();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.MAP_SEQUENCES);
  });

  it('does not advance beyond the final step', async () => {
    const { store } = createUploadStoreForTest([UPLOAD_STEP.SELECT_FILE]);

    await store.getState().goToNextStep();

    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });
});

describe('upload store mutations', () => {
  it('resets and invalidates validation queries', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);
    const removeQueries = vi.spyOn(queryClientService, 'removeQueries').mockImplementation(() => undefined);
    const validateCasesQueryKey = store.getState().validateCasesQueryKey;
    store.setState({
      activeStep: UPLOAD_STEP.PREVIEW,
      fileName: 'cases.csv',
      rawData: [['case id']],
    });

    await store.getState().reset();

    expect(invalidateQueryKeys).toHaveBeenCalledWith([validateCasesQueryKey]);
    expect(removeQueries).toHaveBeenCalledWith([validateCasesQueryKey]);
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
    expect(store.getState().fileName).toBeNull();
    expect(store.getState().rawData).toBeNull();
  });

  it('sets case type, columns, created-in data collection, options, and sequence mapping', () => {
    const { store } = createUploadStoreForTest();
    const cols = [{ id: 'col-1' } as CaseDbCol];
    const options: OptionBase<string>[] = [{ label: 'Collection one', value: 'collection-1' }];
    const dataTransfer = store.getState().sequenceFilesDataTransfer;

    store.getState().setCaseTypeId('case-type-1');
    store.getState().setCols(cols);
    store.getState().setCreatedInDataCollectionId('collection-1');
    store.getState().setDataCollectionOptions(options);
    store.getState().setSequenceMapping(createSequenceMapping());
    store.getState().setSequenceFilesDataTransfer(dataTransfer);

    expect(store.getState().caseTypeId).toBe('case-type-1');
    expect(store.getState().cols).toEqual(cols);
    expect(store.getState().createdInDataCollectionId).toBe('collection-1');
    expect(store.getState().dataCollectionOptions).toEqual(options);
    expect(store.getState().sequenceMapping).toEqual(createSequenceMapping());
    expect(store.getState().shouldResetSequenceMapping).toBe(false);
  });

  it('marks sequence mappings for reset when uploaded files change', () => {
    const { store } = createUploadStoreForTest();
    const dataTransfer = new DataTransfer();
    store.getState().setSequenceMapping(createSequenceMapping());

    store.getState().setSequenceFilesDataTransfer(dataTransfer);

    expect(store.getState().sequenceFilesDataTransfer).toBe(dataTransfer);
    expect(store.getState().shouldResetSequenceMapping).toBe(true);
  });

  it('invalidates validation when mapped columns change', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);
    const mappedColumns = [createMappedColumn('col-1')];

    await store.getState().setMappedColumns(mappedColumns);

    expect(store.getState().mappedColumns).toEqual(mappedColumns);
    expect(invalidateQueryKeys).toHaveBeenCalledWith([store.getState().validateCasesQueryKey]);
  });

  it('selects a single valid private data collection when the case type changes', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);
    const completeCaseType = createCompleteCaseType('case-type-1', {
      'collection-1': { add_case_set: true, is_private: true },
      'collection-2': { add_case_set: false, is_private: true },
    });
    store.getState().setDataCollectionOptions([
      { label: 'Collection one', value: 'collection-1' },
      { label: 'Collection two', value: 'collection-2' },
    ]);

    await store.getState().setCompleteCaseType(completeCaseType);

    expect(invalidateQueryKeys).toHaveBeenCalledWith([store.getState().validateCasesQueryKey]);
    expect(store.getState().shouldResetColumnMapping).toBe(true);
    expect(store.getState().createdInDataCollectionOptions).toEqual([{ label: 'Collection one', value: 'collection-1' }]);
    expect(store.getState().createdInDataCollectionId).toBe('collection-1');
  });

  it('clears an invalid created-in collection and preserves unchanged case types', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);
    const completeCaseType = createCompleteCaseType('case-type-1', {
      'collection-1': { add_case_set: true, is_private: true },
    });
    store.setState({
      completeCaseType: createCompleteCaseType('case-type-old'),
      createdInDataCollectionId: 'invalid-collection',
      dataCollectionOptions: [{ label: 'Collection one', value: 'collection-1' }],
    });

    await store.getState().setCompleteCaseType(completeCaseType);
    expect(store.getState().createdInDataCollectionId).toBeNull();

    invalidateQueryKeys.mockClear();
    await store.getState().setCompleteCaseType(completeCaseType);
    expect(invalidateQueryKeys).not.toHaveBeenCalled();
  });

  it('retains a valid created-in collection and permits multiple valid choices', async () => {
    const { store } = createUploadStoreForTest();
    const validCaseType = createCompleteCaseType('case-type-1', {
      'collection-1': { add_case_set: true, is_private: true },
      'collection-2': { add_case_set: true, is_private: true },
    });
    store.setState({
      completeCaseType: createCompleteCaseType('case-type-old'),
      createdInDataCollectionId: 'collection-1',
      dataCollectionOptions: [
        { label: 'Collection one', value: 'collection-1' },
        { label: 'Collection two', value: 'collection-2' },
      ],
    });

    await store.getState().setCompleteCaseType(validCaseType);

    expect(store.getState().createdInDataCollectionOptions).toHaveLength(2);
    expect(store.getState().createdInDataCollectionId).toBe('collection-1');
  });
});

describe('upload file parsing', () => {
  it('clears file state when the file list is empty', async () => {
    const { store } = createUploadStoreForTest();
    const readRawData = vi.spyOn(UploadUtil, 'readRawData');
    const fileList = new DataTransfer().files;

    await store.getState().setFileList(fileList);

    expect(readRawData).not.toHaveBeenCalled();
    expect(store.getState().fileList).toBeNull();
    expect(store.getState().fileName).toBeNull();
    expect(store.getState().rawData).toBeNull();
  });

  it('reads text files and keeps multiple sheet choices for selection', async () => {
    const { store } = createUploadStoreForTest();
    const rawData = [['case id'], ['case-1']];
    const getInitialCaseType = createCompleteCaseType('matched-case-type');
    const readRawData = vi.spyOn(UploadUtil, 'readRawData').mockResolvedValue(rawData);
    vi.spyOn(UploadUtil, 'isXlsxFile').mockReturnValue(false);
    vi.spyOn(UploadUtil, 'getSheetNameOptions').mockResolvedValue([
      { label: 'Sheet one', value: 'Sheet one' },
      { label: 'Sheet two', value: 'Sheet two' },
    ]);
    vi.spyOn(UploadUtil, 'getCaseTypeFromColumnLabels').mockReturnValue(getInitialCaseType);
    const fileList = createFileList('cases.csv');

    await store.getState().setFileList(fileList);

    expect(readRawData).toHaveBeenCalledWith(fileList);
    expect(store.getState().fileName).toBe('cases.csv');
    expect(store.getState().rawData).toEqual(rawData);
    expect(store.getState().caseTypeId).toBe('matched-case-type');
    expect(store.getState().sheetOptions).toHaveLength(2);
  });

  it('reads a selected spreadsheet sheet when one sheet is available', async () => {
    const { store } = createUploadStoreForTest();
    const rawData = [['case id'], ['case-1']];
    const fileList = createFileList('cases.xlsx');
    const readRawData = vi.spyOn(UploadUtil, 'readRawData').mockResolvedValue(rawData);
    vi.spyOn(UploadUtil, 'isXlsxFile').mockReturnValue(true);
    vi.spyOn(UploadUtil, 'getSheetNameOptions').mockResolvedValue([{ label: 'Cases', value: 'Cases' }]);
    vi.spyOn(UploadUtil, 'getCaseTypeFromColumnLabels').mockReturnValue(undefined);

    await store.getState().setFileList(fileList);

    expect(readRawData).toHaveBeenCalledWith(fileList, 'Cases');
    expect(store.getState().sheet).toBe('Cases');
    expect(store.getState().rawData).toEqual(rawData);
    expect(store.getState().sheetOptions).toEqual([{ label: 'Cases', value: 'Cases' }]);
  });

  it('reports file parsing errors and clears the failed file', async () => {
    const { store } = createUploadStoreForTest();
    const fileList = createFileList('cases.csv');
    vi.spyOn(UploadUtil, 'isXlsxFile').mockReturnValue(false);
    vi.spyOn(UploadUtil, 'readRawData').mockRejectedValue(new Error('read failed'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await store.getState().setFileList(fileList);

    expect(store.getState().fileList).toBeNull();
    expect(store.getState().fileParsingError).toBe('Error reading file');
    expect(store.getState().sheetOptions).toEqual([]);
  });

  it('sets and clears raw data while updating case-type and mapping reset state', async () => {
    const { queryClientService, store } = createUploadStoreForTest();
    const invalidateQueryKeys = vi.spyOn(queryClientService, 'invalidateQueryKeys').mockResolvedValue(undefined);
    const completeCaseType = createCompleteCaseType('matched-type');
    const rows = [['case id'], ['case-1']];
    vi.spyOn(UploadUtil, 'getCaseTypeFromColumnLabels').mockReturnValue(completeCaseType);

    await store.getState().setRawData(rows);
    expect(store.getState().rawData).toEqual(rows);
    expect(store.getState().caseTypeId).toBe('matched-type');
    expect(store.getState().shouldResetColumnMapping).toBe(true);
    expect(invalidateQueryKeys).toHaveBeenCalledOnce();

    store.setState({ shouldResetColumnMapping: false });
    invalidateQueryKeys.mockClear();
    await store.getState().setRawData(rows);
    expect(store.getState().shouldResetColumnMapping).toBe(false);
    expect(invalidateQueryKeys).not.toHaveBeenCalled();

    await store.getState().setRawData(null);
    expect(store.getState().rawData).toBeNull();

    const getCaseType = vi.spyOn(UploadUtil, 'getCaseTypeFromColumnLabels');
    getCaseType.mockClear();
    await store.getState().setRawData([]);
    expect(getCaseType).not.toHaveBeenCalled();
  });

  it('clears a failed sheet selection and supports zero or one sheet option', async () => {
    const { store } = createUploadStoreForTest();
    const fileList = createFileList('cases.xlsx');
    const readRawData = vi.spyOn(UploadUtil, 'readRawData').mockResolvedValue([['case id'], ['case-1']]);
    store.setState({ fileList });
    vi.spyOn(UploadUtil, 'getCaseTypeFromColumnLabels').mockReturnValue(undefined);

    await store.getState().setSheetOptions([]);
    expect(store.getState().sheet).toBeNull();

    await store.getState().setSheetOptions([{ label: 'Cases', value: 'Cases' }]);
    expect(store.getState().sheet).toBe('Cases');
    expect(readRawData).toHaveBeenCalledWith(fileList, 'Cases');

    readRawData.mockRejectedValue(new Error('sheet read failed'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await store.getState().setSheet('Broken');
    expect(store.getState().sheet).toBeNull();
    expect(store.getState().fileParsingError).toBe('Error reading sheet');
  });
});
