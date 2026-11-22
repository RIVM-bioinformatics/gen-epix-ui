import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';
import {
  CaseTypeAbacContext,
  CaseTypeAbacContextProvider,
} from '../../../context/caseTypeAbac';

import { CaseTypeInfoAccessRights } from './CaseTypeInfoAccessRights';

const CASE_TYPE_ID = 'case-type-1';
const DIM_ID = 'dim-other';
const REF_DIM_ID = 'ref-dim-other';
const COL_A: CaseDbCol = { case_type_id: CASE_TYPE_ID, code: 'col-a', dim_id: DIM_ID, id: 'col-a', label: 'Column A', rank: 1, ref_col_id: 'ref-col-a' };
const COL_B: CaseDbCol = { case_type_id: CASE_TYPE_ID, code: 'col-b', dim_id: DIM_ID, id: 'col-b', label: 'Column B', rank: 2, ref_col_id: 'ref-col-b' };
const DATA_COLLECTION_ZULU: CaseDbDataCollection = { id: 'dc-zulu', name: 'Zulu collection' };
const DATA_COLLECTION_ALPHA: CaseDbDataCollection = { id: 'dc-alpha', name: 'Alpha collection' };
const DATA_COLLECTION_NOT_OWNED: CaseDbDataCollection = { id: 'dc-not-owned', name: 'Not owned collection' };

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

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: DIM_ID, label: 'Other', rank: 1, ref_dim_id: REF_DIM_ID };
  const refDim = { code: 'other', dim_type: CaseDbDimType.OTHER, id: REF_DIM_ID, label: 'Other' } as CaseDbRefDim;
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-a': { code: 'col-a', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_ID },
    'ref-col-b': { code: 'col-b', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_ID },
  };
  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols: { [COL_A.id]: COL_A, [COL_B.id]: COL_B },
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: [COL_A.id, COL_B.id],
    ordered_col_ids_by_dim: { [dim.id]: [COL_A.id, COL_B.id] },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: { [refDim.id]: refDim },
    tree_algorithms: {},
    user_id: null,
  };
};

const renderAccessRights = async (
  completeCaseType: CaseDbCompleteCaseType,
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
      <CaseTypeInfoAccessRights completeCaseType={completeCaseType} />
    </CaseTypeAbacContextProvider>,
  );
};

describe('CaseTypeInfoAccessRights', () => {
  it('renders one accordion per accessible data collection, sorted by name', async () => {
    const screen = await renderAccessRights(
      createCompleteCaseType(),
      [
        createAccess(DATA_COLLECTION_ZULU.id, [COL_A.id], []),
        createAccess(DATA_COLLECTION_ALPHA.id, [COL_B.id], []),
      ],
      [DATA_COLLECTION_ZULU, DATA_COLLECTION_ALPHA],
    );

    await expect.element(screen.getByRole('button', { name: 'Alpha collection' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Zulu collection' })).toBeInTheDocument();
    const summaryButtons = screen.getByRole('button').elements().map(element => element.textContent?.trim());
    expect(summaryButtons.indexOf('Alpha collection')).toBeLessThan(summaryButtons.indexOf('Zulu collection'));
  });

  it('shows read and write access per column once the accordion is expanded', async () => {
    const screen = await renderAccessRights(
      createCompleteCaseType(),
      [
        createAccess(DATA_COLLECTION_ZULU.id, [COL_A.id, COL_B.id], [COL_A.id]),
      ],
      [DATA_COLLECTION_ZULU],
    );

    await screen.getByRole('button', { name: 'Zulu collection' }).click();

    await expect.element(screen.getByRole('columnheader', { name: 'Column' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Column A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('row', { name: 'Column A Yes Yes' })).toBeInTheDocument();
    await expect.element(screen.getByRole('row', { name: 'Column B Yes No' })).toBeInTheDocument();
  });

  it('renders nothing when there are no accessible data collections', async () => {
    const screen = await renderAccessRights(createCompleteCaseType(), [], []);

    await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when the context provides no access list', async () => {
    const screen = await renderComponent(
      <CaseTypeAbacContext
        value={{
          caseTypeAccessAbacDict: {},
          userDataCollections: [],
          userDataCollectionsMap: new Map(),
        }}
      >
        <CaseTypeInfoAccessRights completeCaseType={createCompleteCaseType()} />
      </CaseTypeAbacContext>,
    );

    await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
  });

  it('skips access entries of data collections the user does not own', async () => {
    const screen = await renderAccessRights(
      createCompleteCaseType(),
      [
        createAccess(DATA_COLLECTION_ZULU.id, [COL_A.id], []),
        createAccess(DATA_COLLECTION_NOT_OWNED.id, [COL_A.id], []),
      ],
      [DATA_COLLECTION_ZULU],
    );

    await expect.element(screen.getByRole('button', { name: 'Zulu collection' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Not owned collection' })).not.toBeInTheDocument();
  });
});
