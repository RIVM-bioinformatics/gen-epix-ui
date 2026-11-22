import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';

import { CaseAbacContextProvider } from '../../../context/caseAbac/CaseAbacContextProvider';
import type { CaseAbacContext } from '../../../context/caseAbac/CaseAbacContext';
import { renderComponent } from '../../../test/lib';

import { DataCollectionAccessInfo } from './DataCollectionAccessInfo';

const dataCollectionOne = { id: 'dc-1', name: 'Data collection 1' } satisfies CaseDbDataCollection;
const dataCollectionTwo = { id: 'dc-2', name: 'Data collection 2' } satisfies CaseDbDataCollection;
const dataCollectionThree = { id: 'dc-3', name: 'Data collection 3' } satisfies CaseDbDataCollection;

const createRights = (overrides: Partial<CaseDbCaseRights> = {}): CaseDbCaseRights => ({
  add_data_collection_ids: [],
  can_delete: false,
  case_id: 'case-1',
  case_type_id: 'case-type-1',
  created_in_data_collection_id: 'dc-1',
  data_collection_ids: [],
  is_full_access: false,
  read_col_ids: [],
  remove_data_collection_ids: [],
  shared_in_data_collection_ids: [],
  write_col_ids: [],
  ...overrides,
});

const createCaseAbac = (overrides: Partial<CaseAbacContext> = {}): CaseAbacContext => ({
  itemDataCollectionLinks: [],
  rights: [],
  userDataCollectionOptions: [],
  userDataCollections: [dataCollectionOne, dataCollectionTwo, dataCollectionThree],
  userDataCollectionsMap: new Map([
    [dataCollectionOne.id, dataCollectionOne],
    [dataCollectionThree.id, dataCollectionThree],
    [dataCollectionTwo.id, dataCollectionTwo],
  ]),
  ...overrides,
});

const renderDataCollectionAccessInfo = async (caseAbac: CaseAbacContext) => {
  return renderComponent(
    <CaseAbacContextProvider caseAbac={caseAbac}>
      <DataCollectionAccessInfo />
    </CaseAbacContextProvider>,
  );
};

describe('DataCollectionAccessInfo', () => {
  it('shows None when there are no rights for the item', async () => {
    const screen = await renderDataCollectionAccessInfo(createCaseAbac({ rights: [] }));

    await expect.element(screen.getByText('None')).toBeVisible();
    expect(document.querySelector('table')).toBeNull();
  });

  it('shows the data collection the item is created in as removable No and created in Yes', async () => {
    const screen = await renderDataCollectionAccessInfo(createCaseAbac({
      createdInDataCollection: dataCollectionOne,
      rights: [createRights({ data_collection_ids: ['dc-1'] })],
    }));

    await expect.element(screen.getByText('Data collection 1')).toBeVisible();
    const headerCells = Array.from(document.querySelectorAll('thead th')).map(cell => cell.textContent);
    expect(headerCells).toEqual(['Data collection', 'Removable', 'Is created in']);
    const createdInRow = screen.getByText('Data collection 1').element().closest('tr');
    expect(createdInRow?.textContent).toBe('Data collection 1NoYes');
  });

  it('shows shared data collections with Yes when they are removable and No when they are not', async () => {
    const screen = await renderDataCollectionAccessInfo(createCaseAbac({
      createdInDataCollection: dataCollectionOne,
      rights: [createRights({
        data_collection_ids: ['dc-2', 'dc-3'],
        remove_data_collection_ids: ['dc-2'],
        shared_in_data_collection_ids: ['dc-2', 'dc-3'],
      })],
    }));

    await expect.element(screen.getByText('Data collection 2')).toBeVisible();
    const removableRow = screen.getByText('Data collection 2').element().closest('tr');
    expect(removableRow?.textContent).toBe('Data collection 2YesNo');
    const notRemovableRow = screen.getByText('Data collection 3').element().closest('tr');
    expect(notRemovableRow?.textContent).toBe('Data collection 3NoNo');
  });

  it('does not show data collections that the item is not shared in', async () => {
    const screen = await renderDataCollectionAccessInfo(createCaseAbac({
      rights: [createRights({
        data_collection_ids: ['dc-2', 'dc-3'],
        shared_in_data_collection_ids: ['dc-2'],
      })],
    }));

    await expect.element(screen.getByText('Data collection 2')).toBeVisible();
    expect(document.body.textContent).not.toContain('Data collection 3');
  });

  it('renders an empty table when the item rights reference no known data collections', async () => {
    await renderDataCollectionAccessInfo(createCaseAbac({
      rights: [createRights({ data_collection_ids: ['unknown-dc'], shared_in_data_collection_ids: ['unknown-dc'] })],
    }));

    expect(document.querySelector('table')).not.toBeNull();
    expect(document.querySelectorAll('tbody tr')).toHaveLength(0);
  });
});
