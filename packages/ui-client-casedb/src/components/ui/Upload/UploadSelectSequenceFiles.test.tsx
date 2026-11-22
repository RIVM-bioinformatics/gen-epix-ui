import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbProtocol,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbProtocolType,
} from '@gen-epix/api-casedb';
import { Box } from '@mui/material';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
} from '../../../stores/uploadStore';
import type { UploadStore } from '../../../stores/uploadStore/uploadStore';
import { UPLOAD_STEP } from '../../../models/upload.models';
import type { UploadMappedColumn } from '../../../models/upload.models';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { UploadSelectSequenceFiles } from './UploadSelectSequenceFiles';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const SAMPLE_ID_COL_ID = '00000000-0000-4000-8000-0000000000c1';
const SAMPLE_ID_REF_COL_ID = 'ref-col-sample';
const SECOND_SAMPLE_ID_COL_ID = '00000000-0000-4000-8000-0000000000c2';
const SECOND_SAMPLE_ID_REF_COL_ID = 'ref-col-sample-2';
const SEQUENCE_COL_ID = 'col-sequence';
const SEQUENCE_REF_COL_ID = 'ref-col-sequence';
const READS_COL_ID = 'col-reads';
const READS_REF_COL_ID = 'ref-col-reads';
const ISSUER_ID = '00000000-0000-4000-8000-0000000000e1';

const ASSEMBLY_PROTOCOL_ONE_ID = '00000000-0000-4000-8000-0000000000a1';
const ASSEMBLY_PROTOCOL_TWO_ID = '00000000-0000-4000-8000-0000000000a2';
const SEQUENCING_PROTOCOL_ONE_ID = '00000000-0000-4000-8000-0000000000b1';
const SEQUENCING_PROTOCOL_TWO_ID = '00000000-0000-4000-8000-0000000000b2';

const ASSEMBLY_PROTOCOLS: CaseDbProtocol[] = [
  { code: 'assembly-two', id: ASSEMBLY_PROTOCOL_TWO_ID, name: 'Assembly protocol two', protocol_type: CaseDbProtocolType.ASSEMBLY },
  { code: 'assembly-one', id: ASSEMBLY_PROTOCOL_ONE_ID, name: 'Assembly protocol one', protocol_type: CaseDbProtocolType.ASSEMBLY },
];

const SEQUENCING_PROTOCOLS: CaseDbProtocol[] = [
  { code: 'sequencing-two', id: SEQUENCING_PROTOCOL_TWO_ID, name: 'Sequencing protocol two', protocol_type: CaseDbProtocolType.SEQUENCING },
  { code: 'sequencing-one', id: SEQUENCING_PROTOCOL_ONE_ID, name: 'Sequencing protocol one', protocol_type: CaseDbProtocolType.SEQUENCING },
];

const SAMPLE_ID_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'sample',
  dim_id: 'dim-other',
  id: SAMPLE_ID_COL_ID,
  label: 'Sample ID',
  rank: 2,
  ref_col_id: SAMPLE_ID_REF_COL_ID,
};

const SECOND_SAMPLE_ID_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'sample2',
  dim_id: 'dim-other',
  id: SECOND_SAMPLE_ID_COL_ID,
  label: 'Second sample ID',
  rank: 3,
  ref_col_id: SECOND_SAMPLE_ID_REF_COL_ID,
};

const SEQUENCE_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'genome',
  dim_id: 'dim-other',
  id: SEQUENCE_COL_ID,
  label: 'Genome',
  rank: 4,
  ref_col_id: SEQUENCE_REF_COL_ID,
};

const READS_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'reads',
  dim_id: 'dim-other',
  id: READS_COL_ID,
  label: 'Reads',
  rank: 5,
  ref_col_id: READS_REF_COL_ID,
};

type CaseTypeOptions = {
  hasReads?: boolean;
  hasSecondSampleIdCol?: boolean;
  hasSequence?: boolean;
};

