import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import type { TableColumnDimension } from '@gen-epix/ui-client-common/models/table.models';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { FeatureFlagsService } from '@gen-epix/ui-client-common/classes/services/FeatureFlagsService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataService } from '../../../classes/services/DataService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../models/case-db.models';
import type { StratificationLegendaItem } from '../../../models/stratification.models';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../../models/stratification.models';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { COMPLETE_CASE_TYPE_TEXT_COL_ID } from '../../../test/fixtures/completeCaseType';
import {
  createLineListCompleteCaseType,
  LINE_LIST_CONCEPT_SETS,
  LINE_LIST_CONCEPTS,
  SEQUENCE_COL_ID,
  SEX_COL_ID,
} from '../../../test/fixtures/lineListCompleteCaseType';
import { renderComponent } from '../../../test/lib';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';

import type { LegendaItemProps } from './LegendaItem';
import { LegendaItem } from './LegendaItem';

type DashboardStoreInstance = ReturnType<typeof createDashboardStore>;

const STORAGE_NAME_POST_FIX = 'LegendaItem';
const CASE_SET_ID = 'case-set-1';
const CASE_SET_MEMBERS_PATH = '/v1/case_set_members/query';
const IS_OWN_CASES_PATH = '/v1/retrieve/is_own_cases';
const SEQUENCE_ONE = 'SEQ-ONE';
const SEQUENCE_TWO = 'SEQ-TWO';
const TEXT_ONE = 'text-a';
const TEXT_TWO = 'text-b';

const CASES: CaseDbCase[] = [
  createDashboardCase({
    content: {
      [COMPLETE_CASE_TYPE_TEXT_COL_ID]: TEXT_ONE,
      [SEQUENCE_COL_ID]: SEQUENCE_ONE,
      [SEX_COL_ID]: 'concept-male',
    },
    id: 'case-1',
  }),
  createDashboardCase({
    content: {
      [COMPLETE_CASE_TYPE_TEXT_COL_ID]: TEXT_TWO,
      [SEQUENCE_COL_ID]: SEQUENCE_TWO,
      [SEX_COL_ID]: 'concept-female',
    },
    id: 'case-2',
  }),
  createDashboardCase({ content: {}, id: 'case-3' }),
];

const createDashboardContextValue = (highlight: DashboardContextValue['highlight']): DashboardContextValue => ({
  caseSet: undefined,
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

const createLegendaItem = (overrides: Partial<StratificationLegendaItem> = {}): StratificationLegendaItem => ({
  caseIds: [],
  color: '#123456',
  rowValue: {
    full: 'Full label',
    isMissing: false,
    raw: 'raw-value',
    short: 'Short label',
  },
  ...overrides,
} as StratificationLegendaItem);

let activeDashboardStore: DashboardStoreInstance | undefined;

const setupDashboardStore = async () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const completeCaseType = createLineListCompleteCaseType();
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
  await dashboardStore.getState().initialize(new AbortController().signal);
  return { completeCaseType, dashboardStore };
};

const renderLegendaItem = async (dashboardStore: DashboardStoreInstance, props: LegendaItemProps) => {
  const dashboardContext = createDashboardContextValue(vi.fn());
  const screen = await renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <DashboardContext value={dashboardContext}>
        <LegendaItem {...props} />
      </DashboardContext>
    </DashboardStoreContext>,
  );
  return { dashboardContext, screen };
};

const getStratifiedLegendaItem = (dashboardStore: DashboardStoreInstance, predicate: (item: StratificationLegendaItem) => boolean) => {
  const item = dashboardStore.getState().stratification.legendaItems.find(predicate);
  if (!item) {
    throw new Error('Expected legenda item to exist');
  }
  return item;
};

const getFilterValue = (dashboardStore: DashboardStoreInstance, filterId: string) => {
  return dashboardStore.getState().filters.find((filter) => filter.id === filterId)?.filterValue;
};

const getMenuItemLabels = () => {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).map((element) => element.textContent);
};

const waitForContextMenu = async () => {
  await vi.waitFor(() => {
    expect(getMenuItemLabels().length).toBeGreaterThan(0);
  }, { timeout: 10_000 });
};

