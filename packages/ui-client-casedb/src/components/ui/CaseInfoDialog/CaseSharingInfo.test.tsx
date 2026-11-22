import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';
import type { CaseAbacContext } from '../../../context/caseAbac';
import { CaseAbacContextProvider } from '../../../context/caseAbac';

import { CaseSharingInfo } from './CaseSharingInfo';

const CASE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const DATA_COLLECTION_1_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const DATA_COLLECTION_2_ID = '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b';
const DATA_COLLECTION_1: CaseDbDataCollection = { id: DATA_COLLECTION_1_ID, name: 'Data collection one' };
const DATA_COLLECTION_2: CaseDbDataCollection = { id: DATA_COLLECTION_2_ID, name: 'Data collection two' };
const ROOT_TEST_ID = 'CaseSharingInfo-root';

const createRights = (overrides: Partial<CaseDbCaseRights> = {}): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_id: CASE_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    data_collection_ids: [DATA_COLLECTION_1_ID, DATA_COLLECTION_2_ID],
    is_full_access: false,
    read_col_ids: [],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_2_ID],
    write_col_ids: [],
    ...overrides,
  };
};

const createCaseAbac = (rights: CaseDbCaseRights[] = [createRights()]): CaseAbacContext => {
  return {
    createdInDataCollection: DATA_COLLECTION_1,
    itemDataCollectionLinks: [],
    rights,
    userDataCollectionOptions: [
      { label: DATA_COLLECTION_1.name, value: DATA_COLLECTION_1_ID },
      { label: DATA_COLLECTION_2.name, value: DATA_COLLECTION_2_ID },
    ],
    userDataCollections: [DATA_COLLECTION_1, DATA_COLLECTION_2],
    userDataCollectionsMap: new Map([
      [DATA_COLLECTION_1_ID, DATA_COLLECTION_1],
      [DATA_COLLECTION_2_ID, DATA_COLLECTION_2],
    ]),
  };
};

describe('CaseSharingInfo', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the heading and the created-in and shared data collections', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([createRights({ remove_data_collection_ids: [DATA_COLLECTION_2_ID] })])}>
        <CaseSharingInfo {...TestIdUtil.createAttributes(ROOT_TEST_ID)} />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('heading', { name: 'Shared in' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Data collection' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Removable' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Is created in' })).toBeVisible();
    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection one No Yes' })).toBeVisible();
    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two Yes No' })).toBeVisible();
    await expect.element(screen.getByTestId(ROOT_TEST_ID)).toBeVisible();
  });

  it('shows the shared data collection as not removable when it is not in the remove list', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([createRights({ remove_data_collection_ids: [] })])}>
        <CaseSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two No No' })).toBeVisible();
  });

  it('shows None when there are no rights and therefore no data collections', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([])}>
        <CaseSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('heading', { name: 'Shared in' })).toBeVisible();
    await expect.element(screen.getByText('None', { exact: true })).toBeVisible();
  });
});
