import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';
import { CaseTypeAbacContextProvider } from '../../../context/caseTypeAbac';

import { CaseTypeInfoColAccessRights } from './CaseTypeInfoColAccessRights';

const CASE_TYPE_ID = 'case-type-1';
const COL_ID = 'col-a';
const OTHER_COL_ID = 'col-b';
const DATA_COLLECTION_ZULU: CaseDbDataCollection = { id: 'dc-zulu', name: 'Zulu collection' };
const DATA_COLLECTION_ALPHA: CaseDbDataCollection = { id: 'dc-alpha', name: 'Alpha collection' };

const createAccess = (dataCollectionId: string, readColIds: string[], writeColIds: string[]): CaseDbCaseTypeAccessAbac => {
  return {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: dataCollectionId,
    is_private: false,
    read_case_set: false,
    read_col_ids: readColIds,
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: writeColIds,
  };
};

const renderColAccessRights = async (
  accesses: CaseDbCaseTypeAccessAbac[],
  dataCollections: CaseDbDataCollection[],
) => {
  const caseTypeAccessAbacDict = Object.fromEntries(accesses.map(access => [access.data_collection_id, access]));
  return renderComponent(
    <CaseTypeAbacContextProvider
      caseTypeAbac={{
        caseTypeAccessAbacDict,
        userDataCollections: dataCollections,
        userDataCollectionsMap: new Map(dataCollections.map(dataCollection => [dataCollection.id, dataCollection])),
      }}
    >
      <CaseTypeInfoColAccessRights colId={COL_ID} />
    </CaseTypeAbacContextProvider>,
  );
};

describe('CaseTypeInfoColAccessRights', () => {
  it('shows read/write effective rights and per-collection read/write access', async () => {
    const screen = await renderColAccessRights(
      [createAccess(DATA_COLLECTION_ZULU.id, [COL_ID], [COL_ID])],
      [DATA_COLLECTION_ZULU],
    );

    await expect.element(screen.getByText('Effective rights: read/write', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Zulu collection: read/write', { exact: true })).toBeInTheDocument();
  });

  it('shows read effective rights and read access for a read-only collection', async () => {
    const screen = await renderColAccessRights(
      [createAccess(DATA_COLLECTION_ALPHA.id, [COL_ID], [])],
      [DATA_COLLECTION_ALPHA],
    );

    await expect.element(screen.getByText('Effective rights: read', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha collection: read', { exact: true })).toBeInTheDocument();
  });

  it('shows write effective rights and write access for a write-only collection', async () => {
    const screen = await renderColAccessRights(
      [createAccess(DATA_COLLECTION_ALPHA.id, [], [COL_ID])],
      [DATA_COLLECTION_ALPHA],
    );

    await expect.element(screen.getByText('Effective rights: write', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha collection: write', { exact: true })).toBeInTheDocument();
  });

  it('combines rights of several collections into effective rights and lists each collection', async () => {
    const screen = await renderColAccessRights(
      [
        createAccess(DATA_COLLECTION_ZULU.id, [COL_ID], []),
        createAccess(DATA_COLLECTION_ALPHA.id, [], [COL_ID]),
      ],
      [DATA_COLLECTION_ZULU, DATA_COLLECTION_ALPHA],
    );

    await expect.element(screen.getByText('Effective rights: read/write', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Zulu collection: read', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha collection: write', { exact: true })).toBeInTheDocument();
  });

  it('shows no access when no collection grants access to the column', async () => {
    const screen = await renderColAccessRights(
      [createAccess(DATA_COLLECTION_ZULU.id, [OTHER_COL_ID], [OTHER_COL_ID])],
      [DATA_COLLECTION_ZULU],
    );

    await expect.element(screen.getByText('Effective rights: no access', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Zulu collection: read/write', { exact: true })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('shows at most five collections until "Show more" is clicked', async () => {
    const dataCollections: CaseDbDataCollection[] = [1, 2, 3, 4, 5, 6].map(index => ({ id: `dc-${index}`, name: `Collection ${index}` }));
    const screen = await renderColAccessRights(
      dataCollections.map(dataCollection => createAccess(dataCollection.id, [COL_ID], [])),
      dataCollections,
    );

    await expect.element(screen.getByText('Collection 5: read', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Collection 6: read', { exact: true })).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Show more' }).click();

    await expect.element(screen.getByText('Collection 6: read', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});