const getFilterMenuItemLabels = () => {
  return getMenuItemLabels().filter((label) => label?.startsWith('Filter (show only'));
};

const dispatchMouseOut = (element: HTMLElement) => {
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: null }));
};

describe('LegendaItem', () => {
  beforeEach(async () => {
    clearDashboardStorage();
    container.resolve(FeatureFlagsService).featureFlags = {};
    mockApiRequest('GET', '/v1/organizations', () => Response.json([]));
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
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('renders the short label of a field legenda item', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const maleItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === 'concept-male');

    const { screen } = await renderLegendaItem(dashboardStore, { item: maleItem });

    await expect.element(screen.getByText(maleItem.rowValue.short, { exact: true })).toBeInTheDocument();
  });

  it('renders the given children instead of the label', async () => {
    const { dashboardStore } = await setupDashboardStore();
    const item = createLegendaItem({ caseIds: ['case-1'] });

    const { screen } = await renderLegendaItem(dashboardStore, { children: 'Custom content', item });

    await expect.element(screen.getByText('Custom content', { exact: true })).toBeInTheDocument();
  });

  it('renders the missing data character for a missing value', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const missingItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.isMissing);
    const missingCharacter = DependencyContainerUtil.resolveConfig<CaseDbConfig>().epi.DATA_MISSING_CHARACTER;

    const { screen } = await renderLegendaItem(dashboardStore, { item: missingItem });

    await expect.element(screen.getByText(missingCharacter, { exact: true })).toBeInTheDocument();
  });

  it('shows the full label in a tooltip when tooltips are enabled', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const item = createLegendaItem({ caseIds: ['case-1'] });

    const { screen } = await renderLegendaItem(dashboardStore, { item, tooltip: true, tooltipProps: { enterDelay: 0 } });
    await userEvent.hover(screen.getByText('Short label', { exact: true }));

    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Full label');
  });

  it('highlights the cases of the legenda item on mouse over', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const maleItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === 'concept-male');

    const { dashboardContext, screen } = await renderLegendaItem(dashboardStore, { item: maleItem });
    await userEvent.hover(screen.getByText(maleItem.rowValue.short, { exact: true }));

    expect(dashboardContext.highlight).toHaveBeenCalledWith({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.LEGENDA });
  });

  it('clears the highlight when the mouse leaves the legenda item', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const maleItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === 'concept-male');

    const { dashboardContext, screen } = await renderLegendaItem(dashboardStore, { item: maleItem });
    const label = screen.getByText(maleItem.rowValue.short, { exact: true }).element() as HTMLElement;
    dispatchMouseOut(label);

    expect(dashboardContext.highlight).toHaveBeenLastCalledWith({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.LEGENDA });
  });

  it('filters the selected rows when showing only the selected legenda item', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().setSelectedIds(['case-1']);
    const selectedItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === STRATIFICATION_SELECTED.SELECTED.toString());

    const { screen } = await renderLegendaItem(dashboardStore, { item: selectedItem });
    await screen.getByText(selectedItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();
    await screen.getByRole('menuitem', { name: 'Filter (show only selected rows)' }).click();

    await vi.waitFor(() => {
      expect(getFilterValue(dashboardStore, 'selected')).toEqual(['case-1']);
    }, { timeout: 10_000 });
  });

  it('filters the unselected rows when showing only the unselected legenda item', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().setSelectedIds(['case-1']);
    const unselectedItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw !== STRATIFICATION_SELECTED.SELECTED.toString());

    const { screen } = await renderLegendaItem(dashboardStore, { item: unselectedItem });
    await screen.getByText(unselectedItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();
    await screen.getByRole('menuitem', { name: 'Filter (show only unselected rows)' }).click();

    await vi.waitFor(() => {
      expect(getFilterValue(dashboardStore, 'selected')).toEqual(['case-2', 'case-3']);
    }, { timeout: 10_000 });
  });

  it('offers no filter action for the selected legenda item when all rows are selected', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().setSelectedIds(['case-1', 'case-2', 'case-3']);
    const selectedItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === STRATIFICATION_SELECTED.SELECTED.toString());

    const { screen } = await renderLegendaItem(dashboardStore, { item: selectedItem });
    await screen.getByText(selectedItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();

    expect(getFilterMenuItemLabels()).toEqual([]);
  });

  it('offers no filter action for the unselected legenda item when it has no rows', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().setSelectedIds(['case-1', 'case-2', 'case-3']);
    const unselectedItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw !== STRATIFICATION_SELECTED.SELECTED.toString());

    const { screen } = await renderLegendaItem(dashboardStore, { item: unselectedItem });
    await screen.getByText(unselectedItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();

    expect(getFilterMenuItemLabels()).toEqual([]);
  });

  it('filters a field value with a multi-select filter using an array value', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const maleItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === 'concept-male');

    const { screen } = await renderLegendaItem(dashboardStore, { item: maleItem });
    await screen.getByText(maleItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();
    await screen.getByRole('menuitem', { name: `Filter (show only ${maleItem.rowValue.short})` }).click();

    await vi.waitFor(() => {
      expect(getFilterValue(dashboardStore, SEX_COL_ID)).toEqual([maleItem.rowValue.raw]);
    }, { timeout: 10_000 });
  });

  it('filters a field value with a text filter using the raw value', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[COMPLETE_CASE_TYPE_TEXT_COL_ID]);
    const textItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === TEXT_ONE);

    const { screen } = await renderLegendaItem(dashboardStore, { item: textItem });
    await screen.getByText(textItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();
    await screen.getByRole('menuitem', { name: `Filter (show only ${textItem.rowValue.short})` }).click();

    await vi.waitFor(() => {
      expect(getFilterValue(dashboardStore, COMPLETE_CASE_TYPE_TEXT_COL_ID)).toEqual(TEXT_ONE);
    }, { timeout: 10_000 });
  });

  it('offers no filter action for a missing field value', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const missingItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.isMissing);
    const missingCharacter = DependencyContainerUtil.resolveConfig<CaseDbConfig>().epi.DATA_MISSING_CHARACTER;

    const { screen } = await renderLegendaItem(dashboardStore, { item: missingItem });
    await screen.getByText(missingCharacter, { exact: true }).click();
    await waitForContextMenu();

    expect(getFilterMenuItemLabels()).toEqual([]);
  });

  it('offers no filter action for a field without a filter', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEQUENCE_COL_ID]);
    const sequenceItem = getStratifiedLegendaItem(dashboardStore, (item) => item.rowValue.raw === SEQUENCE_ONE);

    const { screen } = await renderLegendaItem(dashboardStore, { item: sequenceItem });
    await screen.getByText(sequenceItem.rowValue.short, { exact: true }).click();
    await waitForContextMenu();

    expect(getFilterMenuItemLabels()).toEqual([]);
  });

  it('is dimmed and does not open the context menu when a field legenda item has no cases', async () => {
    const { dashboardStore } = await setupDashboardStore();
    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, dashboardStore.getState().completeCaseType.cols[SEX_COL_ID]);
    const emptyItem = createLegendaItem({ caseIds: [] });

    const { screen } = await renderLegendaItem(dashboardStore, { item: emptyItem });
    const label = screen.getByText('Short label', { exact: true }).element() as HTMLElement;
    await screen.getByText('Short label', { exact: true }).click();

    expect(getComputedStyle(label.parentElement).opacity).toBe('0.3');
    expect(getMenuItemLabels()).toEqual([]);
  });

  it('opens the context menu without a filter action when there is no stratification', async () => {
    const { dashboardStore } = await setupDashboardStore();
    const item = createLegendaItem({ caseIds: ['case-1'] });

    const { screen } = await renderLegendaItem(dashboardStore, { item });
    // A native click avoids the implicit hover of the pointer, which needs a stratification to highlight cases.
    (screen.getByText('Short label', { exact: true }).element() as HTMLElement).click();
    await waitForContextMenu();

    await expect.element(screen.getByRole('menuitem', { name: 'Select rows' })).toBeInTheDocument();
    expect(getFilterMenuItemLabels()).toEqual([]);
  });
});
