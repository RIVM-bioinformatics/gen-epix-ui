import type {
  CaseDbCase,
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

import { CaseSummary } from './CaseSummary';

const CASE_TYPE_ID = 'case-type-1';
const DATA_COLLECTION_ID = 'dc-1';
const STORAGE_NAME_POST_FIX = 'case-summary';
const SHOW_LESS_LABEL = 'Show one less attribute';
const SHOW_MORE_LABEL = 'Show one more attribute';

const REF_DIM_OTHER: CaseDbRefDim = { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' };
const DIM_OTHER: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: REF_DIM_OTHER.id };

const createCol = (id: string, label: string, refColId: string): CaseDbCol => {
  return {
    case_type_id: CASE_TYPE_ID,
    code: id,
    dim_id: DIM_OTHER.id,
    id,
    label,
    rank: 1,
    ref_col_id: refColId,
  };
};

const COL_ALPHA = createCol('col-alpha', 'Alpha label', 'ref-col-alpha');
const COL_BETA = createCol('col-beta', 'Beta label', 'ref-col-beta');
const COL_EMPTY = createCol('col-empty', 'Empty label', 'ref-col-empty');
const COL_BROKEN = createCol('col-broken', 'Broken label', 'ref-col-missing');
const COL_GAMMA = createCol('col-gamma', 'Gamma label', 'ref-col-gamma');
const COL_HIDDEN = createCol('col-hidden', 'Hidden label', 'ref-col-hidden');

const createRefCol = (code: string): CaseDbRefCol => {
  return { code, col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_OTHER.id };
};

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  // COL_BROKEN is deliberately absent: its ref col does not exist, which would break FilterUtil on the case type.
  const cols = [COL_ALPHA, COL_BETA, COL_EMPTY, COL_GAMMA, COL_HIDDEN];
  const caseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: cols.map(col => col.id),
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [] as string[],
  };
  return {
    case_date_dim_id: null,
    case_type_access_abacs: { [DATA_COLLECTION_ID]: caseTypeAccessAbac },
    case_type_share_abacs: {},
    cols: Object.fromEntries(cols.map(col => [col.id, col])),
    dims: { [DIM_OTHER.id]: DIM_OTHER },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: cols.map(col => col.id),
    ordered_col_ids_by_dim: { [DIM_OTHER.id]: cols.map(col => col.id) },
    ordered_dim_ids: [DIM_OTHER.id],
    ref_cols: {
      'ref-col-alpha': createRefCol('alpha'),
      'ref-col-beta': createRefCol('beta'),
      'ref-col-empty': createRefCol('empty'),
      'ref-col-gamma': createRefCol('gamma'),
      'ref-col-hidden': createRefCol('hidden'),
    },
    ref_dims: { [REF_DIM_OTHER.id]: REF_DIM_OTHER },
    tree_algorithms: {},
    user_id: null,
  };
};

const CASE: CaseDbCase = {
  case_type_id: CASE_TYPE_ID,
  content: {
    'col-alpha': 'Alpha value',
    'col-beta': 'Beta value',
    'col-broken': 'Broken value',
    'col-gamma': 'Gamma value',
  },
  created_in_data_collection_id: DATA_COLLECTION_ID,
  id: 'case-1',
};

let store: StoreApi<DashboardStore>;

const createTableColumn = (col: CaseDbCol, isInitiallyVisible: boolean): TableColumn<CaseDbCase, CaseDbCompleteCaseType> => {
  return {
    columnContext: col,
    headerName: col.label,
    id: col.id,
    isInitiallyVisible,
    type: 'text',
  } as TableColumn<CaseDbCase, CaseDbCompleteCaseType>;
};

const seedColumns = () => {
  const plainColumn: TableColumn<CaseDbCase, CaseDbCompleteCaseType> = {
    headerName: 'Plain column without context',
    id: 'plain-column',
    isInitiallyVisible: true,
    type: 'text',
  };
  const columns = [
    createTableColumn(COL_ALPHA, true),
    plainColumn,
    createTableColumn(COL_BETA, true),
    createTableColumn(COL_EMPTY, true),
    createTableColumn(COL_BROKEN, true),
    createTableColumn(COL_GAMMA, true),
    createTableColumn(COL_HIDDEN, false),
  ];
  store.getState().setColumns(columns);
  store.getState().setColumnVisualSettingsUncondensed(TableUtil.createInitialVisualColumnSettings(columns));
};

