import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
import writeXlsxFile from 'write-excel-file/browser';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
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
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { UploadSelectFile } from './UploadSelectFile';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const CASE_TYPE_ID = '00000000-0000-4000-8000-0000000000c1';
const CASE_TYPE_NAME = 'Case type one';
const DATA_COLLECTION_ID = '00000000-0000-4000-8000-0000000000d1';
const DATA_COLLECTION_NAME = 'Data collection one';
const SECOND_DATA_COLLECTION_ID = '00000000-0000-4000-8000-0000000000d2';
const SECOND_DATA_COLLECTION_NAME = 'Data collection two';

type DataCollectionFixture = { id: string; name: string };

const DEFAULT_DATA_COLLECTIONS: DataCollectionFixture[] = [{ id: DATA_COLLECTION_ID, name: DATA_COLLECTION_NAME }];

const createUploadCompleteCaseType = (dataCollections: DataCollectionFixture[]) => {
  const defaultAccess = createCompleteCaseType().case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  return createCompleteCaseType({
    case_type_access_abacs: Object.fromEntries(
      dataCollections.map((dataCollection) => [
        dataCollection.id,
        {
          ...defaultAccess,
          add_case_set: true,
          case_type_id: CASE_TYPE_ID,
          data_collection_id: dataCollection.id,
          is_private: true,
        },
      ]),
    ),
    id: CASE_TYPE_ID,
    name: CASE_TYPE_NAME,
  });
};

