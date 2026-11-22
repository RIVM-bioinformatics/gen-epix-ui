import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetMember,
  CaseDbCaseSetStatus,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import type { TableColumn } from '@gen-epix/ui-client-common/models/table.models';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';
import { TableUtil } from '@gen-epix/ui-client-common/utils/TableUtil';

import { renderComponent } from '../../../test/lib';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import type { DashboardStore } from '../../../stores/dashboardStore';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';

import { CasesAlreadyInCaseSetWarning } from './CasesAlreadyInCaseSetWarning';

const CASE_TYPE_ID = 'case-type-1';
const DATA_COLLECTION_ID = 'dc-1';
const STORAGE_NAME_POST_FIX = 'cases-already-in-case-set-warning';
const CATEGORY_ID = 'category-1';
const STATUS_ID = 'status-1';

const REF_DIM_OTHER: CaseDbRefDim = { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' };
const DIM_OTHER: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: REF_DIM_OTHER.id };
const COL_ALPHA: CaseDbCol = {
  case_type_id: CASE_TYPE_ID,
  code: 'col-alpha',
  dim_id: DIM_OTHER.id,
  id: 'col-alpha',
  label: 'Alpha label',
  rank: 1,
  ref_col_id: 'ref-col-alpha',
};
const REF_COL_ALPHA: CaseDbRefCol = { code: 'alpha', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_OTHER.id };

const CATEGORY: CaseDbCaseSetCategory = { description: null, id: CATEGORY_ID, name: 'Category A', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: null, id: STATUS_ID, name: 'Status A', rank: 1 };

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  return {
    case_date_dim_id: null,
    case_type_access_abacs: {
      [DATA_COLLECTION_ID]: {
        add_case: false,
        add_case_set: false,
        case_type_id: CASE_TYPE_ID,
        data_collection_id: DATA_COLLECTION_ID,
        is_private: false,
        read_case_set: false,
        read_col_ids: [COL_ALPHA.id],
        remove_case: false,
        remove_case_set: false,
        write_case_set: false,
        write_col_ids: [] as string[],
      },
    },
    case_type_share_abacs: {},
    cols: { [COL_ALPHA.id]: COL_ALPHA },
    dims: { [DIM_OTHER.id]: DIM_OTHER },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: [COL_ALPHA.id],
    ordered_col_ids_by_dim: { [DIM_OTHER.id]: [COL_ALPHA.id] },
    ordered_dim_ids: [DIM_OTHER.id],
    ref_cols: { 'ref-col-alpha': REF_COL_ALPHA },
    ref_dims: { [REF_DIM_OTHER.id]: REF_DIM_OTHER },
    tree_algorithms: {},
    user_id: null,
  };
};

const createCase = (id: string, content: string): CaseDbCase => {
  return {
    case_type_id: CASE_TYPE_ID,
    content: { [COL_ALPHA.id]: content },
    created_in_data_collection_id: DATA_COLLECTION_ID,
    id,
  };
};

const createCaseSet = (id: string, name: string): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY_ID,
    case_set_status_id: STATUS_ID,
    case_type_id: CASE_TYPE_ID,
    code: `code-${id}`,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    description: '',
    id,
    name,
  };
};

const createMember = (id: string, caseId: string, caseSetId: string): CaseDbCaseSetMember => {
  return { case_id: caseId, case_set_id: caseSetId, id };
};

const CASE_ONE = createCase('case-1', 'Alpha value');
const CASE_TWO = createCase('case-2', 'Beta value');
const CASE_SET_ALPHA = createCaseSet('case-set-1', 'Alpha event');
const CASE_SET_ZETA = createCaseSet('case-set-2', 'Zeta event');

let store: StoreApi<DashboardStore>;
let caseSetMembersResponse: CaseDbCaseSetMember[] = [];
let caseSetsResponse: CaseDbCaseSet[] = [];
let isCaseSetMembersFailing = false;
let isCaseSetsFailing = false;
let caseSetMembersRequestCount = 0;
let caseSetsRequestCount = 0;

const renderWarning = async (cases: CaseDbCase[]) => {
  return renderComponent(
    <DashboardStoreContext value={store}>
      <TableStoreContextProvider store={store}>
        <CasesAlreadyInCaseSetWarning cases={cases} />
      </TableStoreContextProvider>
    </DashboardStoreContext>,
  );
};

