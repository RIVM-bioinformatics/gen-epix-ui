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
  CaseDbCol,
  CaseDbCompleteCaseType,
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

import { CaseTypeInfoRegions } from './CaseTypeInfoRegions';

const CASE_TYPE_ID = 'case-type-1';
const DIM_ID = 'dim-other';
const REF_DIM_ID = 'ref-dim-other';
const REGION_SET_ONE_ID = 'region-set-1';
const REGION_SET_TWO_ID = 'region-set-2';
const REGION_SET_ONE_NAME = 'Region set one';
const REGION_SET_TWO_NAME = 'Region set two';
const MANY_REGIONS_COUNT = 16;

const createRegionSet = (id: string, name: string): CaseDbRegionSet => ({
  code: id,
  id,
  name,
} as CaseDbRegionSet);

const createRegion = (id: string, regionSetId: string, code: string, name: string): CaseDbRegion => ({
  code,
  id,
  name,
  region_set_id: regionSetId,
} as CaseDbRegion);

// Codes are deliberately out of numeric order so that sorting is observable
const REGIONS_SET_ONE: CaseDbRegion[] = [
  createRegion('region-10', REGION_SET_ONE_ID, '10', 'Region ten'),
  createRegion('region-2', REGION_SET_ONE_ID, '2', 'Region two'),
  createRegion('region-1', REGION_SET_ONE_ID, '1', 'Region one'),
];

const REGIONS_SET_TWO: CaseDbRegion[] = Array.from({ length: MANY_REGIONS_COUNT }, (_, index) => createRegion(
  `region-two-${index + 1}`,
  REGION_SET_TWO_ID,
  `${index + 1}`,
  `Region two-${index + 1}`,
));

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: DIM_ID, label: 'Other', rank: 1, ref_dim_id: REF_DIM_ID };
  const refDims: Record<string, CaseDbRefDim> = {
    [REF_DIM_ID]: { code: 'other', dim_type: CaseDbDimType.OTHER, id: REF_DIM_ID, label: 'Other' },
  };
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-set-one-a': { code: 'set_one_a', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_ID, region_set_id: REGION_SET_ONE_ID },
    // Same region set as above, so the region set must be listed only once
    'ref-col-set-one-b': { code: 'set_one_b', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_ID, region_set_id: REGION_SET_ONE_ID },
    'ref-col-set-two': { code: 'set_two', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_ID, region_set_id: REGION_SET_TWO_ID },
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_ID },
  };
  const cols: Record<string, CaseDbCol> = {};
  Object.entries(refCols).forEach(([refColId, refCol]) => {
    const colId = `col-${refCol.code}`;
    cols[colId] = { case_type_id: CASE_TYPE_ID, code: refCol.code, dim_id: DIM_ID, id: colId, label: refCol.code, rank: 1, ref_col_id: refColId };
  });
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
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: orderedColIds,
    ordered_col_ids_by_dim: { [dim.id]: orderedColIds },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

const registerHandlers = () => {
  mockApiRequest('POST', '/v1/region_sets/query', () => Response.json([
    createRegionSet(REGION_SET_ONE_ID, REGION_SET_ONE_NAME),
    createRegionSet(REGION_SET_TWO_ID, REGION_SET_TWO_NAME),
  ]));
  mockApiRequest('POST', '/v1/regions/query', () => Response.json([...REGIONS_SET_ONE, ...REGIONS_SET_TWO]));
};

const getRowCodes = (table: Element): string[] => Array.from(table.querySelectorAll('tbody tr td:first-child')).map(cell => cell.textContent);

describe('CaseTypeInfoRegions', () => {
  beforeEach(async () => {
    registerHandlers();
    await container.resolve(DataService).loadMissingRegions(createCompleteCaseType(), new AbortController().signal);
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders one accordion per distinct region set referenced by the ref cols', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoRegions completeCaseType={createCompleteCaseType()} />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: REGION_SET_ONE_NAME })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { exact: true, name: REGION_SET_TWO_NAME })).toBeInTheDocument();
  });

  it('lists the regions of an expanded region set sorted numerically by code', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoRegions completeCaseType={createCompleteCaseType()} />,
    );

    await screen.getByRole('button', { exact: true, name: REGION_SET_ONE_NAME }).click();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    const table = screen.getByRole('table').element();
    expect(getRowCodes(table)).toEqual(['1', '2', '10']);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Region ten' })).toBeInTheDocument();
  });

  it('lists all regions of a region set with more than 15 regions', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoRegions completeCaseType={createCompleteCaseType()} />,
    );

    await screen.getByRole('button', { exact: true, name: REGION_SET_TWO_NAME }).click();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    const table = screen.getByRole('table').element();
    expect(getRowCodes(table)).toHaveLength(MANY_REGIONS_COUNT);
    await expect.element(screen.getByRole('cell', { exact: true, name: `Region two-${MANY_REGIONS_COUNT}` })).toBeInTheDocument();
  });

  it('renders nothing for a complete case type without region sets', async () => {
    const completeCaseType = createCompleteCaseType();
    completeCaseType.ref_cols = { 'ref-col-text': completeCaseType.ref_cols['ref-col-text'] };
    const screen = await renderComponent(
      <CaseTypeInfoRegions completeCaseType={completeCaseType} />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: REGION_SET_ONE_NAME })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { exact: true, name: REGION_SET_TWO_NAME })).not.toBeInTheDocument();
  });
});