const createSelectSequenceCompleteCaseType = ({
  hasReads = true,
  hasSecondSampleIdCol = true,
  hasSequence = true,
}: CaseTypeOptions = {}): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const cols: Record<string, CaseDbCol> = {
    ...base.cols,
    [SAMPLE_ID_COL_ID]: SAMPLE_ID_COL,
  };
  const refCols: Record<string, CaseDbRefCol> = {
    ...base.ref_cols,
    [SAMPLE_ID_REF_COL_ID]: { code: 'sample', col_type: CaseDbColType.ID_SAMPLE, ref_dim_id: 'ref-dim-other' },
  };
  const colIds = [COMPLETE_CASE_TYPE_TEXT_COL_ID, SAMPLE_ID_COL_ID];
  if (hasSecondSampleIdCol) {
    cols[SECOND_SAMPLE_ID_COL_ID] = SECOND_SAMPLE_ID_COL;
    refCols[SECOND_SAMPLE_ID_REF_COL_ID] = { code: 'sample2', col_type: CaseDbColType.ID_SAMPLE, ref_dim_id: 'ref-dim-other' };
    colIds.push(SECOND_SAMPLE_ID_COL_ID);
  }
  if (hasSequence) {
    cols[SEQUENCE_COL_ID] = SEQUENCE_COL;
    refCols[SEQUENCE_REF_COL_ID] = { code: 'genome', col_type: CaseDbColType.GENETIC_SEQUENCE, ref_dim_id: 'ref-dim-other' };
    colIds.push(SEQUENCE_COL_ID);
  }
  if (hasReads) {
    cols[READS_COL_ID] = READS_COL;
    refCols[READS_REF_COL_ID] = { code: 'reads', col_type: CaseDbColType.GENETIC_READS, ref_dim_id: 'ref-dim-other' };
    colIds.push(READS_COL_ID);
  }
  return {
    ...base,
    cols,
    ordered_col_ids: colIds,
    ordered_col_ids_by_dim: { 'dim-other': colIds },
    ref_cols: refCols,
  };
};

const createMappedSampleIdColumn = (col: CaseDbCol, originalIndex: number, sampleIdentifierIssuerId: null | string = ISSUER_ID): UploadMappedColumn => ({
  col,
  isSampleIdColumn: true,
  originalIndex,
  originalLabel: col.label,
  sampleIdentifierIssuerId: sampleIdentifierIssuerId ?? undefined,
});

const createValidatedCase = (id: string, validatedContent: Record<string, string>): CaseDbCaseUploadResult => ({
  data_issues: [],
  id,
  validated_content: validatedContent,
});

const DEFAULT_VALIDATED_CASES: CaseDbCaseUploadResult[] = [
  createValidatedCase('case-1', { [SAMPLE_ID_COL_ID]: 'ID-1' }),
  createValidatedCase('case-2', { [SAMPLE_ID_COL_ID]: 'ID-2' }),
];

const mockSelectSequenceFilesApi = ({
  assemblyProtocols = ASSEMBLY_PROTOCOLS,
  sequencingProtocols = SEQUENCING_PROTOCOLS,
}: {
  assemblyProtocols?: CaseDbProtocol[];
  sequencingProtocols?: CaseDbProtocol[];
} = {}) => {
  container.resolve(AuthorizationService).user = USER;
  mockApiRequest('GET', '/v1/retrieve/assembly_protocols', () => Response.json(assemblyProtocols));
  mockApiRequest('GET', '/v1/retrieve/sequencing_protocols', () => Response.json(sequencingProtocols));
};

const createDataTransfer = (fileNames: string[]) => {
  const dataTransfer = new DataTransfer();
  for (const fileName of fileNames) {
    dataTransfer.items.add(new File(['content'], fileName));
  }
  return dataTransfer;
};

const renderSelectSequenceFiles = async ({
  assemblyProtocolId = null,
  completeCaseType = createSelectSequenceCompleteCaseType(),
  fileNames = [],
  mappedColumns = [createMappedSampleIdColumn(SAMPLE_ID_COL, 0), createMappedSampleIdColumn(SECOND_SAMPLE_ID_COL, 1)],
  sampleIdColId = null,
  sequencingProtocolId = null,
  validatedCases = DEFAULT_VALIDATED_CASES,
}: {
  assemblyProtocolId?: null | string;
  completeCaseType?: CaseDbCompleteCaseType;
  fileNames?: string[];
  mappedColumns?: UploadMappedColumn[];
  sampleIdColId?: null | string;
  sequencingProtocolId?: null | string;
  validatedCases?: CaseDbCaseUploadResult[];
} = {}) => {
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType,
    stepOrder: STEP_ORDER_UPLOAD,
  });
  store.setState({
    activeStep: UPLOAD_STEP.SELECT_SEQUENCE_FILES,
    assemblyProtocolId,
    mappedColumns,
    sampleIdColId,
    sequenceFilesDataTransfer: createDataTransfer(fileNames),
    sequencingProtocolId,
    shouldResetSequenceMapping: false,
    validatedCases,
  });
  const screen = await renderComponent(
    <Box sx={{ height: 800 }}>
      <UploadStoreContext value={store}>
        <UploadSelectSequenceFiles />
      </UploadStoreContext>
    </Box>,
  );
  return { screen, store };
};

const getFileInput = async (baseElement: HTMLElement) => {
  await expect.poll(() => baseElement.querySelector<HTMLInputElement>('input[type="file"]')).not.toBeNull();
  return baseElement.querySelector<HTMLInputElement>('input[type="file"]');
};

