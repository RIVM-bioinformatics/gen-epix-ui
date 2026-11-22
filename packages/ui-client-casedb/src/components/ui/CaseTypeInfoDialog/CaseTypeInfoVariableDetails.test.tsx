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
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import { DataService } from '../../../classes/services/DataService';
import { CaseTypeAbacContextProvider } from '../../../context/caseTypeAbac';

import { CaseTypeInfoVariableDetails } from './CaseTypeInfoVariableDetails';

const CASE_TYPE_ID = 'case-type-1';
const DIM_ID = 'dim-variables';
const REF_DIM_ID = 'ref-dim-variables';
const DIM_DESCRIPTION = 'Variables dimension description';
const REGION_SET_ID = 'region-set-1';
const REGION_SET_NAME = 'Region set one';
const CONCEPT_SET_ID = 'concept-set-1';
const MISSING_CONCEPT_SET_ID = 'concept-set-missing';
const DATA_COLLECTION: CaseDbDataCollection = { id: 'dc-alpha', name: 'Alpha collection' };

const createRefCol = (code: string, colType: CaseDbColType, overrides: Partial<CaseDbRefCol> = {}): CaseDbRefCol => ({
  code,
  col_type: colType,
  description: `${code} description`,
  ref_dim_id: REF_DIM_ID,
  ...overrides,
});

const createCol = (refColId: string, overrides: Partial<CaseDbCol> = {}): CaseDbCol => ({
  case_type_id: CASE_TYPE_ID,
  code: `col-${refColId}`,
  dim_id: DIM_ID,
  id: `col-${refColId}`,
  label: refColId,
  rank: 1,
  ref_col_id: refColId,
  ...overrides,
});

const createConceptSet = (id: string): CaseDbConceptSet => ({ code: id, id, name: id } as CaseDbConceptSet);

const createConcept = (id: string, conceptSetId: string, code: string, name: string): CaseDbConcept => ({
  code,
  concept_set_id: conceptSetId,
  id,
  name,
});

const createRegionSet = (): CaseDbRegionSet => ({ code: REGION_SET_ID, id: REGION_SET_ID, name: REGION_SET_NAME } as CaseDbRegionSet);

const createRegion = (): CaseDbRegion => ({ code: 'r1', id: 'region-1', name: 'Region one', region_set_id: REGION_SET_ID } as CaseDbRegion);

const REF_COLS: Record<string, CaseDbRefCol> = {
  'ref-col-decimal-both': createRefCol('decimal_both', CaseDbColType.DECIMAL_2),
  'ref-col-decimal-max': createRefCol('decimal_max', CaseDbColType.DECIMAL_1),
  'ref-col-decimal-min': createRefCol('decimal_min', CaseDbColType.DECIMAL_1),
  'ref-col-decimal-none': createRefCol('decimal_none', CaseDbColType.DECIMAL_0),
  'ref-col-genetic-distance': createRefCol('genetic_distance', CaseDbColType.GENETIC_DISTANCE),
  'ref-col-geo': createRefCol('geo', CaseDbColType.GEO_REGION, { region_set_id: REGION_SET_ID }),
  'ref-col-geo-none': createRefCol('geo_none', CaseDbColType.GEO_REGION),
  'ref-col-nominal': createRefCol('nominal', CaseDbColType.NOMINAL, { concept_set_id: CONCEPT_SET_ID }),
  'ref-col-nominal-none': createRefCol('nominal_none', CaseDbColType.NOMINAL),
  'ref-col-ordinal-missing': createRefCol('ordinal_missing', CaseDbColType.ORDINAL, { concept_set_id: MISSING_CONCEPT_SET_ID }),
  'ref-col-text-length': createRefCol('text_length', CaseDbColType.TEXT),
  'ref-col-text-none': createRefCol('text_none', CaseDbColType.TEXT),
  'ref-col-time-both': createRefCol('time_both', CaseDbColType.TIME_DAY),
  'ref-col-time-max': createRefCol('time_max', CaseDbColType.TIME_MONTH),
  'ref-col-time-min': createRefCol('time_min', CaseDbColType.TIME_YEAR),
  'ref-col-time-none': createRefCol('time_none', CaseDbColType.TIME_WEEK),
};

const COL_OVERRIDES: Record<string, Partial<CaseDbCol>> = {
  'ref-col-decimal-both': { max_value: 9, min_value: 1.5 },
  'ref-col-decimal-max': { max_value: 7, min_value: null },
  'ref-col-decimal-min': { max_value: null, min_value: 2 },
  'ref-col-decimal-none': { max_value: null, min_value: null },
  'ref-col-text-length': { max_length: 40 },
  'ref-col-text-none': { max_length: null },
  'ref-col-time-both': { max_datetime: '2020-12-31', min_datetime: '2020-01-01' },
  'ref-col-time-max': { max_datetime: '2021-06', min_datetime: null },
  'ref-col-time-min': { max_datetime: null, min_datetime: '2020' },
  'ref-col-time-none': { max_datetime: null, min_datetime: null },
};

