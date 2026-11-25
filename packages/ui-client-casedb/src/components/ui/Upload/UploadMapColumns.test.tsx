import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import { Box } from '@mui/material';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
} from '../../../stores/uploadStore';
import type { UploadStore } from '../../../stores/uploadStore/uploadStore';
import { UPLOAD_STEP } from '../../../models/upload.models';
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { UploadMapColumns } from './UploadMapColumns';

const APPLICATION_NAME = 'Test application';
const FILE_NAME = 'upload.csv';
const UUID_1 = '6b1f3c2e-8a4d-4f5e-9b7c-2d3e4f5a6b7c';
const UUID_2 = '7c2e4d3f-9b5e-4a6f-8c8d-3e4f5a6b7c8d';
const SAMPLE_ID_COL_ID = 'col-sample';
const SAMPLE_ID_REF_COL_ID = 'ref-col-sample';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const TEXT_COL = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'text',
  dim_id: 'dim-other',
  id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
  label: 'Text',
  rank: 1,
  ref_col_id: 'ref-col-text',
};

const SAMPLE_ID_COL: CaseDbCol = {
  case_type_id: COMPLETE_CASE_TYPE_ID,
  code: 'sample',
  dim_id: 'dim-other',
  id: SAMPLE_ID_COL_ID,
  label: 'Sample ID',
  rank: 2,
  ref_col_id: SAMPLE_ID_REF_COL_ID,
};

const createWritableCompleteCaseType = (
  writeColIds: string[] = [COMPLETE_CASE_TYPE_TEXT_COL_ID],
): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ...writeColIds],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: writeColIds,
  };
  return {
    ...base,
    case_type_access_abacs: { [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: access },
  };
};

const createSampleIdCompleteCaseType = (): CaseDbCompleteCaseType => {
  const sampleIdRefCol: CaseDbRefCol = {
    code: 'sample',
    col_type: CaseDbColType.ID_SAMPLE,
    ref_dim_id: 'ref-dim-other',
  };
  const base = createWritableCompleteCaseType([COMPLETE_CASE_TYPE_TEXT_COL_ID, SAMPLE_ID_COL_ID]);
  return {
    ...base,
    cols: { ...base.cols, [SAMPLE_ID_COL_ID]: SAMPLE_ID_COL },
    ordered_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, SAMPLE_ID_COL_ID],
    ordered_col_ids_by_dim: { 'dim-other': [COMPLETE_CASE_TYPE_TEXT_COL_ID, SAMPLE_ID_COL_ID] },
    ref_cols: { ...base.ref_cols, [SAMPLE_ID_REF_COL_ID]: sampleIdRefCol },
  };
};

const mockMapColumnsApi = (cols: CaseDbCol[] = [TEXT_COL]) => {
  container.resolve(AuthorizationService).user = USER;
  mockCompleteCaseTypeLoaderApi(createCompleteCaseType());
  mockApiRequest('GET', '/v1/cols', () => Response.json(cols.map(col => ({ ...col }))));
  mockApiRequest('POST', '/v1/organization_identifier_issuer_links/query', () => Response.json([]));
};

const renderMapColumns = async ({
  completeCaseType = createWritableCompleteCaseType(),
  rawData,
}: {
  completeCaseType?: CaseDbCompleteCaseType;
  rawData: string[][];
}) => {
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType,
    stepOrder: STEP_ORDER_UPLOAD,
  });
  await store.getState().setRawData(rawData);
  store.setState({ fileName: FILE_NAME });
  await store.getState().goToNextStep();
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <Box sx={{ height: 800 }}>
        <UploadMapColumns />
      </Box>
    </UploadStoreContext>,
    {
      configure: (config) => {
        config.applicationName = APPLICATION_NAME;
      },
    },
  );
  return { screen, store };
};

