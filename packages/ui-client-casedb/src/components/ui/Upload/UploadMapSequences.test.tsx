import type { StoreApi } from 'zustand';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { Box } from '@mui/material';

import {
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
  createUploadStore,
} from '../../../stores/uploadStore';
import type { UploadStore } from '../../../stores/uploadStore/uploadStore';
import {
  UPLOAD_STEP,
  type UploadSequenceMapping,
} from '../../../models/upload.models';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';
import { UploadUtil } from '../../../utils/UploadUtil';

import { UploadMapSequences } from './UploadMapSequences';

const SAMPLE_ID_COL_ID = 'col-sample';
const SAMPLE_ID_REF_COL_ID = 'ref-col-sample';
const SEQUENCE_COL_ID = 'col-sequence';
const SEQUENCE_REF_COL_ID = 'ref-col-sequence';
const READS_COL_ID = 'col-reads';
const READS_REF_COL_ID = 'ref-col-reads';
const CASE_ID_1 = 'case-1';
const CASE_ID_2 = 'case-2';
const SAMPLE_ID_1 = 'ID-1';
const SAMPLE_ID_2 = 'ID-2';

const SAMPLE_ID_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'sample',
  dim_id: 'dim-other',
  id: SAMPLE_ID_COL_ID,
  label: 'Sample ID',
  rank: 2,
  ref_col_id: SAMPLE_ID_REF_COL_ID,
};

const SEQUENCE_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'genome',
  dim_id: 'dim-other',
  id: SEQUENCE_COL_ID,
  label: 'Genome',
  rank: 3,
  ref_col_id: SEQUENCE_REF_COL_ID,
};

const READS_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'reads',
  dim_id: 'dim-other',
  id: READS_COL_ID,
  label: 'Reads',
  rank: 4,
  ref_col_id: READS_REF_COL_ID,
};

const createSequenceCompleteCaseType = (): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const colIds = [COMPLETE_CASE_TYPE_TEXT_COL_ID, SAMPLE_ID_COL_ID, SEQUENCE_COL_ID, READS_COL_ID];
  return {
    ...base,
    cols: {
      ...base.cols,
      [SAMPLE_ID_COL_ID]: SAMPLE_ID_COL,
      [SEQUENCE_COL_ID]: SEQUENCE_COL,
      [READS_COL_ID]: READS_COL,
    },
    ordered_col_ids: colIds,
    ordered_col_ids_by_dim: { 'dim-other': colIds },
    ref_cols: {
      ...base.ref_cols,
      [SAMPLE_ID_REF_COL_ID]: {
        code: 'sample',
        col_type: CaseDbColType.ID_SAMPLE,
        ref_dim_id: 'ref-dim-other',
      } as CaseDbRefCol,
      [SEQUENCE_REF_COL_ID]: {
        code: 'genome',
        col_type: CaseDbColType.GENETIC_SEQUENCE,
        ref_dim_id: 'ref-dim-other',
      } as CaseDbRefCol,
      [READS_REF_COL_ID]: {
        code: 'reads',
        col_type: CaseDbColType.GENETIC_READS,
        ref_dim_id: 'ref-dim-other',
      } as CaseDbRefCol,
    },
  };
};

const createValidatedCase = (id: string, validatedContent: Record<string, string>): CaseDbCaseUploadResult => ({
  data_issues: [],
  id,
  validated_content: validatedContent,
});

const createDefaultValidatedCases = (): CaseDbCaseUploadResult[] => [
  createValidatedCase(CASE_ID_1, { [SAMPLE_ID_COL_ID]: SAMPLE_ID_1 }),
];

const renderMapSequences = async ({
  completeCaseType = createSequenceCompleteCaseType(),
  fileNames,
  sampleIdColId = SAMPLE_ID_COL_ID,
  selectedCaseIds,
  sequenceMapping,
  validatedCases = createDefaultValidatedCases(),
}: {
  completeCaseType?: CaseDbCompleteCaseType;
  fileNames: string[];
  sampleIdColId?: string | null;
  selectedCaseIds?: string[];
  sequenceMapping?: UploadSequenceMapping;
  validatedCases?: CaseDbCaseUploadResult[];
}) => {
  const sequenceFilesDataTransfer = new DataTransfer();
  for (const fileName of fileNames) {
    sequenceFilesDataTransfer.items.add(new File(['content'], fileName));
  }
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType,
    stepOrder: STEP_ORDER_UPLOAD,
  });
  store.setState({
    activeStep: UPLOAD_STEP.MAP_SEQUENCES,
    sampleIdColId,
    selectedIdsForUpload: selectedCaseIds ?? validatedCases.map(validatedCase => validatedCase.id as string),
    sequenceFilesDataTransfer,
    sequenceMapping: sequenceMapping ?? UploadUtil.getEpiUploadSequenceMapping(completeCaseType, validatedCases, sequenceFilesDataTransfer),
    shouldResetSequenceMapping: false,
    validatedCases,
  });
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <Box sx={{ height: 800 }}>
        <UploadMapSequences />
      </Box>
    </UploadStoreContext>,
  );
  return { screen, store };
};

