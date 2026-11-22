import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbCase,
  CaseDbCompleteCaseType,
  CaseDbOrganization,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import type { TableColumnDimension } from '@gen-epix/ui-client-common/models/table.models';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { FeatureFlagsService } from '@gen-epix/ui-client-common/classes/services/FeatureFlagsService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { SelectionFilter } from '../../../classes/filters/SelectionFilter';
import { DataService } from '../../../classes/services/DataService';
import { EventBusService } from '../../../classes/services/EventBusService';
import type { CaseDbConfig } from '../../../models/config.models';
import type {
  FindSimilarCasesResult,
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../models/case-db.models';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import { createCaseSet } from '../../../test/fixtures/caseSet';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  createLineListCompleteCaseType,
  DECIMAL_COL_ID,
  DISTANCE_COL_ID,
  LINE_LIST_CONCEPT_SETS,
  LINE_LIST_CONCEPTS,
  ORGANIZATION_COL_ID,
  SEQUENCE_COL_ID,
  SEX_COL_ID,
} from '../../../test/fixtures/lineListCompleteCaseType';
import { renderComponent } from '../../../test/lib';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';

import { LineListWidget } from './LineListWidget';

const STORAGE_NAME_POST_FIX = 'LineListWidgetPrimaryMenu';
const ORGANIZATION_ONE_ID = 'org-1';
const ORGANIZATION_TWO_ID = 'org-2';
const CASE_SET_ID = 'case-set-1';

const CASE_SET_MEMBERS_PATH = '/v1/case_set_members/query';
const IS_OWN_CASES_PATH = '/v1/retrieve/is_own_cases';
const ORGANIZATIONS: CaseDbOrganization[] = [
  { code: 'ORG1', id: ORGANIZATION_ONE_ID, name: 'Organization One' },
  { code: 'ORG2', id: ORGANIZATION_TWO_ID, name: 'Organization Two' },
];

const CASES: CaseDbCase[] = [
  createDashboardCase({
    content: {
      [DECIMAL_COL_ID]: '1.5',
      [DISTANCE_COL_ID]: 'distance-1',
      [ORGANIZATION_COL_ID]: ORGANIZATION_ONE_ID,
      [SEQUENCE_COL_ID]: 'SEQ-ONE',
      [SEX_COL_ID]: 'concept-male',
    },
    id: 'case-1',
  }),
  createDashboardCase({
    content: {
      [DECIMAL_COL_ID]: '2',
      [DISTANCE_COL_ID]: 'distance-2',
      [ORGANIZATION_COL_ID]: ORGANIZATION_TWO_ID,
      [SEQUENCE_COL_ID]: 'SEQ-TWO',
      [SEX_COL_ID]: 'concept-female',
    },
    id: 'case-2',
  }),
  createDashboardCase({ content: {}, id: 'case-3' }),
];