describe('UploadMapColumns', () => {
  it('should show a warning listing each column that has not been mapped', async () => {
    mockMapColumnsApi();
    const { screen } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text', 'Unknown', 'Empty'],
        [UUID_1, 'value-1', 'x-1', ''],
        [UUID_2, 'value-2', 'x-2', ''],
      ],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent(
      `2 column(s) in ${FILE_NAME} are not mapped`
      + 'The column "Unknown" (column 3) has not been mapped.'
      + 'The column "Empty" (column 4) has not been mapped.',
    );
  });

  it('should show the source, application and preview column headers', async () => {
    mockMapColumnsApi();
    const { screen } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text'],
        [UUID_1, 'value-1'],
      ],
    });

    await expect.element(screen.getByText('Source', { exact: true })).toBeVisible();
    await expect.element(screen.getByText(APPLICATION_NAME, { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Data preview (first 5 unique values)', { exact: true })).toBeVisible();
  });

  it('should show the first five unique non-empty values per column as a preview', async () => {
    mockMapColumnsApi();
    const { screen } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text', 'Empty'],
        [UUID_1, 'value-1', ''],
        [UUID_2, 'value-1', ''],
        [UUID_1, 'value-2', ''],
      ],
    });

    await expect.element(screen.getByRole('cell', { exact: true, name: 'value-1, value-2' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: '<no data>' })).toBeVisible();
  });

  it('should show no data in the preview for a column missing from a shorter row', async () => {
    mockMapColumnsApi();
    const { screen } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text'],
        [UUID_1],
      ],
    });

    await expect.element(screen.getByRole('cell', { exact: true, name: '<no data>' })).toBeVisible();
  });

  it('should show an info message when all columns have been mapped', async () => {
    mockMapColumnsApi();
    const { screen } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text'],
        [UUID_1, 'value-1'],
      ],
    });

    await expect.element(screen.getByRole('alert')).toHaveTextContent(
      `All columns in ${FILE_NAME} have been mapped to known columns in ${APPLICATION_NAME}You can proceed to the next step.`,
    );
  });

  it('should go to the next step when all columns are mapped and proceed is clicked', async () => {
    mockMapColumnsApi();
    const { screen, store } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text'],
        [UUID_1, 'value-1'],
      ],
    });

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.PREVIEW);
  });

  it('should go to the previous step when go back is clicked', async () => {
    mockMapColumnsApi();
    const { screen, store } = await renderMapColumns({
      rawData: [
        ['Case ID', 'Text'],
        [UUID_1, 'value-1'],
      ],
    });

    await screen.getByRole('button', { name: 'Go back' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });

  it('should require an identifier issuer for a mapped sample ID column before proceeding', async () => {
    mockMapColumnsApi([TEXT_COL, SAMPLE_ID_COL]);
    const { screen, store } = await renderMapColumns({
      completeCaseType: createSampleIdCompleteCaseType(),
      rawData: [
        ['Case ID', 'Sample ID'],
        [UUID_1, 'sample-1'],
      ],
    });

    await expect.element(screen.getByRole('combobox', { name: 'Sample ID: Identifier issuer' })).toBeVisible();

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.element(screen.getByText('An identifier issuer must be selected.', { exact: true })).toBeVisible();
    expect(store.getState().activeStep).toBe(UPLOAD_STEP.MAP_COLUMNS);
  });

  it('should clear validation errors when a column mapping is changed', async () => {
    mockMapColumnsApi([TEXT_COL, SAMPLE_ID_COL]);
    const { screen } = await renderMapColumns({
      completeCaseType: createSampleIdCompleteCaseType(),
      rawData: [
        ['Case ID', 'Sample ID'],
        [UUID_1, 'sample-1'],
      ],
    });

    await screen.getByRole('button', { name: 'Next' }).click();
    await expect.element(screen.getByText('An identifier issuer must be selected.', { exact: true })).toBeVisible();

    await screen.getByRole('combobox', { exact: true, name: 'Sample ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Text' }).click();

    await expect.poll(() => screen.getByText('An identifier issuer must be selected.', { exact: true }).query()).toBeNull();
  });
});
