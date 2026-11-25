import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

export const COMPLETE_CASE_TYPE_ID = 'case-type-1';
export const COMPLETE_CASE_TYPE_NAME = 'Case type one';
export const COMPLETE_CASE_TYPE_DATA_COLLECTION_ID = 'data-collection-1';
export const COMPLETE_CASE_TYPE_DESCRIPTION = 'Loaded case type description';
export const COMPLETE_CASE_TYPE_TEXT_COL_ID = 'col-text';

export const createCompleteCaseType = (overrides: Partial<CaseDbCompleteCaseType> = {}): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: 'ref-dim-other' };
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-other': { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  };
  const textCol = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'text', dim_id: dim.id, id: COMPLETE_CASE_TYPE_TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
  };
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: [textCol.id],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [],
  };

  return {
    case_date_dim_id: null,
    case_type_access_abacs: { [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: access },
    case_type_share_abacs: {},
    cols: { [textCol.id]: textCol },
    description: COMPLETE_CASE_TYPE_DESCRIPTION,
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: COMPLETE_CASE_TYPE_ID,
    name: COMPLETE_CASE_TYPE_NAME,
    ordered_col_ids: [textCol.id],
    ordered_col_ids_by_dim: { [dim.id]: [textCol.id] },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
    ...overrides,
  };
};

/**
 * Registers the endpoints needed to load a complete case type together with its side-effect data (concepts, regions, organizations, ...).
 */
export const mockCompleteCaseTypeLoaderApi = (completeCaseType: CaseDbCompleteCaseType = createCompleteCaseType()) => {
  mockApiRequest('GET', '/v1/complete_case_types', () => Response.json(completeCaseType));
  mockApiRequest('GET', '/v1/concept_sets', () => Response.json([]));
  mockApiRequest('GET', '/v1/concepts', () => Response.json([]));
  mockApiRequest('GET', '/v1/organizations', () => Response.json([]));
  mockApiRequest('GET', '/v1/diseases', () => Response.json([]));
  mockApiRequest('GET', '/v1/etiological_agents', () => Response.json([]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
  mockApiRequest('GET', '/v1/tree_algorithms', () => Response.json([]));
};