const COLS: CaseDbCol[] = Object.keys(REF_COLS).map(refColId => createCol(refColId, COL_OVERRIDES[refColId]));

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = {
    case_type_id: CASE_TYPE_ID,
    code: 'variables',
    description: DIM_DESCRIPTION,
    id: DIM_ID,
    label: 'Variables',
    rank: 1,
    ref_dim_id: REF_DIM_ID,
  };
  const refDims: Record<string, CaseDbRefDim> = {
    [REF_DIM_ID]: { code: 'variables', dim_type: CaseDbDimType.OTHER, id: REF_DIM_ID, label: 'Variables' },
  };
  const cols = Object.fromEntries(COLS.map(col => [col.id, col]));
  const orderedColIds = COLS.map(col => col.id);

  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols,
    description: 'Description',
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: orderedColIds,
    ordered_col_ids_by_dim: { [dim.id]: orderedColIds },
    ordered_dim_ids: [dim.id],
    ref_cols: REF_COLS,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

const createDim = (): CaseDbDim => createCompleteCaseType().dims[DIM_ID];

const registerHandlers = () => {
  mockApiRequest('POST', '/v1/region_sets/query', () => Response.json([createRegionSet()]));
  mockApiRequest('POST', '/v1/regions/query', () => Response.json([createRegion()]));
  mockApiRequest('GET', '/v1/concept_sets', () => Response.json([createConceptSet(CONCEPT_SET_ID)]));
  mockApiRequest('GET', '/v1/concepts', () => Response.json([
    createConcept('concept-alpha', CONCEPT_SET_ID, 'a', 'Alpha'),
    createConcept('concept-beta', CONCEPT_SET_ID, 'b', 'Beta'),
  ]));
};

const renderVariableDetails = async (caseTypeAccessAbacs: CaseDbCaseTypeAccessAbac[] = []) => {
  const caseTypeAccessAbacDict = Object.fromEntries(caseTypeAccessAbacs.map(access => [access.data_collection_id, access]));
  return renderComponent(
    <CaseTypeAbacContextProvider
      caseTypeAbac={{
        caseTypeAccessAbacDict,
        userDataCollections: [DATA_COLLECTION],
        userDataCollectionsMap: new Map([[DATA_COLLECTION.id, DATA_COLLECTION]]),
      }}
    >
      <CaseTypeInfoVariableDetails
        completeCaseType={createCompleteCaseType()}
        dim={createDim()}
      />
    </CaseTypeAbacContextProvider>,
  );
};

// Maps each column code to the text of its row's cells (code, description, type, constraints)
const getRowTextsByCode = (table: Element) => Object.fromEntries(
  Array.from(table.querySelectorAll('tbody tr')).map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    return [cells[0].textContent, cells.map(cell => cell.textContent)];
  }),
);

describe('CaseTypeInfoVariableDetails', () => {
  beforeEach(async () => {
    registerHandlers();
    const dataService = container.resolve(DataService);
    const signal = new AbortController().signal;
    await dataService.loadMissingRegions(createCompleteCaseType(), signal);
    await dataService.loadConcepts(signal);
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the dimension description', async () => {
    const screen = await renderVariableDetails();

    await expect.element(screen.getByText(DIM_DESCRIPTION, { exact: true })).toBeInTheDocument();
  });

  it('lists every column except genetic distance columns with its type and description', async () => {
    const screen = await renderVariableDetails();
    const table = screen.getByRole('table').element();

    const rowTextsByCode = getRowTextsByCode(table);
    expect(Object.keys(rowTextsByCode)).not.toContain('col-ref-col-genetic-distance');
    expect(rowTextsByCode['col-ref-col-text-none'].slice(0, 3)).toEqual([
      'col-ref-col-text-none',
      'text_none description',
      CaseDbColType.TEXT,
    ]);
    expect(Object.keys(rowTextsByCode)).toHaveLength(COLS.length - 1);
  });

  it('shows the constraints of decimal, time, text and region columns', async () => {
    const screen = await renderVariableDetails();
    const table = screen.getByRole('table').element();

    const constraintsByCode = Object.fromEntries(
      Object.entries(getRowTextsByCode(table)).map(([code, texts]) => [code, texts[3]]),
    );
    expect(constraintsByCode).toEqual({
      'col-ref-col-decimal-both': 'min: 1.5; max: 9',
      'col-ref-col-decimal-max': 'min: ; max: 7',
      'col-ref-col-decimal-min': 'min: 2; max: ',
      'col-ref-col-decimal-none': '',
      'col-ref-col-geo': REGION_SET_NAME,
      'col-ref-col-geo-none': '',
      'col-ref-col-nominal': 'Alpha (a)Beta (b)',
      'col-ref-col-nominal-none': '',
      'col-ref-col-ordinal-missing': '',
      'col-ref-col-text-length': 'Max length: 40',
      'col-ref-col-text-none': '',
      'col-ref-col-time-both': 'from: 2020-01-01; to: 2020-12-31',
      'col-ref-col-time-max': 'from: -; to: 2021-06',
      'col-ref-col-time-min': 'from: 2020; to: -',
      'col-ref-col-time-none': '',
    });
  });

  it('shows the concepts of a nominal column as chips', async () => {
    const screen = await renderVariableDetails();

    await expect.element(screen.getByText('Alpha (a)', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Beta (b)', { exact: true })).toBeInTheDocument();
  });

  it('shows the effective access rights of a column', async () => {
    const screen = await renderVariableDetails([
      {
        add_case: false,
        add_case_set: false,
        case_type_id: CASE_TYPE_ID,
        data_collection_id: DATA_COLLECTION.id,
        is_private: false,
        read_case_set: false,
        read_col_ids: ['col-ref-col-text-length'],
        remove_case: false,
        remove_case_set: false,
        write_case_set: false,
        write_col_ids: [],
      },
    ]);

    await expect.element(screen.getByText('Effective rights: read', { exact: true })).toBeInTheDocument();
  });
});
