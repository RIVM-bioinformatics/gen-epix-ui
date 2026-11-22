import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbGeneticDistanceProtocol,
  CaseDbRefCol,
  CaseDbRefDim,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import { DataService } from '../../../classes/services/DataService';
import { CaseTypeAbacContextProvider } from '../../../context/caseTypeAbac';

import { CaseTypeInfoTrees } from './CaseTypeInfoTrees';

const CASE_TYPE_ID = 'case-type-1';
const DIM_ID = 'dim-other';
const REF_DIM_ID = 'ref-dim-other';
const PROTOCOL_ID = 'protocol-1';
const PROTOCOL_NAME = 'Protocol one';
const PROTOCOL_DESCRIPTION = 'Protocol one description';
const TREE_NJ_CODE = 'NJ';
const TREE_UPGMA_CODE = 'UPGMA';
const TREE_NJ_NAME = 'Neighbor joining';
const TREE_UPGMA_NAME = 'UPGMA tree';
const GENETIC_DISTANCE_COL_ID = 'col-distance';
const GENETIC_DISTANCE_COL_LABEL = 'Distance';
const TEXT_COL_ID = 'col-text';
const DATA_COLLECTION: CaseDbDataCollection = { id: 'dc-1', name: 'Collection one' };

const createTreeAlgorithm = (code: string, name: string, rank: number): CaseDbTreeAlgorithm => ({
  code,
  description: `${name} description`,
  id: `id-${code}`,
  is_ultrametric: false,
  name,
  rank,
  seqdb_tree_algorithm_id: `seqdb-${code}`,
  tree_algorithm_class_id: 'class-1',
} as CaseDbTreeAlgorithm);

const GENETIC_DISTANCE_PROTOCOL = {
  description: PROTOCOL_DESCRIPTION,
  id: PROTOCOL_ID,
  name: PROTOCOL_NAME,
  seqdb_seq_distance_protocol_id: 'seqdb-protocol-1',
  seqdb_seq_distance_type: 'SNP',
} as unknown as CaseDbGeneticDistanceProtocol;

// Algorithm codes are listed out of rank order so that sorting by rank is observable
const createCompleteCaseType = (withGeneticDistanceCol: boolean): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: DIM_ID, label: 'Other', rank: 1, ref_dim_id: REF_DIM_ID };
  const refDims: Record<string, CaseDbRefDim> = {
    [REF_DIM_ID]: { code: 'other', dim_type: CaseDbDimType.OTHER, id: REF_DIM_ID, label: 'Other' },
  };
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-distance': {
      code: 'distance',
      col_type: CaseDbColType.GENETIC_DISTANCE,
      genetic_distance_protocol_id: PROTOCOL_ID,
      ref_dim_id: REF_DIM_ID,
    },
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_ID },
  };
  const cols: Record<string, CaseDbCol> = {
    [TEXT_COL_ID]: { case_type_id: CASE_TYPE_ID, code: 'text', dim_id: DIM_ID, id: TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text', tree_algorithm_codes: [] },
  };
  if (withGeneticDistanceCol) {
    cols[GENETIC_DISTANCE_COL_ID] = {
      case_type_id: CASE_TYPE_ID,
      code: 'distance',
      dim_id: DIM_ID,
      id: GENETIC_DISTANCE_COL_ID,
      label: GENETIC_DISTANCE_COL_LABEL,
      rank: 2,
      ref_col_id: 'ref-col-distance',
      tree_algorithm_codes: [TREE_UPGMA_CODE, TREE_NJ_CODE],
    };
  }
  const orderedColIds = Object.keys(cols);

  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols,
    description: 'Description',
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: { [PROTOCOL_ID]: GENETIC_DISTANCE_PROTOCOL },
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: orderedColIds,
    ordered_col_ids_by_dim: { [dim.id]: orderedColIds },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {
      [TREE_NJ_CODE]: createTreeAlgorithm(TREE_NJ_CODE, TREE_NJ_NAME, 1),
      [TREE_UPGMA_CODE]: createTreeAlgorithm(TREE_UPGMA_CODE, TREE_UPGMA_NAME, 2),
    },
    user_id: null,
  };
};

const renderTrees = async (completeCaseType: CaseDbCompleteCaseType, accesses: CaseDbCaseTypeAccessAbac[] = []) => {
  const caseTypeAccessAbacDict = Object.fromEntries(accesses.map(access => [access.data_collection_id, access]));
  return renderComponent(
    <CaseTypeAbacContextProvider
      caseTypeAbac={{
        caseTypeAccessAbacDict,
        userDataCollections: [DATA_COLLECTION],
        userDataCollectionsMap: new Map([[DATA_COLLECTION.id, DATA_COLLECTION]]),
      }}
    >
      <CaseTypeInfoTrees completeCaseType={completeCaseType} />
    </CaseTypeAbacContextProvider>,
  );
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/tree_algorithms', () => Response.json([
    createTreeAlgorithm(TREE_NJ_CODE, TREE_NJ_NAME, 1),
    createTreeAlgorithm(TREE_UPGMA_CODE, TREE_UPGMA_NAME, 2),
  ]));
};

describe('CaseTypeInfoTrees', () => {
  beforeEach(async () => {
    registerHandlers();
    await container.resolve(DataService).loadTreeAlgorithms(createCompleteCaseType(true), new AbortController().signal);
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders nothing when the case type has no genetic distance cols', async () => {
    await renderTrees(createCompleteCaseType(false));

    expect(document.querySelectorAll('[id$="-header"]')).toHaveLength(0);
  });

  it('renders one accordion per tree algorithm of each genetic distance col, ordered by algorithm rank', async () => {
    const screen = await renderTrees(createCompleteCaseType(true));

    const njSummary = screen.getByRole('button', { exact: true, name: `${PROTOCOL_NAME} - ${TREE_NJ_NAME}` });
    const upgmaSummary = screen.getByRole('button', { exact: true, name: `${PROTOCOL_NAME} - ${TREE_UPGMA_NAME}` });
    await expect.element(njSummary).toBeInTheDocument();
    await expect.element(upgmaSummary).toBeInTheDocument();

    const summaryNames = Array.from(document.querySelectorAll('[id$="-header"]')).map(element => element.textContent);
    expect(summaryNames).toStrictEqual([
      `${PROTOCOL_NAME} - ${TREE_NJ_NAME}`,
      `${PROTOCOL_NAME} - ${TREE_UPGMA_NAME}`,
    ]);
  });

  it('shows the protocol and algorithm details and the col access rights when an accordion is expanded', async () => {
    const screen = await renderTrees(
      createCompleteCaseType(true),
      [{
        add_case: false,
        add_case_set: false,
        case_type_id: CASE_TYPE_ID,
        data_collection_id: DATA_COLLECTION.id,
        is_private: false,
        read_case_set: false,
        read_col_ids: [GENETIC_DISTANCE_COL_ID],
        remove_case: false,
        remove_case_set: false,
        write_case_set: false,
        write_col_ids: [],
      }],
    );

    await screen.getByRole('button', { exact: true, name: `${PROTOCOL_NAME} - ${TREE_NJ_NAME}` }).click();

    await expect.element(screen.getByText(PROTOCOL_DESCRIPTION, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText(`${TREE_NJ_NAME} description`, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Access rights', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Effective rights: read', { exact: true })).toBeInTheDocument();
  });
});
