import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseSetRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';
import {
  CaseAbacContext,
  CaseAbacContextProvider,
} from '../../../context/caseAbac';

import { CaseSetSharingInfo } from './CaseSetSharingInfo';

const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const DATA_COLLECTION_1_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const DATA_COLLECTION_2_ID = '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b';
const DATA_COLLECTION_1: CaseDbDataCollection = { id: DATA_COLLECTION_1_ID, name: 'Data collection one' };
const DATA_COLLECTION_2: CaseDbDataCollection = { id: DATA_COLLECTION_2_ID, name: 'Data collection two' };

const createRights = (overrides: Partial<CaseDbCaseSetRights> = {}): CaseDbCaseSetRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_set_id: CASE_SET_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    data_collection_ids: [DATA_COLLECTION_1_ID, DATA_COLLECTION_2_ID],
    is_full_access: false,
    read_case_set: true,
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_2_ID],
    write_case_set: true,
    ...overrides,
  };
};

const createCaseAbac = (rights: CaseDbCaseSetRights[] = [createRights()]): CaseAbacContext => {
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

describe('CaseSetSharingInfo', () => {
  it('shows the heading and the created-in and shared data collections with their removable state', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([createRights({ remove_data_collection_ids: [DATA_COLLECTION_2_ID] })])}>
        <CaseSetSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('heading', { name: 'Shared in' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Data collection' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Removable' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Is created in' })).toBeVisible();
    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection one No Yes' })).toBeVisible();
    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two Yes No' })).toBeVisible();
  });

  it('shows the shared data collection as not removable when it is not in the remove list', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([createRights({ remove_data_collection_ids: [] })])}>
        <CaseSetSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two No No' })).toBeVisible();
  });

  it('shows the data collection as removable when it is in the remove list', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([createRights({ remove_data_collection_ids: [DATA_COLLECTION_2_ID] })])}>
        <CaseSetSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two Yes No' })).toBeVisible();
  });

  it('omits the created-in row when there is no created-in data collection', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={{ ...createCaseAbac(), createdInDataCollection: undefined }}>
        <CaseSetSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('row', { exact: true, name: 'Data collection two No No' })).toBeVisible();
    await expect.poll(() => screen.getByRole('row').elements().length).toBe(2);
  });

  it('shows None when there are no rights and therefore no data collections', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac([])}>
        <CaseSetSharingInfo />
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByRole('heading', { name: 'Shared in' })).toBeVisible();
    await expect.element(screen.getByText('None', { exact: true })).toBeVisible();
  });

  it('shows None when the context has no item data collections', async () => {
    const screen = await renderComponent(
      <CaseAbacContext value={createCaseAbac()}>
        <CaseSetSharingInfo />
      </CaseAbacContext>,
    );

    await expect.element(screen.getByText('None', { exact: true })).toBeVisible();
  });
});
