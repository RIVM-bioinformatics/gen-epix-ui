import { createRef } from 'react';
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
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import { renderComponent } from '../../../test/lib';

import { CaseTypeInfoDialogWithLoader } from './CaseTypeInfoDialogWithLoader';
import type { CaseTypeInfoDialogWithLoaderRefMethods } from './CaseTypeInfoDialogWithLoader';

const CASE_TYPE_ID = 'case-type-1';
const CASE_TYPE_NAME = 'Case type one';
const DATA_COLLECTION_ID = 'data-collection-1';
const DESCRIPTION = 'Loaded case type description';
const TEXT_COL_ID = 'col-text';

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: 'ref-dim-other' };
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-other': { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  };
  const textCol = { case_type_id: CASE_TYPE_ID, code: 'text', dim_id: dim.id, id: TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
  };
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: DATA_COLLECTION_ID,
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
    case_type_access_abacs: { [DATA_COLLECTION_ID]: access },
    case_type_share_abacs: {},
    cols: { [textCol.id]: textCol },
    description: DESCRIPTION,
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: CASE_TYPE_NAME,
    ordered_col_ids: [textCol.id],
    ordered_col_ids_by_dim: { [dim.id]: [textCol.id] },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

// Matches the storage name built by DashboardStoreLoaderContent so the persisted table store can be cleaned up.
const STORAGE_NAME_POST_FIX = `epiDashboardStoreLoader-${StringUtil.createSlug(CASE_TYPE_NAME)}-${StringUtil.createHash(CASE_TYPE_ID)}`;

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/complete_case_types', () => Response.json(createCompleteCaseType()));
  mockApiRequest('GET', '/v1/concept_sets', () => Response.json([]));
  mockApiRequest('GET', '/v1/concepts', () => Response.json([]));
  mockApiRequest('GET', '/v1/organizations', () => Response.json([]));
  mockApiRequest('GET', '/v1/diseases', () => Response.json([]));
  mockApiRequest('GET', '/v1/etiological_agents', () => Response.json([]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
  mockApiRequest('GET', '/v1/tree_algorithms', () => Response.json([]));
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [], is_max_results_exceeded: false }));
};

describe('CaseTypeInfoDialogWithLoader', () => {
  beforeEach(() => {
    registerHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('loads the complete case type and renders the dialog content with its title and description', async () => {
    const ref = createRef<CaseTypeInfoDialogWithLoaderRefMethods>();
    const screen = await renderComponent(
      <CaseTypeInfoDialogWithLoader ref={ref} />,
    );

    ref.current?.open({ caseTypeId: CASE_TYPE_ID });

    await expect.element(screen.getByTestId('CaseTypeInfoDialogWithLoader')).toBeInTheDocument();
    await expect.element(screen.getByRole('heading', { name: new RegExp(`^${CASE_TYPE_NAME}`) })).toBeInTheDocument();
    await expect.element(screen.getByText(DESCRIPTION)).toBeInTheDocument();
  });
});