const addFiles = async (baseElement: HTMLElement, fileNames: string[]) => {
  const input = await getFileInput(baseElement);
  const dataTransfer = new DataTransfer();
  for (const fileName of fileNames) {
    dataTransfer.items.add(new File(['content'], fileName));
  }
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const ASSEMBLY_LABEL = 'Genome files: assembly protocol';
const SEQUENCING_LABEL = 'Reads files: sequencing protocol';
const SAMPLE_ID_LABEL = 'Sample ID column';

describe('UploadSelectSequenceFiles', () => {
  it('should default the protocols and sample ID column to the first option', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.element(screen.getByRole('combobox', { name: ASSEMBLY_LABEL })).toHaveTextContent('Assembly protocol one');
    await expect.element(screen.getByRole('combobox', { name: SEQUENCING_LABEL })).toHaveTextContent('Sequencing protocol one');
    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toHaveTextContent('Sample ID');
    await expect.poll(() => store.getState().assemblyProtocolId).toBe(ASSEMBLY_PROTOCOL_ONE_ID);
    await expect.poll(() => store.getState().sequencingProtocolId).toBe(SEQUENCING_PROTOCOL_ONE_ID);
    await expect.poll(() => store.getState().sampleIdColId).toBe(SAMPLE_ID_COL_ID);
  });

  it('should keep the stored selections', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      assemblyProtocolId: ASSEMBLY_PROTOCOL_TWO_ID,
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
      sampleIdColId: SECOND_SAMPLE_ID_COL_ID,
      sequencingProtocolId: SEQUENCING_PROTOCOL_TWO_ID,
    });

    await expect.element(screen.getByRole('combobox', { name: ASSEMBLY_LABEL })).toHaveTextContent('Assembly protocol two');
    await expect.element(screen.getByRole('combobox', { name: SEQUENCING_LABEL })).toHaveTextContent('Sequencing protocol two');
    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toHaveTextContent('Second sample ID');
  });

  it('should store the protocols and sample ID column when changed', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.element(screen.getByRole('combobox', { name: ASSEMBLY_LABEL })).toHaveTextContent('Assembly protocol one');
    await screen.getByRole('combobox', { name: ASSEMBLY_LABEL }).click();
    await screen.getByRole('option', { exact: true, name: 'Assembly protocol two' }).click();
    await expect.poll(() => store.getState().assemblyProtocolId).toBe(ASSEMBLY_PROTOCOL_TWO_ID);

    await screen.getByRole('combobox', { name: SEQUENCING_LABEL }).click();
    await screen.getByRole('option', { exact: true, name: 'Sequencing protocol two' }).click();
    await expect.poll(() => store.getState().sequencingProtocolId).toBe(SEQUENCING_PROTOCOL_TWO_ID);

    await screen.getByRole('combobox', { name: SAMPLE_ID_LABEL }).click();
    await screen.getByRole('option', { exact: true, name: 'Second sample ID' }).click();
    await expect.poll(() => store.getState().sampleIdColId).toBe(SECOND_SAMPLE_ID_COL_ID);
  });

  it('should not set protocols when no protocol options exist', async () => {
    mockSelectSequenceFilesApi({ assemblyProtocols: [], sequencingProtocols: [] });
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toHaveTextContent('Sample ID');
    await expect.poll(() => store.getState().sampleIdColId).toBe(SAMPLE_ID_COL_ID);
    expect(store.getState().assemblyProtocolId).toBeNull();
    expect(store.getState().sequencingProtocolId).toBeNull();
  });

  it('should not set a sample ID column when none is mapped', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
      mappedColumns: [],
    });

    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toBeVisible();
    await expect.poll(() => store.getState().assemblyProtocolId).not.toBeNull();
    expect(store.getState().sampleIdColId).toBeNull();
  });

  it('should keep the step unchanged on native form submission', async () => {
    mockSelectSequenceFilesApi();
    const { store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.poll(() => document.querySelector('form')).not.toBeNull();
    const form = document.forms[0];
    form.addEventListener('submit', event => event.preventDefault());
    form.requestSubmit();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
  });

  it('should block proceeding when a required protocol is missing', async () => {
    mockSelectSequenceFilesApi({ assemblyProtocols: [] });
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toHaveTextContent('Sample ID');
    await screen.getByRole('button', { exact: true, name: 'Next' }).click();
    await expect.poll(() => document.querySelectorAll('.Mui-error').length).toBeGreaterThan(0);
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
  });

  it('should show the no writable sample ID column message when no mapped column has an issuer', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta'],
      mappedColumns: [createMappedSampleIdColumn(SAMPLE_ID_COL, 0, null)],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Uploading of files is disabled.No columns have been mapped as writable sample ID column with selected identifier issuer provider.');
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed' })).toBeVisible();
  });

  it('should show the no rows message when no validated case has a sample ID', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta'],
      validatedCases: [
        createValidatedCase('case-1', {}),
        createValidatedCase('case-2', { [SAMPLE_ID_COL_ID]: '   ' }),
      ],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Uploading of files is disabled.No rows have a sample ID filled for the selected sample ID column.');
  });

  it('should disable uploading when the case type has neither sequence nor reads columns', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      completeCaseType: createSelectSequenceCompleteCaseType({ hasReads: false, hasSequence: false }),
      fileNames: ['ID-1.fasta'],
    });

    await expect.element(screen.getByRole('alert').nth(0)).toHaveTextContent('Uploading of read files is disabled.The selected case type does not support uploading read files.');
    await expect.element(screen.getByRole('alert').nth(1)).toHaveTextContent('Uploading of sequences has been disabled.Uploading of sequences is not supported for the selected case type.');
    await expect.element(screen.getByRole('alert').nth(2)).toHaveTextContent('Uploading of read files has been disabled.Uploading of read files is not supported for the selected case type.');
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed' })).toBeVisible();
  });

  it('should only allow read files for a reads-only case type', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      completeCaseType: createSelectSequenceCompleteCaseType({ hasSequence: false }),
      fileNames: ['ID-1_R1.fastq'],
    });

    await expect.element(screen.getByRole('alert').first()).toHaveTextContent('Uploading of sequences has been disabled.Uploading of sequences is not supported for the selected case type.');
    await expect.poll(() => screen.baseElement.querySelector<HTMLInputElement>('input[type="file"]')?.accept).toContain('.fastq');
    const input = await getFileInput(screen.baseElement);
    expect(input.accept).not.toContain('.fasta');
    expect(screen.getByRole('button', { exact: true, name: 'Next' }).query()).not.toBeNull();
  });

  it('should only allow sequence files for a sequence-only case type', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      completeCaseType: createSelectSequenceCompleteCaseType({ hasReads: false }),
      fileNames: ['ID-1.fasta'],
    });

    await expect.element(screen.getByRole('alert').first()).toHaveTextContent('Uploading of read files has been disabled.Uploading of read files is not supported for the selected case type.');
    const input = await getFileInput(screen.baseElement);
    expect(input.accept).toContain('.fasta');
    expect(input.accept).not.toContain('.fastq');
  });

  it('should accept sequence and read files when both are supported', async () => {
    mockSelectSequenceFilesApi();
    const { screen } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta'],
    });

    const input = await getFileInput(screen.baseElement);
    expect(input.accept).toContain('.fasta');
    expect(input.accept).toContain('.fastq');
    expect(screen.baseElement.querySelectorAll('[role="alert"]').length).toBe(0);
  });

  it('should add and clear selected files', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles();

    await addFiles(screen.baseElement, ['ID-1.fasta', 'ID-1_R1.fastq']);
    await expect.poll(() => store.getState().sequenceFilesDataTransfer.files.length).toBe(2);
    await expect.element(screen.getByLabelText('Clear ID-1.fasta')).toBeVisible();

    await screen.getByLabelText('Clear ID-1.fasta').click();
    await expect.poll(() => store.getState().sequenceFilesDataTransfer.files.length).toBe(1);
    expect(store.getState().sequenceFilesDataTransfer.files[0]?.name).toBe('ID-1_R1.fastq');
  });

  it('should proceed to mapping sequences when files are selected', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq'],
    });

    await expect.poll(() => store.getState().sampleIdColId).toBe(SAMPLE_ID_COL_ID);
    await screen.getByRole('button', { exact: true, name: 'Next' }).click();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.MAP_SEQUENCES);
  });

  it('should clear selected files and skip mapping when uploading is disabled', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      completeCaseType: createSelectSequenceCompleteCaseType({ hasReads: false, hasSequence: false }),
      fileNames: ['ID-1.fasta'],
    });

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed' })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Proceed' }).click();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.CREATE_CASES);
    expect(store.getState().sequenceFilesDataTransfer.files.length).toBe(0);
  });

  it('should go back to the preview step', async () => {
    mockSelectSequenceFilesApi();
    const { screen, store } = await renderSelectSequenceFiles({
      fileNames: ['ID-1.fasta'],
    });

    await expect.element(screen.getByRole('combobox', { name: SAMPLE_ID_LABEL })).toHaveTextContent('Sample ID');
    await screen.getByRole('button', { exact: true, name: 'Go back' }).click();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.PREVIEW);
  });
});