const seedColumns = () => {
  const column: TableColumn<CaseDbCase, CaseDbCompleteCaseType> = {
    columnContext: COL_ALPHA,
    headerName: COL_ALPHA.label,
    id: COL_ALPHA.id,
    isInitiallyVisible: true,
    type: 'text',
  } as TableColumn<CaseDbCase, CaseDbCompleteCaseType>;
  const columns = [column];
  store.getState().setColumns(columns);
  store.getState().setColumnVisualSettingsUncondensed(TableUtil.createInitialVisualColumnSettings(columns));
};

describe('CasesAlreadyInCaseSetWarning', () => {
  beforeEach(() => {
    caseSetMembersResponse = [];
    caseSetsResponse = [];
    isCaseSetMembersFailing = false;
    isCaseSetsFailing = false;
    caseSetMembersRequestCount = 0;
    caseSetsRequestCount = 0;

    mockApiRequest('POST', '/v1/case_set_members/query', () => {
      caseSetMembersRequestCount += 1;
      if (isCaseSetMembersFailing) {
        return Response.json({ detail: 'Internal error' }, { status: 500 });
      }
      return Response.json(caseSetMembersResponse);
    });
    mockApiRequest('POST', '/v1/case_sets/query', () => {
      caseSetsRequestCount += 1;
      if (isCaseSetsFailing) {
        return Response.json({ detail: 'Internal error' }, { status: 500 });
      }
      return Response.json(caseSetsResponse);
    });
    mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
    mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));

    store = createDashboardStore({
      caseSetId: 'case-set-1',
      completeCaseType: createCompleteCaseType(),
      config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
      idSelectorCallback: (row: CaseDbCase) => row.id,
      storageNamePostFix: STORAGE_NAME_POST_FIX,
      storageVersion: 1,
    });
    store.setState({ globalAbortSignal: new AbortController().signal });
    seedColumns();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('does not query case sets and shows no warning when none of the cases is in a case set', async () => {
    const screen = await renderWarning([CASE_ONE]);

    await expect.poll(() => caseSetMembersRequestCount).toBe(1);
    await expect.poll(() => screen.getByRole('alert').elements().length).toBe(0);
    expect(caseSetsRequestCount).toBe(0);
  });

  it('shows the case with all its case sets, sorted by name', async () => {
    caseSetMembersResponse = [
      createMember('member-1', CASE_ONE.id, CASE_SET_ZETA.id),
      createMember('member-2', CASE_ONE.id, CASE_SET_ALPHA.id),
    ];
    caseSetsResponse = [CASE_SET_ZETA, CASE_SET_ALPHA];
    const screen = await renderWarning([CASE_ONE]);

    await expect.element(screen.getByText('1 selected case(s) are already part of other event(s):')).toBeInTheDocument();
    await expect.element(screen.getByText('Case', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Events', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha value')).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('link').elements().map(element => element.textContent)).toEqual([
      'Alpha event (Category A, Status A)',
      'Zeta event (Category A, Status A)',
    ]);
  });

  it('counts every case that is part of a case set', async () => {
    caseSetMembersResponse = [
      createMember('member-1', CASE_ONE.id, CASE_SET_ALPHA.id),
      createMember('member-2', CASE_TWO.id, CASE_SET_ZETA.id),
    ];
    caseSetsResponse = [CASE_SET_ALPHA, CASE_SET_ZETA];
    const screen = await renderWarning([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('2 selected case(s) are already part of other event(s):')).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha value')).toBeInTheDocument();
    await expect.element(screen.getByText('Beta value')).toBeInTheDocument();
  });

  it('skips members whose case or case set is unknown', async () => {
    caseSetMembersResponse = [
      createMember('member-1', CASE_ONE.id, CASE_SET_ALPHA.id),
      createMember('member-2', 'unknown-case', CASE_SET_ALPHA.id),
      createMember('member-3', CASE_ONE.id, 'unknown-case-set'),
    ];
    caseSetsResponse = [CASE_SET_ALPHA];
    const screen = await renderWarning([CASE_ONE]);

    await expect.element(screen.getByText('1 selected case(s) are already part of other event(s):')).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('link').elements().map(element => element.textContent)).toEqual([
      'Alpha event (Category A, Status A)',
    ]);
  });

  it('shows an error when the case set members cannot be loaded', async () => {
    isCaseSetMembersFailing = true;
    const screen = await renderWarning([CASE_ONE]);

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    expect(screen.getByRole('alert').elements().length).toBe(0);
  });

  it('shows an error when the case sets cannot be loaded', async () => {
    caseSetMembersResponse = [createMember('member-1', CASE_ONE.id, CASE_SET_ALPHA.id)];
    isCaseSetsFailing = true;
    const screen = await renderWarning([CASE_ONE]);

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    expect(screen.getByRole('alert').elements().length).toBe(0);
  });
});