const ALL_PERMISSIONS = [
  { command_name: CaseDbCommandName.CreateCaseSetCommand, permission_type: CaseDbPermissionType.EXECUTE },
  { command_name: CaseDbCommandName.CaseSetMemberCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.CaseSetMemberCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const createDashboardContextValue = (highlight: DashboardContextValue['highlight'], caseSet: DashboardContextValue['caseSet']): DashboardContextValue => ({
  caseSet,
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

type RenderOptions = {
  caseSet?: DashboardContextValue['caseSet'];
  completeCaseType?: CaseDbCompleteCaseType;
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderPrimaryMenu = async ({
  caseSet = undefined,
  completeCaseType = createLineListCompleteCaseType(),
}: RenderOptions = {}) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  const dashboardStore = createDashboardStore({
    caseSetId: CASE_SET_ID,
    completeCaseType,
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;

  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: CASES.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(CASES));
  const tableColumnDimensions: TableColumnDimension[] = completeCaseType.ordered_dim_ids.map((dimId) => ({
    columnIds: completeCaseType.ordered_col_ids_by_dim[dimId],
    id: dimId,
    label: CaseTypeUtil.getDimLabel(completeCaseType, dimId),
  }));
  dashboardStore.getState().setColumnDimensions(tableColumnDimensions);

  const dashboardContext = createDashboardContextValue(vi.fn(), caseSet);
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <TableStoreContextProvider store={dashboardStore}>
        <DashboardStoreContext value={dashboardStore}>
          <DashboardContext value={dashboardContext}>
            <div style={{ height: 600, width: 1200 }}>
              <LineListWidget />
            </div>
          </DashboardContext>
        </DashboardStoreContext>
      </TableStoreContextProvider>
    </UserProfileStoreContext>,
  );
  // Make all columns visible before initialization, as LineListWidget.test.tsx does, so the genetic distance columns are present.
  const allVisibleColumnVisualSettings = dashboardStore.getState().columns.map((column) => ({
    id: column.id,
    isVisible: true,
    label: column.headerName,
    widthFlex: column.widthFlex,
    widthPx: column.widthPx,
    widthPxFn: column.widthPxFn,
  }));
  dashboardStore.getState().setColumnVisualSettingsUncondensed(allVisibleColumnVisualSettings);
  await dashboardStore.getState().initialize(new AbortController().signal);
  return { dashboardStore, screen };
};

const getRow = (caseId: string) => {
  return document.querySelector<HTMLElement>(`[data-testid=virtuoso-item-list] [data-id="${caseId}"]`);
};

const waitForRows = async () => {
  await vi.waitFor(() => {
    expect(getRow('case-1')).not.toBeNull();
  }, { timeout: 10_000 });
};

const openActionsMenu = async (screen: Awaited<ReturnType<typeof renderPrimaryMenu>>['screen']) => {
  await screen.getByRole('button', { name: 'Actions' }).click();
};

describe('LineListWidgetPrimaryMenu', () => {
  beforeEach(async () => {
    clearDashboardStorage();
    container.resolve(FeatureFlagsService).featureFlags = {};
    container.resolve(AuthorizationService).apiPermissions = [];
    mockApiRequest('GET', '/v1/organizations', () => Response.json(ORGANIZATIONS));
    mockApiRequest('GET', '/v1/concept_sets', () => Response.json(LINE_LIST_CONCEPT_SETS));
    mockApiRequest('GET', '/v1/concepts', () => Response.json(LINE_LIST_CONCEPTS));
    mockApiRequest('POST', CASE_SET_MEMBERS_PATH, () => Response.json([{ case_id: 'case-1' }]));
    mockApiRequest('POST', IS_OWN_CASES_PATH, () => Response.json({ 'case-1': true, 'case-2': false }));

    const dataService = container.resolve(DataService);
    await dataService.loadOrganizations(new AbortController().signal);
    await dataService.loadConcepts(new AbortController().signal);
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(AuthorizationService).apiPermissions = [];
    container.resolve(FeatureFlagsService).featureFlags = {};
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows only the base actions and the bulk edit item without permissions or a case set', async () => {
    const { screen } = await renderPrimaryMenu();
    await waitForRows();
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create filter from selected cases', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Edit selected cases', exact: true })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Create new event with selected cases');
    expect(document.body.textContent).not.toContain('Add selected cases to an existing event');
    expect(document.body.textContent).not.toContain('Remove selected cases from this event');
  });

  it('shows the event items when the user has the permissions and a case set is present', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const { screen } = await renderPrimaryMenu({ caseSet: createCaseSet() });
    await waitForRows();
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create new event with selected cases', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Add selected cases to an existing event', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Remove selected cases from this event', exact: true })).toBeInTheDocument();
  });

  it('shows the create and add event items without a case set when the user lacks the delete permission', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS.slice(0, 2) as unknown as CaseDbApiPermission[];
    const { screen } = await renderPrimaryMenu();
    await waitForRows();
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create new event with selected cases', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Add selected cases to an existing event', exact: true })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Remove selected cases from this event');
  });

  it('disables the selection based items when no case is selected', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const { screen } = await renderPrimaryMenu({ caseSet: createCaseSet() });
    await waitForRows();
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create filter from selected cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases (based on selected cases)', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Create new event with selected cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Add selected cases to an existing event', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Remove selected cases from this event', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Edit selected cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Remove similar cases from results', exact: true })).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables the selection based items when cases are selected', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const { dashboardStore, screen } = await renderPrimaryMenu({ caseSet: createCaseSet() });
    await waitForRows();
    dashboardStore.getState().setSelectedIds(['case-1']);
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create filter from selected cases', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases (based on selected cases)', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Create new event with selected cases', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Add selected cases to an existing event', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Remove selected cases from this event', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Edit selected cases', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('creates a selection filter from the selected cases and clears the selection', async () => {
    const { dashboardStore, screen } = await renderPrimaryMenu();
    await waitForRows();
    dashboardStore.getState().setSelectedIds(['case-1']);
    await openActionsMenu(screen);
    await screen.getByRole('menuitem', { name: 'Create filter from selected cases', exact: true }).click();

    await vi.waitFor(() => {
      const selectionFilter = dashboardStore.getState().filters.find((filter) => filter instanceof SelectionFilter);
      expect(selectionFilter).toBeDefined();
      expect((selectionFilter as SelectionFilter).filterValue).toEqual(['case-1']);
    });
    await vi.waitFor(() => {
      expect(dashboardStore.getState().selectedIds).toEqual([]);
    });
  });

  it('disables the similar case actions and enables the removal of similar cases when similar cases exist', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const { dashboardStore, screen } = await renderPrimaryMenu({ caseSet: createCaseSet() });
    await waitForRows();
    dashboardStore.getState().setSelectedIds(['case-1']);
    const similarResults: FindSimilarCasesResult[] = [{
      colId: SEX_COL_ID,
      distance: 1,
      key: 'similar-1',
      originalCaseIds: ['case-1'],
      similarCaseIds: ['case-2'],
    }];
    await dashboardStore.getState().setFindSimilarCasesResults(similarResults);
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Create filter from selected cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Remove similar cases from results', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the find similar cases action when a selection filter is active', async () => {
    const { dashboardStore, screen } = await renderPrimaryMenu();
    await waitForRows();
    await dashboardStore.getState().setFilterValue('selected', ['case-1']);
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Find similar cases (based on selected cases)', exact: true })).toHaveAttribute('aria-disabled', 'true');
  });

  it('emits the find similar cases dialog event for all rows', async () => {
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openFindSimilarCasesDialog', listener);
    try {
      const { screen } = await renderPrimaryMenu();
      await waitForRows();
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Find similar cases', exact: true }).click();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        allRows: expect.arrayContaining([expect.objectContaining({ id: 'case-1' })]),
      }));
    } finally {
      eventBus.removeEventListener('openFindSimilarCasesDialog', listener);
    }
  });

  it('emits the find similar cases dialog event for the selected cases', async () => {
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openFindSimilarCasesDialog', listener);
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu();
      await waitForRows();
      dashboardStore.getState().setSelectedIds(['case-2']);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Find similar cases (based on selected cases)', exact: true }).click();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        selectedRows: [expect.objectContaining({ id: 'case-2' })],
      }));
    } finally {
      eventBus.removeEventListener('openFindSimilarCasesDialog', listener);
    }
  });

  it('emits the remove similar cases dialog event when similar case results exist', async () => {
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openRemoveFindSimilarCasesResultDialog', listener);
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu();
      await waitForRows();
      await dashboardStore.getState().setFindSimilarCasesResults([{
        colId: SEX_COL_ID,
        distance: 1,
        key: 'similar-1',
        originalCaseIds: ['case-1'],
        similarCaseIds: ['case-2'],
      }]);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Remove similar cases from results', exact: true }).click();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ completeCaseType: expect.any(Object) }));
    } finally {
      eventBus.removeEventListener('openRemoveFindSimilarCasesResultDialog', listener);
    }
  });

  it('emits the create event dialog event with the selected rows', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openCreateEventDialog', listener);
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu({ caseSet: createCaseSet() });
      await waitForRows();
      dashboardStore.getState().setSelectedIds(['case-1']);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Create new event with selected cases', exact: true }).click();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        rows: [expect.objectContaining({ id: 'case-1' })],
      }));
    } finally {
      eventBus.removeEventListener('openCreateEventDialog', listener);
    }
  });

  it('emits the add cases to event dialog event with the current case set', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openAddCasesToEventDialog', listener);
    const caseSet = createCaseSet();
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu({ caseSet });
      await waitForRows();
      dashboardStore.getState().setSelectedIds(['case-1']);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Add selected cases to an existing event', exact: true }).click();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        currentCaseSet: caseSet,
        rows: [expect.objectContaining({ id: 'case-1' })],
      }));
    } finally {
      eventBus.removeEventListener('openAddCasesToEventDialog', listener);
    }
  });

  it('emits the remove cases from event dialog event without the cases that are similar', async () => {
    container.resolve(AuthorizationService).apiPermissions = ALL_PERMISSIONS as unknown as CaseDbApiPermission[];
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openRemoveCasesFromEventDialog', listener);
    const caseSet = createCaseSet();
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu({ caseSet });
      await waitForRows();
      dashboardStore.getState().setSelectedIds(['case-1', 'case-2']);
      await dashboardStore.getState().setFindSimilarCasesResults([{
        colId: SEX_COL_ID,
        distance: 1,
        key: 'similar-1',
        originalCaseIds: ['case-1'],
        similarCaseIds: ['case-2'],
      }]);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Remove selected cases from this event', exact: true }).click();

      expect(listener).toHaveBeenCalledWith({
        caseSet,
        rows: [expect.objectContaining({ id: 'case-1' })],
      });
    } finally {
      eventBus.removeEventListener('openRemoveCasesFromEventDialog', listener);
    }
  });

  it('emits the edit cases event with the selected rows when uploads are enabled', async () => {
    const eventBus = container.resolve(EventBusService);
    const listener = vi.fn();
    eventBus.addEventListener('openEditCases', listener);
    try {
      const { dashboardStore, screen } = await renderPrimaryMenu();
      await waitForRows();
      dashboardStore.getState().setSelectedIds(['case-1']);
      await openActionsMenu(screen);
      await screen.getByRole('menuitem', { name: 'Edit selected cases', exact: true }).click();

      expect(listener).toHaveBeenCalledWith([expect.objectContaining({ id: 'case-1' })]);
    } finally {
      eventBus.removeEventListener('openEditCases', listener);
    }
  });

  it('disables the edit cases action when uploads are disabled by a feature flag', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { disable_upload: true };
    const { dashboardStore, screen } = await renderPrimaryMenu();
    await waitForRows();
    dashboardStore.getState().setSelectedIds(['case-1']);
    await openActionsMenu(screen);

    await expect.element(screen.getByRole('menuitem', { name: 'Edit selected cases', exact: true })).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses the value getter of a column to determine which columns have data in the column editor', async () => {
    const { screen } = await renderPrimaryMenu();
    await waitForRows();

    await screen.getByRole('button', { name: 'Columns' }).click();
    await screen.getByRole('menuitem', { name: 'Column editor' }).click();
    await screen.getByRole('button', { name: 'Show all with data' }).click();

    await expect.element(screen.getByText('Change column order and visibility')).toBeInTheDocument();
  });
});