describe('UploadMapSequences', () => {
  it('should show the sample ID and the mapped files for each case', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq', 'ID-1_R2.fastq'],
    });

    await expect.element(screen.getByRole('cell', { exact: true, name: SAMPLE_ID_1 })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toHaveValue('ID-1.fasta');
    await expect.element(screen.getByRole('combobox', { name: 'Reads FWD' })).toHaveValue('ID-1_R1.fastq');
    await expect.element(screen.getByRole('combobox', { name: 'Reads REV' })).toHaveValue('ID-1_R2.fastq');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('All 3 files are mapped');
  });

  it('should list the files that are not mapped to a case', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta', 'ID-1_R1.fastq', 'other.fastq'],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('2 of 3 files mappedUnmapped files: other.fastq');
  });

  it('should set a sequence file from the dropdown and store it when proceeding', async () => {
    const { screen, store } = await renderMapSequences({
      fileNames: ['ID-1_R1.fastq', 'other.fasta'],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('1 of 2 files mappedUnmapped files: other.fasta');

    await screen.getByRole('combobox', { name: 'Genome' }).click();
    await screen.getByRole('option', { exact: true, name: 'other.fasta' }).click();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('All 2 files are mapped');
    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toHaveValue('other.fasta');

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.CREATE_CASES);
    expect(store.getState().sequenceMapping[CASE_ID_1]?.sequenceFileNames[SEQUENCE_COL_ID]).toBe('other.fasta');
  });

  it('should clear a sequence file and update the alert', async () => {
    const { screen, store } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('All 1 files are mapped');

    await screen.getByRole('combobox', { name: 'Genome' }).hover();
    await screen.getByRole('button', { name: 'Clear' }).click();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('0 of 1 files mappedUnmapped files: ID-1.fasta');
    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toHaveValue('');
    expect(store.getState().sequenceMapping[CASE_ID_1]?.sequenceFileNames[SEQUENCE_COL_ID]).toBeUndefined();
  });

  it('should set and clear the reads FWD and REV files', async () => {
    const { screen, store } = await renderMapSequences({
      fileNames: ['ID-1_R1.fastq', 'ID-1_R2.fastq'],
    });

    await screen.getByRole('combobox', { name: 'Reads FWD' }).hover();
    await screen.getByRole('button', { name: 'Clear' }).first().click();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('1 of 2 files mappedUnmapped files: ID-1_R1.fastq');
    await expect.element(screen.getByRole('combobox', { name: 'Reads FWD' })).toHaveValue('');

    await screen.getByRole('combobox', { name: 'Reads FWD' }).click();
    await screen.getByRole('option', { exact: true, name: 'ID-1_R1.fastq' }).click();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('All 2 files are mapped');

    await screen.getByRole('combobox', { name: 'Reads REV' }).hover();
    await screen.getByRole('button', { name: 'Clear' }).nth(1).click();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('1 of 2 files mappedUnmapped files: ID-1_R2.fastq');

    await screen.getByRole('combobox', { name: 'Reads REV' }).click();
    await screen.getByRole('option', { exact: true, name: 'ID-1_R2.fastq' }).click();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('All 2 files are mapped');
    expect(store.getState().sequenceMapping[CASE_ID_1]?.readsFileNames[READS_COL_ID]).toEqual({
      fwd: 'ID-1_R1.fastq',
      rev: 'ID-1_R2.fastq',
    });
  });

  it('should show empty dropdowns and all files as unmapped when no mapping exists', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
      sequenceMapping: {},
    });

    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toHaveValue('');
    await expect.element(screen.getByRole('combobox', { name: 'Reads FWD' })).toHaveValue('');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('0 of 1 files mappedUnmapped files: ID-1.fasta');
  });

  it('should hide the sample ID column when no sample ID column is selected', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
      sampleIdColId: null,
    });

    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toBeVisible();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: SAMPLE_ID_1 }).query()).toBeNull();
  });

  it('should hide the sample ID column when no selected case has a sample ID', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
      validatedCases: [createValidatedCase(CASE_ID_1, {})],
    });

    await expect.element(screen.getByRole('combobox', { name: 'Genome' })).toBeVisible();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: SAMPLE_ID_1 }).query()).toBeNull();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('0 of 1 files mappedUnmapped files: ID-1.fasta');
  });

  it('should show other columns with content for the selected cases only', async () => {
    const { screen } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
      selectedCaseIds: [CASE_ID_1],
      validatedCases: [
        createValidatedCase(CASE_ID_1, { [SAMPLE_ID_COL_ID]: SAMPLE_ID_1, [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Selected text' }),
        createValidatedCase(CASE_ID_2, { [SAMPLE_ID_COL_ID]: SAMPLE_ID_2, [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Unselected text' }),
      ],
    });

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Selected text' })).toBeVisible();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Unselected text' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: SAMPLE_ID_2 }).query()).toBeNull();
  });

  it('should go back to the previous step', async () => {
    const { screen, store } = await renderMapSequences({
      fileNames: ['ID-1.fasta'],
    });

    await screen.getByRole('button', { name: 'Go back' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
  });
});
