import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../test/fixtures/completeCaseType';

import { UploadPage } from './UploadPage';

const UPLOAD_PATH = '/upload';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const mockUploadPageApi = () => {
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

describe('UploadPage', () => {
  it('renders the upload title and the upload stepper', async () => {
    mockUploadPageApi();
    const screen = await renderRoutedPage(
      <UploadPage />, { path: UPLOAD_PATH },
    );

    await expect.element(screen.getByTestId('UploadPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Upload', { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByText('Select file', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Submit', { exact: true })).toBeVisible();
  });

  it('unmounts without error', async () => {
    mockUploadPageApi();
    const screen = await renderRoutedPage(
      <UploadPage />, { path: UPLOAD_PATH },
    );

    await expect.element(screen.getByTestId('UploadPage')).toBeInTheDocument();
    await screen.unmount();
  });
});
