import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
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
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { Upload } from './Upload';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const mockUploadApi = () => {
  container.resolve(AuthorizationService).user = USER;
  mockCompleteCaseTypeLoaderApi(createCompleteCaseType());
  mockApiRequest('GET', '/v1/case_types', () => Response.json([{ id: COMPLETE_CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME }]));
  mockApiRequest('GET', '/v1/case_type_sets', () => Response.json([]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([{ id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID, name: 'Data collection one' }]));
  mockApiRequest('GET', '/v1/cols', () => Response.json([{ case_type_id: COMPLETE_CASE_TYPE_ID, code: 'text', dim_id: 'dim-other', id: COMPLETE_CASE_TYPE_TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' }]));
  mockApiRequest('GET', '/v1/dims', () => Response.json([]));
  mockApiRequest('GET', '/v1/retrieve/assembly_protocols', () => Response.json([]));
  mockApiRequest('GET', '/v1/retrieve/sequencing_protocols', () => Response.json([]));
  mockApiRequest('POST', '/v1/organization_identifier_issuer_links/query', () => Response.json([]));
};

const renderUpload = async () => {
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType: createCompleteCaseType(),
    stepOrder: STEP_ORDER_UPLOAD,
  });
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <Upload />
    </UploadStoreContext>,
  );
  return { screen, store };
};

describe('Upload', () => {
  it('should render a stepper with a label for each step in the step order', async () => {
    mockUploadApi();
    const { screen } = await renderUpload();

    await expect.element(screen.getByText('Select file', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Map columns', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Preview', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Select sequence files', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Map sequences', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Submit', { exact: true })).toBeVisible();
  });

  it('should render the select file step by default', async () => {
    mockUploadApi();
    const { screen } = await renderUpload();

    await expect.element(screen.getByText('Create in data collection', { exact: true }).first()).toBeVisible();
  });

  it('should render the map columns step when it is active', async () => {
    mockUploadApi();
    const { screen, store } = await renderUpload();
    await store.getState().setRawData([['Sample ID', 'Value'], ['sample-1', 'value-1']]);
    store.setState({ activeStep: UPLOAD_STEP.MAP_COLUMNS });

    await expect.element(screen.getByText('Data preview (first 5 unique values)', { exact: true })).toBeVisible();
  });

  it('should render the preview step when it is active', async () => {
    mockUploadApi();
    const { screen, store } = await renderUpload();
    store.setState({ activeStep: UPLOAD_STEP.PREVIEW });

    await expect.element(screen.getByText('Preview', { exact: true }).first()).toBeVisible();
  });

  it('should render the select sequence files step when it is active', async () => {
    mockUploadApi();
    const { screen, store } = await renderUpload();
    store.setState({ activeStep: UPLOAD_STEP.SELECT_SEQUENCE_FILES });

    await expect.element(screen.getByText('Sample ID column', { exact: true }).first()).toBeVisible();
  });

  it('should render the map sequences step when it is active', async () => {
    mockUploadApi();
    const { screen, store } = await renderUpload();
    store.setState({ activeStep: UPLOAD_STEP.MAP_SEQUENCES });

    await expect.element(screen.getByText('Map sequences', { exact: true }).first()).toBeVisible();
  });

  it('should render the create cases step when it is active', async () => {
    mockUploadApi();
    const { screen, store } = await renderUpload();
    store.setState({ activeStep: UPLOAD_STEP.CREATE_CASES });

    await expect.element(screen.getByText('Submit', { exact: true }).first()).toBeVisible();
  });
});
