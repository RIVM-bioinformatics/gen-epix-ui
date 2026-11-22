import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCase,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';

import { ReadOnlyCaseContent } from './ReadOnlyCaseContent';

const CASE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const DATA_COLLECTION_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const DATA_COLLECTION: CaseDbDataCollection = { id: DATA_COLLECTION_ID, name: 'Data collection one' };
const ROOT_TEST_ID = 'ReadOnlyCaseContent-root';

const createCase = (): CaseDbCase => {
  return {
    case_type_id: CASE_TYPE_ID,
    content: {},
    created_in_data_collection_id: DATA_COLLECTION_ID,
    id: CASE_ID,
  };
};

const NO_CASE = null as unknown as CaseDbCase;

describe('ReadOnlyCaseContent', () => {
  beforeEach(() => {
    mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION]));
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the heading and the case id in a read-only table', async () => {
    const screen = await renderComponent(
      <ReadOnlyCaseContent
        caseDbCase={createCase()}
        {...TestIdUtil.createAttributes(ROOT_TEST_ID)}
      />,
    );

    await expect.element(screen.getByRole('heading', { name: 'Read-only content' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Column' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Value' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Case id' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: CASE_ID })).toBeVisible();
    await expect.element(screen.getByTestId(ROOT_TEST_ID)).toBeVisible();
  });

  it('shows an error and no table when the case could not be found', async () => {
    const screen = await renderComponent(
      <ReadOnlyCaseContent caseDbCase={NO_CASE} />,
    );

    await expect.element(screen.getByRole('heading', { name: 'Read-only content' })).toBeVisible();
    await expect.element(screen.getByText(/Error: Case could not be found/)).toBeVisible();
    await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
  });

  it('shows the case id once the data collections have loaded', async () => {
    let resolveDataCollections: (response: Response) => void = () => undefined;
    mockApiRequest('GET', '/v1/data_collections', async () => {
      return new Promise<Response>((resolve) => {
        resolveDataCollections = resolve;
      });
    });

    const screen = await renderComponent(
      <ReadOnlyCaseContent caseDbCase={createCase()} />,
    );

    await expect.element(screen.getByRole('heading', { name: 'Read-only content' })).toBeVisible();
    resolveDataCollections(Response.json([DATA_COLLECTION]));
    await expect.element(screen.getByRole('cell', { exact: true, name: CASE_ID })).toBeVisible();
  });
});