const renderSummary = async () => {
  return renderComponent(
    <DashboardStoreContext value={store}>
      <TableStoreContextProvider store={store}>
        <CaseSummary caseDbCase={CASE} />
      </TableStoreContextProvider>
    </DashboardStoreContext>,
  );
};

describe('CaseSummary', () => {
  beforeEach(() => {
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

  it('shows the values of the visible context columns with their labels', async () => {
    const screen = await renderSummary();

    await expect.element(screen.getByText('Alpha label')).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha value')).toBeInTheDocument();
    await expect.element(screen.getByText('Beta label')).toBeInTheDocument();
    await expect.element(screen.getByText('Beta value')).toBeInTheDocument();
    await expect.element(screen.getByText('Gamma label')).toBeInTheDocument();
    await expect.element(screen.getByText('Gamma value')).toBeInTheDocument();
  });

  it('does not show hidden columns or columns without a column context', async () => {
    const screen = await renderSummary();

    await expect.element(screen.getByText('Alpha label')).toBeInTheDocument();
    await expect.element(screen.getByText('Hidden label')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Plain column without context')).not.toBeInTheDocument();
  });

  it('omits an attribute whose value cannot be resolved', async () => {
    const screen = await renderSummary();

    await expect.element(screen.getByText('Gamma label')).toBeInTheDocument();
    await expect.element(screen.getByText('Broken label')).not.toBeInTheDocument();
  });

  it('shows the empty label for a column without a value', async () => {
    const screen = await renderSummary();

    await expect.element(screen.getByText('Empty label')).toBeInTheDocument();
  });

  it('shows one less attribute when the remove action is clicked', async () => {
    const screen = await renderSummary();

    await screen.getByRole('button', { name: SHOW_LESS_LABEL }).click();

    await expect.element(screen.getByText('Empty label')).toBeInTheDocument();
    await expect.element(screen.getByText('Gamma label')).not.toBeInTheDocument();
    expect(store.getState().numVisibleAttributesInSummary).toBe(4);
  });

  it('shows one less attribute than the number of visible columns when the count exceeds them', async () => {
    const screen = await renderSummary();
    store.getState().setNumVisibleAttributesInSummary(7);

    await screen.getByRole('button', { name: SHOW_LESS_LABEL }).click();

    expect(store.getState().numVisibleAttributesInSummary).toBe(4);
    await expect.element(screen.getByText('Empty label')).toBeInTheDocument();
    await expect.element(screen.getByText('Gamma label')).not.toBeInTheDocument();
  });

  it('decreases the number of shown attributes by one on each remove action until one remains', async () => {
    const screen = await renderSummary();
    store.getState().setNumVisibleAttributesInSummary(3);

    await screen.getByRole('button', { name: SHOW_LESS_LABEL }).click();
    expect(store.getState().numVisibleAttributesInSummary).toBe(2);
    await screen.getByRole('button', { name: SHOW_LESS_LABEL }).click();
    expect(store.getState().numVisibleAttributesInSummary).toBe(1);

    await expect.element(screen.getByRole('button', { name: SHOW_LESS_LABEL })).toBeDisabled();
    await expect.element(screen.getByText('Alpha label')).toBeInTheDocument();
    await expect.element(screen.getByText('Beta label')).not.toBeInTheDocument();
  });

  it('shows one more attribute when the add action is clicked', async () => {
    const screen = await renderSummary();
    store.getState().setNumVisibleAttributesInSummary(1);

    await screen.getByRole('button', { name: SHOW_MORE_LABEL }).click();

    expect(store.getState().numVisibleAttributesInSummary).toBe(2);
    await expect.element(screen.getByText('Beta label')).toBeInTheDocument();
  });

  it('disables the add action when all but one of the attributes are shown', async () => {
    const screen = await renderSummary();

    await expect.element(screen.getByRole('button', { name: SHOW_MORE_LABEL })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: SHOW_LESS_LABEL })).toBeEnabled();
  });

});
