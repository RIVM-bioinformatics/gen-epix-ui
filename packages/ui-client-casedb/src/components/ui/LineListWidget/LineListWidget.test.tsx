import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { createTheme } from '@mui/material';
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
  CaseDbOrganization,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import type { TableColumnDimension } from '@gen-epix/ui-client-common/models/table.models';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { FeatureFlagsService } from '@gen-epix/ui-client-common/classes/services/FeatureFlagsService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataService } from '../../../classes/services/DataService';
import { EventBusService } from '../../../classes/services/EventBusService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import { CASE_INFO_DIALOG_TAB_NAME } from '../../../models/case-db.models';
import type { CaseDbConfig } from '../../../models/config.models';
import type {
  FindSimilarCasesResult,
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../models/case-db.models';
import { STRATIFICATION_MODE } from '../../../models/stratification.models';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { COMPLETE_CASE_TYPE_ID } from '../../../test/fixtures/completeCaseType';
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

const STORAGE_NAME_POST_FIX = 'LineListWidget';
const ORGANIZATION_ONE_ID = 'org-1';
const ORGANIZATION_TWO_ID = 'org-2';
const ORGANIZATION_ONE_NAME = 'Organization One';
const ORGANIZATION_TWO_NAME = 'Organization Two';
const SEQUENCE_ONE = 'SEQ-ONE';
const DISTANCE_ALGORITHM_CODE = 'ALG';
const CASE_SET_ID = 'case-set-1';

const CASE_SET_MEMBERS_PATH = '/v1/case_set_members/query';
const IS_OWN_CASES_PATH = '/v1/retrieve/is_own_cases';
const ORGANIZATIONS: CaseDbOrganization[] = [
  { code: 'ORG1', id: ORGANIZATION_ONE_ID, name: ORGANIZATION_ONE_NAME },
  { code: 'ORG2', id: ORGANIZATION_TWO_ID, name: ORGANIZATION_TWO_NAME },
];

const CASES: CaseDbCase[] = [
  createDashboardCase({
    content: {
      [DECIMAL_COL_ID]: '1.5',
      [DISTANCE_COL_ID]: 'distance-1',
      [ORGANIZATION_COL_ID]: ORGANIZATION_ONE_ID,
      [SEQUENCE_COL_ID]: SEQUENCE_ONE,
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

const createDashboardContextValue = (highlight: DashboardContextValue['highlight'], caseSet: DashboardContextValue['caseSet']): DashboardContextValue => ({
  caseSet,
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

type RenderLineListWidgetOptions = {
  cases?: CaseDbCase[];
  caseSet?: DashboardContextValue['caseSet'];
  completeCaseType?: CaseDbCompleteCaseType;
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderLineListWidget = async ({
  cases = CASES,
  caseSet = undefined,
  completeCaseType = createLineListCompleteCaseType(),
}: RenderLineListWidgetOptions = {}) => {
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
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: cases.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(cases));
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
  // The widget sets its columns in an effect before the store is initialized, matching the production loader, where child effects run before the loader's initialize effect.
  // A dim containing a genetic distance column only shows its preferred column initially and genetic sequence columns are hidden, so make all columns visible before the table reads its visual settings during initialization.
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
  return { dashboardContext, dashboardStore, screen };
};

const getRow = (caseId: string) => {
  return document.querySelector<HTMLElement>(`[data-testid=virtuoso-item-list] [data-id="${caseId}"]`);
};

const dispatchMouseOut = (element: HTMLElement) => {
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: null }));
};

const getRowIdsInOrder = () => {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-testid=virtuoso-item-list] [data-id^="case-"]')).map((row) => row.dataset.id);
};

const waitForRows = async () => {
  await vi.waitFor(() => {
    expect(getRow('case-1')).not.toBeNull();
  }, { timeout: 10_000 });
};

describe('LineListWidget', () => {
  beforeEach(async () => {
    clearDashboardStorage();
    container.resolve(FeatureFlagsService).featureFlags = {};
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
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('renders a row per case with its organization, sequence, sex and decimal values', async () => {
    const { screen } = await renderLineListWidget();
    await waitForRows();

    await expect.element(screen.getByText(ORGANIZATION_ONE_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText(ORGANIZATION_TWO_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText(SEQUENCE_ONE)).toBeInTheDocument();
    await expect.element(screen.getByText('1.5', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('MALE', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('FEMALE', { exact: true })).toBeInTheDocument();
  });

  it('shows the readable index of a case and opens its information on click', async () => {
    const { dashboardContext, screen } = await renderLineListWidget();
    await waitForRows();
    const listener = vi.fn();
    container.resolve(EventBusService).addEventListener('openCaseInfoDialog', listener);

    await screen.getByRole('button', { name: 'Show case information for 1' }).click();

    expect(listener).toHaveBeenCalledWith({
      caseId: 'case-1',
      caseTypeId: COMPLETE_CASE_TYPE_ID,
      initialTab: CASE_INFO_DIALOG_TAB_NAME.INFO,
    });
    expect(dashboardContext.reset).not.toHaveBeenCalled();
  });

  it('opens the case information, edit, sharing and add-to-event actions from the row actions menu', async () => {
    const { screen } = await renderLineListWidget();
    await waitForRows();
    const infoListener = vi.fn();
    const addToEventListener = vi.fn();
    container.resolve(EventBusService).addEventListener('openCaseInfoDialog', infoListener);
    container.resolve(EventBusService).addEventListener('openAddCasesToEventDialog', addToEventListener);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Show information' }).click();
    expect(infoListener).toHaveBeenLastCalledWith(expect.objectContaining({ caseId: 'case-1', initialTab: CASE_INFO_DIALOG_TAB_NAME.INFO }));

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Share' }).click();
    expect(infoListener).toHaveBeenLastCalledWith(expect.objectContaining({ caseId: 'case-1', initialTab: CASE_INFO_DIALOG_TAB_NAME.SHARING }));

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit information' }).click();
    expect(infoListener).toHaveBeenLastCalledWith(expect.objectContaining({ caseId: 'case-1', initialTab: CASE_INFO_DIALOG_TAB_NAME.EDIT }));

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Add to event' }).click();
    expect(addToEventListener).toHaveBeenCalledWith(expect.objectContaining({ currentCaseSet: undefined }));
  });

  it('disables the edit action when uploads are disabled by the feature flags', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { disable_upload: true };
    const { screen } = await renderLineListWidget();
    await waitForRows();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();

    await expect.element(screen.getByRole('menuitem', { name: 'Edit information' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens the contact details of an organization when its link is clicked', async () => {
    const { screen } = await renderLineListWidget();
    await waitForRows();
    const listener = vi.fn();
    container.resolve(EventBusService).addEventListener('openContactDetailsDialog', listener);

    await screen.getByRole('button', { name: ORGANIZATION_ONE_NAME }).click();

    expect(listener).toHaveBeenCalledWith({ organizationId: ORGANIZATION_ONE_ID, organizationName: ORGANIZATION_ONE_NAME });
  });

  it('opens the sequence download dialog when a genetic sequence link is clicked', async () => {
    const { screen } = await renderLineListWidget();
    await waitForRows();
    const listener = vi.fn();
    container.resolve(EventBusService).addEventListener('openSequenceDownloadDialog', listener);

    await screen.getByRole('button', { name: SEQUENCE_ONE }).click();

    expect(listener).toHaveBeenCalledWith({
      cases: [expect.objectContaining({ id: 'case-1' })],
      geneticSequenceColId: SEQUENCE_COL_ID,
    });
  });

  it('highlights the hovered case and clears the highlight when the mouse leaves the row', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();

    await userEvent.hover(getRow('case-1'));
    await vi.waitFor(() => {
      expect(dashboardContext.highlight).toHaveBeenCalledWith(expect.objectContaining({ caseIds: ['case-1'] }));
    });

    await userEvent.hover(document.body);
    await vi.waitFor(() => {
      expect(dashboardContext.highlight).toHaveBeenCalledWith(expect.objectContaining({ caseIds: [] }));
    });
  });

  it('publishes the visible line list range', async () => {
    const { dashboardContext } = await renderLineListWidget();
    const rangeListener = vi.fn<(value: LineListRangeSubjectValue) => void>();
    dashboardContext.lineListRangeSubject.subscribe(rangeListener);

    await vi.waitFor(() => {
      expect(rangeListener).toHaveBeenCalled();
    });
    const publishedRange = rangeListener.mock.calls[0]?.[0];
    expect(publishedRange?.startIndex).toBe(0);
    expect(publishedRange?.endIndex).toEqual(expect.any(Number));
  });

  it('scrolls to and highlights a case that another widget highlights', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();

    dashboardContext.highlightSubject.next({ caseIds: ['case-2'], origin: 'OTHER', scrollIntoView: true });
    dashboardContext.highlightSubject.next({ caseIds: ['case-3'], origin: 'OTHER' });

    await vi.waitFor(() => {
      expect(getRow('case-3')).not.toBeNull();
    });
  });

  it('ignores highlights that originate from the line list itself', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();

    dashboardContext.highlightSubject.next({ caseIds: ['case-2'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    expect(dashboardContext.highlight).not.toHaveBeenCalledWith(expect.objectContaining({ caseIds: ['case-2'] }));
  });

  it('ignores a scroll-into-view highlight of a case that is not in the line list', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();
    const rowIdsBefore = getRowIdsInOrder();

    dashboardContext.highlightSubject.next({ caseIds: ['case-missing'], origin: 'OTHER', scrollIntoView: true });

    expect(getRowIdsInOrder()).toEqual(rowIdsBefore);
    expect(dashboardContext.highlight).not.toHaveBeenCalledWith(expect.objectContaining({ caseIds: ['case-missing'] }));
  });

  it('renders when the theme does not override the line list settings', async () => {
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const originalTheme = config.theme;
    config.theme = createTheme({ ...originalTheme, components: {} });
    try {
      await renderLineListWidget();
      await waitForRows();
      expect(getRow('case-1')).not.toBeNull();
    } finally {
      config.theme = originalTheme;
    }
  });

  it('publishes the vertical scroll position of the table', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();
    const linkedScrollListener = vi.fn();
    dashboardContext.linkedScrollSubject.subscribe(linkedScrollListener);
    const scroller = document.querySelector<HTMLElement>('[data-virtuoso-scroller=true]');

    scroller.dispatchEvent(new Event('scroll'));

    await vi.waitFor(() => {
      expect(linkedScrollListener).toHaveBeenCalled();
    });
  });

  it('shows the similar case icon only for cases that are similar to a found case', async () => {
    const { dashboardStore, screen } = await renderLineListWidget();
    await waitForRows();
    const similarResults: FindSimilarCasesResult[] = [{
      colId: SEX_COL_ID,
      distance: 1,
      key: 'similar-1',
      originalCaseIds: ['case-1'],
      similarCaseIds: ['case-2'],
    }];

    await dashboardStore.getState().setFindSimilarCasesResults(similarResults);

    await vi.waitFor(() => {
      expect(getRow('case-2')?.querySelector('[data-testid="TroubleshootIcon"]')).not.toBeNull();
    });
    expect(getRow('case-1')?.querySelector('[data-testid="TroubleshootIcon"]')).toBeNull();
    await expect.element(screen.getByRole('columnheader', { name: /similar/i }).first()).toBeInTheDocument();
  });

  it('shows the own case and in-event icons of the rows', async () => {
    await renderLineListWidget();
    await waitForRows();

    await vi.waitFor(() => {
      expect(getRow('case-1')?.querySelector('[data-id="isOwnCase"] [data-testid="CorporateFareIcon"]')).not.toBeNull();
    }, { timeout: 5000 });
    expect(getRow('case-2')?.querySelector('[data-id="isOwnCase"] [data-testid="CorporateFareIcon"]')).toBeNull();
    await vi.waitFor(() => {
      expect(getRow('case-1')?.querySelector('[data-id="isInEvent"] svg')).not.toBeNull();
    }, { timeout: 5000 });
    expect(getRow('case-2')?.querySelector('[data-id="isInEvent"] svg')).toBeNull();
  });

  it('shows the genetic distance algorithm code and address of each case', async () => {
    const { dashboardStore, screen } = await renderLineListWidget();
    await waitForRows();

    dashboardStore.setState({
      treeAddresses: {
        [DISTANCE_COL_ID]: {
          addresses: { 'case-1': 'ADDR-1' },
          algorithmCode: DISTANCE_ALGORITHM_CODE,
        },
      },
    });

    await expect.element(screen.getByText(`${DISTANCE_ALGORITHM_CODE} ADDR-1`)).toBeInTheDocument();
  });

  it('shows the legend of the stratification on the stratified column', async () => {
    const { dashboardStore } = await renderLineListWidget();
    await waitForRows();
    const sexCol = dashboardStore.getState().completeCaseType.cols[SEX_COL_ID];

    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, sexCol);

    await vi.waitFor(() => {
      expect(getRow('case-1')?.querySelector(`[data-id="${SEX_COL_ID}"]`)?.textContent).toContain('MALE');
    });
  });

  it('shows the legend of the stratification on an organization column', async () => {
    const { dashboardStore } = await renderLineListWidget();
    await waitForRows();
    const organizationCol = dashboardStore.getState().completeCaseType.cols[ORGANIZATION_COL_ID];

    dashboardStore.getState().stratify(STRATIFICATION_MODE.FIELD, organizationCol);

    await vi.waitFor(() => {
      expect(getRow('case-1')?.querySelector(`[data-id="${ORGANIZATION_COL_ID}"] [data-color]`)).not.toBeNull();
    });
  });

  it('stores the index of the top visible item after the table is scrolled', async () => {
    const manyCases = Array.from({ length: 100 }, (_, index) => ({ ...CASES[0], id: `case-bulk-${index}` }));
    const { dashboardStore } = await renderLineListWidget({ cases: manyCases });
    await vi.waitFor(() => {
      expect(getRow('case-bulk-0')).not.toBeNull();
    }, { timeout: 10_000 });
    const scroller = document.querySelector<HTMLElement>('[data-virtuoso-scroller=true]');

    scroller.scrollTop = 1000;
    scroller.dispatchEvent(new Event('scroll'));

    await vi.waitFor(() => {
      const visibleItemItemIndex = dashboardStore.getState().widgetData[DASHBOARD_COMPONENT_NAME.LINE_LIST]?.visibleItemItemIndex;
      expect(visibleItemItemIndex).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('colors the cells when the line list is condensed', async () => {
    const { dashboardStore } = await renderLineListWidget();
    await waitForRows();

    dashboardStore.getState().setIsCondensed(true);

    await vi.waitFor(() => {
      expect(getRow('case-1')).not.toBeNull();
    });
  });

  it('replaces a pending highlight clear when the mouse leaves another row', async () => {
    const { dashboardContext } = await renderLineListWidget();
    await waitForRows();

    dispatchMouseOut(getRow('case-1'));
    dispatchMouseOut(getRow('case-2'));

    await vi.waitFor(() => {
      expect(dashboardContext.highlight).toHaveBeenCalledWith(expect.objectContaining({ caseIds: [] }));
    });
  });

  it('cancels a pending highlight clear when unmounted', async () => {
    const { dashboardContext, screen } = await renderLineListWidget();
    await waitForRows();
    const highlightCallCountBeforeLeave = vi.mocked(dashboardContext.highlight).mock.calls.length;

    dispatchMouseOut(getRow('case-1'));
    await screen.unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(dashboardContext.highlight).toHaveBeenCalledTimes(highlightCallCountBeforeLeave);
  });

  it('sorts the genetic distance column by the address of the cases', async () => {
    const { dashboardStore } = await renderLineListWidget();
    await waitForRows();
    dashboardStore.setState({
      treeAddresses: {
        [DISTANCE_COL_ID]: {
          addresses: { 'case-1': 'ADDR-2', 'case-2': 'ADDR-1' },
          algorithmCode: DISTANCE_ALGORITHM_CODE,
        },
      },
    });

    await dashboardStore.getState().setSorting(DISTANCE_COL_ID, 'asc');
    await vi.waitFor(() => {
      expect(getRowIdsInOrder().indexOf('case-2')).toBeLessThan(getRowIdsInOrder().indexOf('case-1'));
    });

    await dashboardStore.getState().setSorting(DISTANCE_COL_ID, 'desc');
    await vi.waitFor(() => {
      expect(getRowIdsInOrder().indexOf('case-1')).toBeLessThan(getRowIdsInOrder().indexOf('case-2'));
    });
  });

  it('applies scroll positions of another widget that arrive within one animation frame', async () => {
    const { dashboardContext, screen } = await renderLineListWidget();
    await waitForRows();

    const otherOrigin = document.createElement('div');
    dashboardContext.linkedScrollSubject.next({ origin: otherOrigin, position: 100 });
    dashboardContext.linkedScrollSubject.next({ origin: otherOrigin, position: 200 });

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
    await expect.element(screen.getByText(SEQUENCE_ONE)).toBeInTheDocument();
  });

  it('cancels a pending scroll position application when unmounted', async () => {
    const { dashboardContext, screen } = await renderLineListWidget();
    await waitForRows();

    dashboardContext.linkedScrollSubject.next({ origin: document.createElement('div'), position: 100 });
    await screen.unmount();

    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
    expect(document.querySelector('[data-testid=virtuoso-item-list]')).toBeNull();
  });

  it('lists the columns of the table in the column editor', async () => {
    const { screen } = await renderLineListWidget();
    await waitForRows();

    await screen.getByRole('button', { name: 'Columns' }).click();
    await screen.getByRole('menuitem', { name: 'Column editor' }).click();

    await expect.element(screen.getByText('Change column order and visibility')).toBeInTheDocument();
    await expect.element(screen.getByText('Column type', { exact: true })).toBeInTheDocument();
  });
});
