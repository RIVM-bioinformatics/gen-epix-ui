import {
  CaseDbColType,
  CaseDbDimType,
  CaseDbEtlStatus,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { createElement } from 'react';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from './completeCaseType';

export const DASHBOARD_CASE_ID = 'case-dashboard-1';

export const DASHBOARD_GEO_DIM_ID = 'dim-geo';
export const DASHBOARD_GEO_COL_ID = 'col-geo';
const DASHBOARD_REF_DIM_GEO_ID = 'ref-dim-geo';
const DASHBOARD_REF_COL_GEO_ID = 'ref-col-geo';
const DASHBOARD_REGION_SET_ID = 'region-set-1';
const DASHBOARD_REGION_SETS: CaseDbRegionSet[] = [
  { code: DASHBOARD_REGION_SET_ID, id: DASHBOARD_REGION_SET_ID, name: 'Region set one' } as CaseDbRegionSet,
];
const DASHBOARD_REGIONS: CaseDbRegion[] = [
  { code: '1', id: 'region-1', name: 'Region one', region_set_id: DASHBOARD_REGION_SET_ID } as CaseDbRegion,
];

export const INJECTED_DASHBOARD_COMPONENT_TEXT = 'Injected dashboard component';

export const InjectedDashboardComponent = () => createElement('div', undefined, INJECTED_DASHBOARD_COMPONENT_TEXT);

/**
 * Removes the persisted dashboard table store for the shared complete case type and the persisted user profile.
 */
export const clearDashboardStorage = () => {
  localStorage.removeItem(`GENEPIX-TableStore-epiDashboardStoreLoader-${StringUtil.createSlug(COMPLETE_CASE_TYPE_NAME)}-${StringUtil.createHash(COMPLETE_CASE_TYPE_ID)}`);
  localStorage.removeItem('GENEPIX-User-Profile');
};

/**
 * Creates a minimal case of the shared complete case type.
 */
export const createDashboardCase = (overrides: Partial<CaseDbCase> = {}): CaseDbCase => {
  return {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    id: DASHBOARD_CASE_ID,
    ...overrides,
  } as CaseDbCase;
};

/**
 * Creates a complete case type with the operational props the dashboard reads.
 * It includes one geo dimension so the standard dashboard map has a geo dimension to render, the map shows its unavailable state since no region shapes are mocked.
 */
export const createDashboardCompleteCaseType = (overrides: Partial<CaseDbCompleteCaseType> = {}): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const geoDim: CaseDbDim = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo', id: DASHBOARD_GEO_DIM_ID, label: 'Geo', rank: 2, ref_dim_id: DASHBOARD_REF_DIM_GEO_ID };
  const geoCol: CaseDbCol = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo', dim_id: DASHBOARD_GEO_DIM_ID, id: DASHBOARD_GEO_COL_ID, label: 'Region', rank: 1, ref_col_id: DASHBOARD_REF_COL_GEO_ID };
  const geoRefDim: CaseDbRefDim = { code: 'geo', dim_type: CaseDbDimType.GEO, id: DASHBOARD_REF_DIM_GEO_ID, label: 'Geo' };
  const geoRefCol: CaseDbRefCol = { code: 'geo', col_type: CaseDbColType.GEO_REGION, ref_dim_id: DASHBOARD_REF_DIM_GEO_ID, region_set_id: DASHBOARD_REGION_SET_ID };
  const readColIds = [...base.ordered_col_ids, geoCol.id];
  const baseAccess = base.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];

  return createCompleteCaseType({
    case_type_access_abacs: {
      ...base.case_type_access_abacs,
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: { ...baseAccess, read_col_ids: readColIds },
    },
    cols: { ...base.cols, [geoCol.id]: geoCol },
    dims: { ...base.dims, [geoDim.id]: geoDim },
    ordered_col_ids: readColIds,
    ordered_col_ids_by_dim: { ...base.ordered_col_ids_by_dim, [geoDim.id]: [geoCol.id] },
    ordered_dim_ids: [...base.ordered_dim_ids, geoDim.id],
    props: { read_max_n_cases: 1000, read_max_tree_size: 100 },
    ref_cols: { ...base.ref_cols, [DASHBOARD_REF_COL_GEO_ID]: geoRefCol },
    ref_dims: { ...base.ref_dims, [DASHBOARD_REF_DIM_GEO_ID]: geoRefDim },
    ...overrides,
  });
};

/**
 * Registers the endpoints needed to render the dashboard: the complete case type loader, case querying, case rights, case upload and the region endpoints used by the map.
 */
export const mockDashboardApi = (completeCaseType: CaseDbCompleteCaseType = createDashboardCompleteCaseType()) => {
  mockCompleteCaseTypeLoaderApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [], is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
  mockApiRequest('POST', '/v1/retrieve/case_rights', () => Response.json([]));
  mockApiRequest('POST', '/v1/upload/cases', () => Response.json({ cases: [], status: CaseDbEtlStatus.SUCCESS }));
  mockApiRequest('POST', '/v1/region_set_shapes/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/region_sets/query', () => Response.json(DASHBOARD_REGION_SETS));
  mockApiRequest('POST', '/v1/regions/query', () => Response.json(DASHBOARD_REGIONS));
};