const mockUploadSelectFileApi = (dataCollections: DataCollectionFixture[] = DEFAULT_DATA_COLLECTIONS) => {
  container.resolve(AuthorizationService).user = USER;
  mockCompleteCaseTypeLoaderApi(createUploadCompleteCaseType(dataCollections));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([{ id: CASE_TYPE_ID, name: CASE_TYPE_NAME }]));
  mockApiRequest('GET', '/v1/case_type_sets', () => Response.json([]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json(dataCollections));
  mockApiRequest('GET', '/v1/cols', () => Response.json([{ case_type_id: CASE_TYPE_ID, code: 'text', dim_id: 'dim-other', id: COMPLETE_CASE_TYPE_TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' }]));
  mockApiRequest('GET', '/v1/dims', () => Response.json([]));
  mockApiRequest('GET', '/v1/retrieve/assembly_protocols', () => Response.json([]));
  mockApiRequest('GET', '/v1/retrieve/sequencing_protocols', () => Response.json([]));
  mockApiRequest('POST', '/v1/organization_identifier_issuer_links/query', () => Response.json([]));
};

const renderUploadSelectFile = async () => {
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType: createCompleteCaseType(),
    stepOrder: STEP_ORDER_UPLOAD,
  });
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <UploadSelectFile />
    </UploadStoreContext>,
  );
  return { screen, store };
};

const getFileInput = async (screen: Awaited<ReturnType<typeof renderUploadSelectFile>>['screen']) => {
  await expect.poll(() => screen.baseElement.querySelector<HTMLInputElement>('input[type="file"]')).not.toBeNull();
  return screen.baseElement.querySelector<HTMLInputElement>('input[type="file"]');
};

const selectFile = async (screen: Awaited<ReturnType<typeof renderUploadSelectFile>>['screen'], file: File) => {
  const input = await getFileInput(screen);
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const createCsvFile = (fileName: string) => new File(['Name,Value\na,1\nb,2'], fileName, { type: 'text/csv' });

const createSingleSheetXlsxFile = async () => {
  const workbook = writeXlsxFile([
    [
      { type: String, value: 'Name' },
      { type: String, value: 'Value' },
    ],
    [
      { type: String, value: 'a' },
      { type: Number, value: 1 },
    ],
  ]);
  return new File([await workbook.toBlob()], 'single.xlsx');
};

const createMultiSheetXlsxFile = async () => {
  const workbook = writeXlsxFile([
    {
      data: [
        [
          { type: String, value: 'Name' },
          { type: String, value: 'Value' },
        ],
        [
          { type: String, value: 'first' },
          { type: Number, value: 1 },
        ],
      ],
      sheet: 'First',
    },
    {
      data: [
        [
          { type: String, value: 'Name' },
          { type: String, value: 'Value' },
        ],
        [
          { type: String, value: 'second' },
          { type: Number, value: 2 },
        ],
      ],
      sheet: 'Second',
    },
  ]);
  return new File([await workbook.toBlob()], 'multi.xlsx');
};

describe('UploadSelectFile', () => {
  it('should show a warning and no form when the user has insufficient data access', async () => {
    mockUploadSelectFileApi();
    mockApiRequest('GET', '/v1/case_types', () => Response.json([]));
    const { screen } = await renderUploadSelectFile();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Upload is disabled because you have insufficient data access to proceed. Contact your organization administrator for assistance.');
    await expect.poll(() => screen.baseElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('should show a warning and no form when the case type has no columns', async () => {
    mockUploadSelectFileApi();
    mockApiRequest('GET', '/v1/cols', () => Response.json([]));
    const { screen } = await renderUploadSelectFile();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Upload is disabled because you have insufficient data access to proceed. Contact your organization administrator for assistance.');
    await expect.poll(() => screen.baseElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('should show a warning and no form when there are no data collections to create cases in', async () => {
    mockUploadSelectFileApi();
    mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
    const { screen } = await renderUploadSelectFile();

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Upload is disabled because you have insufficient data access to proceed. Contact your organization administrator for assistance.');
    await expect.poll(() => screen.baseElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('should render the file input with the case type and data collection disabled until a file is selected', async () => {
    mockUploadSelectFileApi();
    const { screen } = await renderUploadSelectFile();

    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { name: 'Create in data collection' })).toBeDisabled();
  });

  it('should show a summary of a loaded csv file without a sheet name', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, createCsvFile('cases.csv'));

    await expect.element(screen.getByText('cases.csv loaded successfully', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Number of columns: 2', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Number of data rows: 2', { exact: true })).toBeVisible();
    await expect.poll(() => screen.getByText('Sheet name:').query()).toBeNull();
    await expect.poll(() => store.getState().fileName).toBe('cases.csv');
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
  });

  it('should auto select the only sheet of an xlsx file and show its name', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, await createSingleSheetXlsxFile());

    await expect.element(screen.getByText('Sheet name: Sheet1', { exact: true })).toBeVisible();
    await expect.poll(() => store.getState().sheet).toBe('Sheet1');
  });

  it('should let the user pick one of several sheets of an xlsx file', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, await createMultiSheetXlsxFile());

    await expect.element(screen.getByRole('combobox', { name: 'Sheet' })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Sheet' }).click();
    await screen.getByRole('option', { exact: true, name: 'Second' }).click();

    await expect.element(screen.getByText('Sheet name: Second', { exact: true })).toBeVisible();
    await expect.poll(() => store.getState().sheet).toBe('Second');
  });

  it('should show an error when the selected file cannot be read', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, new File(['not a zip archive'], 'broken.xlsx'));

    await expect.element(screen.getByText('Error reading file', { exact: true })).toBeVisible();
    await expect.poll(() => store.getState().fileList).toBeNull();
  });

  it('should show the required error when proceeding without a file', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.element(screen.getByText('File is required', { exact: true })).toBeVisible();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });

  it('should enable the data collection once a case type is selected and store both ids', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, createCsvFile('cases.csv'));
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();

    await expect.poll(() => store.getState().caseTypeId).toBe(CASE_TYPE_ID);
    await expect.element(screen.getByRole('combobox', { name: 'Create in data collection' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Create in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: DATA_COLLECTION_NAME }).click();

    await expect.poll(() => store.getState().createdInDataCollectionId).toBe(DATA_COLLECTION_ID);
  });

  it('should advance to the next step when all required fields are valid', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, createCsvFile('cases.csv'));
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Create in data collection' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Create in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: DATA_COLLECTION_NAME }).click();
    await expect.poll(() => store.getState().createdInDataCollectionId).toBe(DATA_COLLECTION_ID);

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.MAP_COLUMNS);
  });

  it('should store the data collection the user picks when several are available', async () => {
    mockUploadSelectFileApi([
      { id: DATA_COLLECTION_ID, name: DATA_COLLECTION_NAME },
      { id: SECOND_DATA_COLLECTION_ID, name: SECOND_DATA_COLLECTION_NAME },
    ]);
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, createCsvFile('cases.csv'));
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();
    await expect.poll(() => store.getState().caseTypeId).toBe(CASE_TYPE_ID);
    await expect.element(screen.getByRole('combobox', { name: 'Create in data collection' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Create in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: SECOND_DATA_COLLECTION_NAME }).click();

    await expect.poll(() => store.getState().createdInDataCollectionId).toBe(SECOND_DATA_COLLECTION_ID);
  });

  it('should require a sheet to be selected for a multi-sheet xlsx file before proceeding', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, await createMultiSheetXlsxFile());
    await expect.element(screen.getByRole('combobox', { name: 'Sheet' })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Create in data collection' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Create in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: DATA_COLLECTION_NAME }).click();
    await expect.poll(() => store.getState().createdInDataCollectionId).toBe(DATA_COLLECTION_ID);

    await screen.getByRole('button', { name: 'Next' }).click();

    await expect.element(screen.getByText('Sheet is required', { exact: true })).toBeVisible();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });

  it('should show the error message when refreshing the case validation fails for the selected case type', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();

    await selectFile(screen, createCsvFile('cases.csv'));
    await expect.poll(() => store.getState().rawData).not.toBeNull();
    store.setState({ completeCaseType: null, invalidateCaseValidationQuery: async () => Promise.reject(new Error('Case validation refresh failed')) });
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();

    await expect.poll(() => container.resolve(NotificationService).data.map(notification => notification.message)).toContain('Case validation refresh failed');
  });

  it('should show a generic error message when refreshing the case validation rejects with a non-error value', async () => {
    mockUploadSelectFileApi();
    const { screen, store } = await renderUploadSelectFile();
    const nonErrorRejection: unknown = 'boom';

    await selectFile(screen, createCsvFile('cases.csv'));
    await expect.poll(() => store.getState().rawData).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- the test needs a non-Error rejection
    store.setState({ completeCaseType: null, invalidateCaseValidationQuery: async () => Promise.reject(nonErrorRejection) });
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).not.toBeDisabled();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: CASE_TYPE_NAME }).click();

    await expect.poll(() => container.resolve(NotificationService).data.map(notification => notification.message)).toContain('Sorry, an unexpected error has occurred.');
  });
});
