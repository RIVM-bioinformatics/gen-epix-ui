import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { getInstanceByDom } from 'echarts/core';
import {
  CaseDbColType,
  CaseDbConceptSetType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataService } from '../../../classes/services/DataService';
import { EventBusService } from '../../../classes/services/EventBusService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../models/case-db.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { createUserProfileStore } from '../../../stores/userProfileStore/userProfileStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';

import { HistogramWidget } from './HistogramWidget';

const STORAGE_NAME_POST_FIX = 'HistogramWidget';
const HISTOGRAM_CHART_SELECTOR = '[role="img"][aria-label^="Histogram"]';
const HISTOGRAM_CHART_LABEL = 'Histogram showing the number of cases for Status and Age';

const DIM_FIRST_ID = 'dim-first';
const DIM_SECOND_ID = 'dim-second';
const DIM_OTHER_ID = 'dim-other';
const REF_DIM_FIRST_ID = 'ref-dim-first';
const REF_DIM_SECOND_ID = 'ref-dim-second';
const SEX_COL_ID = 'col-sex';
const AGE_COL_ID = 'col-age';
const STATUS_COL_ID = 'col-status';
const REF_COL_SEX_ID = 'ref-col-sex';
const REF_COL_AGE_ID = 'ref-col-age';
const REF_COL_STATUS_ID = 'ref-col-status';
const CONCEPT_SET_SEX_ID = 'concept-set-sex';
const CONCEPT_SET_AGE_ID = 'concept-set-age';
const CONCEPT_SET_STATUS_ID = 'concept-set-status';
const COL_IDS = [SEX_COL_ID, AGE_COL_ID, STATUS_COL_ID];

const CONCEPT_SETS: CaseDbConceptSet[] = [
  { code: CONCEPT_SET_SEX_ID, id: CONCEPT_SET_SEX_ID, name: 'Sex set', type: CaseDbConceptSetType.NOMINAL },
  { code: CONCEPT_SET_AGE_ID, id: CONCEPT_SET_AGE_ID, name: 'Age set', type: CaseDbConceptSetType.NOMINAL },
  { code: CONCEPT_SET_STATUS_ID, id: CONCEPT_SET_STATUS_ID, name: 'Status set', type: CaseDbConceptSetType.NOMINAL },
];
const CONCEPTS: CaseDbConcept[] = [
  { code: 'MALE', concept_set_id: CONCEPT_SET_SEX_ID, id: 'concept-male', name: 'Male' },
  { code: 'FEMALE', concept_set_id: CONCEPT_SET_SEX_ID, id: 'concept-female', name: 'Female' },
  { code: 'YOUNG', concept_set_id: CONCEPT_SET_AGE_ID, id: 'concept-young', name: 'Young' },
  { code: 'OLD', concept_set_id: CONCEPT_SET_AGE_ID, id: 'concept-old', name: 'Old' },
  { code: 'ACTIVE', concept_set_id: CONCEPT_SET_STATUS_ID, id: 'concept-active', name: 'Active' },
  { code: 'INACTIVE', concept_set_id: CONCEPT_SET_STATUS_ID, id: 'concept-inactive', name: 'Inactive' },
];

// Case 5 has no age, so it is counted as a line list case but not as a histogram case.
const CASES: CaseDbCase[] = [
  createDashboardCase({ content: { [AGE_COL_ID]: 'concept-young', [SEX_COL_ID]: 'concept-male', [STATUS_COL_ID]: 'concept-active' }, id: 'case-1' }),
  createDashboardCase({ content: { [AGE_COL_ID]: 'concept-young', [SEX_COL_ID]: 'concept-female', [STATUS_COL_ID]: 'concept-inactive' }, id: 'case-2' }),
  createDashboardCase({ content: { [AGE_COL_ID]: 'concept-old', [SEX_COL_ID]: 'concept-male', [STATUS_COL_ID]: 'concept-active' }, id: 'case-3' }),
  createDashboardCase({ content: { [AGE_COL_ID]: 'concept-old', [SEX_COL_ID]: 'concept-female', [STATUS_COL_ID]: 'concept-inactive' }, id: 'case-4' }),
  createDashboardCase({ content: { [AGE_COL_ID]: null, [SEX_COL_ID]: 'concept-male', [STATUS_COL_ID]: 'concept-active' }, id: 'case-5' }),
];

type CreateHistogramCompleteCaseTypeOptions = {
  // When false, the age and status columns get a column type that the histogram does not support.
  areAgeAndStatusAllowed?: boolean;
};

const createHistogramCompleteCaseType = ({ areAgeAndStatusAllowed = true }: CreateHistogramCompleteCaseTypeOptions = {}): CaseDbCompleteCaseType => {
  const baseCompleteCaseType = createCompleteCaseType();
  const textCol = baseCompleteCaseType.cols[COMPLETE_CASE_TYPE_TEXT_COL_ID];
  const textRefCol = baseCompleteCaseType.ref_cols['ref-col-text'];
  const baseAccess = baseCompleteCaseType.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  const nonSupportedColType = CaseDbColType.TEXT;
  const ageAndStatusColType = areAgeAndStatusAllowed ? CaseDbColType.NOMINAL : nonSupportedColType;

  const dims: Record<string, CaseDbDim> = {
    ...baseCompleteCaseType.dims,
    [DIM_FIRST_ID]: { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'first', id: DIM_FIRST_ID, label: 'First', rank: 2, ref_dim_id: REF_DIM_FIRST_ID },
    [DIM_SECOND_ID]: { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'second', id: DIM_SECOND_ID, label: 'Second', rank: 3, ref_dim_id: REF_DIM_SECOND_ID },
  };
  const refDims: Record<string, CaseDbRefDim> = {
    ...baseCompleteCaseType.ref_dims,
    [REF_DIM_FIRST_ID]: { code: 'first', dim_type: CaseDbDimType.OTHER, id: REF_DIM_FIRST_ID, label: 'First' },
    [REF_DIM_SECOND_ID]: { code: 'second', dim_type: CaseDbDimType.OTHER, id: REF_DIM_SECOND_ID, label: 'Second' },
  };
  const cols: Record<string, CaseDbCol> = {
    [AGE_COL_ID]: { ...textCol, code: 'age', dim_id: DIM_FIRST_ID, id: AGE_COL_ID, label: 'Age', rank: 2, ref_col_id: REF_COL_AGE_ID },
    [COMPLETE_CASE_TYPE_TEXT_COL_ID]: textCol,
    [SEX_COL_ID]: { ...textCol, code: 'sex', dim_id: DIM_FIRST_ID, id: SEX_COL_ID, label: 'Sex', rank: 1, ref_col_id: REF_COL_SEX_ID },
    [STATUS_COL_ID]: { ...textCol, code: 'status', dim_id: DIM_SECOND_ID, id: STATUS_COL_ID, label: 'Status', rank: 1, ref_col_id: REF_COL_STATUS_ID },
  };
  const refCols: Record<string, CaseDbRefCol> = {
    ...baseCompleteCaseType.ref_cols,
    [REF_COL_AGE_ID]: { ...textRefCol, code: 'age', col_type: ageAndStatusColType, concept_set_id: CONCEPT_SET_AGE_ID, ref_dim_id: REF_DIM_FIRST_ID },
    [REF_COL_SEX_ID]: { ...textRefCol, code: 'sex', col_type: CaseDbColType.NOMINAL, concept_set_id: CONCEPT_SET_SEX_ID, ref_dim_id: REF_DIM_FIRST_ID },
    [REF_COL_STATUS_ID]: { ...textRefCol, code: 'status', col_type: ageAndStatusColType, concept_set_id: CONCEPT_SET_STATUS_ID, ref_dim_id: REF_DIM_SECOND_ID },
  };

  return createCompleteCaseType({
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: { ...baseAccess, read_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ...COL_IDS] },
    },
    cols,
    dims,
    ordered_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ...COL_IDS],
    ordered_col_ids_by_dim: {
      [DIM_FIRST_ID]: [SEX_COL_ID, AGE_COL_ID],
      [DIM_OTHER_ID]: [COMPLETE_CASE_TYPE_TEXT_COL_ID],
      [DIM_SECOND_ID]: [STATUS_COL_ID],
    },
    ordered_dim_ids: [DIM_FIRST_ID, DIM_SECOND_ID, DIM_OTHER_ID],
    ref_cols: refCols,
    ref_dims: refDims,
  });
};

const createDashboardContextValue = (highlight: DashboardContextValue['highlight']): DashboardContextValue => ({
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

type RenderHistogramWidgetOptions = {
  cases?: CaseDbCase[];
  completeCaseType?: CaseDbCompleteCaseType;
  storedWidgetData?: { colAId?: string; colBId?: string };
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderHistogramWidget = async ({
  cases = CASES,
  completeCaseType = createHistogramCompleteCaseType(),
  storedWidgetData,
}: RenderHistogramWidgetOptions = {}) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType,
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;
  if (storedWidgetData) {
    dashboardStore.getState().updateWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM, storedWidgetData);
  }

  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: cases.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(cases));

  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();

  const dashboardContext = createDashboardContextValue(vi.fn());
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardStoreContext value={dashboardStore}>
        <DashboardContext value={dashboardContext}>
          <div style={{ height: 600, width: 800 }}>
            <HistogramWidget />
          </div>
        </DashboardContext>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardContext, dashboardStore, screen };
};

const getHistogramChart = async (label = HISTOGRAM_CHART_LABEL) => {
  await vi.waitFor(() => {
    const element = document.querySelector<HTMLElement>(HISTOGRAM_CHART_SELECTOR);
    expect(element?.getAttribute('aria-label')).toBe(label);
    const instance = element ? getInstanceByDom(element) : undefined;
    expect(instance?.getOption().series).toBeDefined();
    expect((instance?.getOption().series as unknown[]).length).toBeGreaterThan(0);
  }, { timeout: 10_000 });
  return getInstanceByDom(document.querySelector<HTMLElement>(HISTOGRAM_CHART_SELECTOR));
};

describe('HistogramWidget', () => {
  beforeEach(async () => {
    clearDashboardStorage();
    mockApiRequest('GET', '/v1/organizations', () => Response.json([]));
    mockApiRequest('GET', '/v1/concept_sets', () => Response.json(CONCEPT_SETS));
    mockApiRequest('GET', '/v1/concepts', () => Response.json(CONCEPTS));

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

  it('selects the default axis columns and renders the histogram', async () => {
    const { dashboardStore, screen } = await renderHistogramWidget();

    await expect.element(screen.getByRole('img', { name: HISTOGRAM_CHART_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'X-Axis: Age' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Y-Axis: Status' })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(dashboardStore.getState().getWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM)).toEqual({
        colAId: STATUS_COL_ID,
        colBId: AGE_COL_ID,
      });
    });
    await getHistogramChart();
  });

  it('falls back to the default axis columns when the stored column ids no longer exist', async () => {
    const { dashboardStore, screen } = await renderHistogramWidget({
      storedWidgetData: { colAId: 'removed-col-a', colBId: 'removed-col-b' },
    });

    await expect.element(screen.getByRole('img', { name: 'Histogram showing the number of cases for Status and Age' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'X-Axis: Age' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Y-Axis: Status' })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(dashboardStore.getState().getWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM)).toEqual({
        colAId: STATUS_COL_ID,
        colBId: AGE_COL_ID,
      });
    });
  });

  it('shows a warning with the number of cases without a valid value', async () => {
    const { screen } = await renderHistogramWidget();

    await expect.element(screen.getByText('Missing cases: 1 (20%)')).toBeInTheDocument();
  });

  it('updates the chart and stored widget data when the x-axis column is changed', async () => {
    const { dashboardStore, screen } = await renderHistogramWidget();
    await getHistogramChart();

    await screen.getByRole('button', { name: 'X-Axis: Age' }).click();
    await screen.getByRole('menuitem', { exact: true, name: 'Sex' }).click();

    await expect.element(screen.getByRole('img', { name: 'Histogram showing the number of cases for Status and Sex' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'X-Axis: Sex' })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(dashboardStore.getState().getWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM)).toEqual({
        colAId: STATUS_COL_ID,
        colBId: SEX_COL_ID,
      });
    });
  });

  it('updates the chart and stored widget data when the y-axis column is changed', async () => {
    const { dashboardStore, screen } = await renderHistogramWidget();
    await getHistogramChart();

    await screen.getByRole('button', { name: 'Y-Axis: Status' }).click();
    await screen.getByRole('menuitem', { exact: true, name: 'Sex' }).click();

    await expect.element(screen.getByRole('img', { name: 'Histogram showing the number of cases for Sex and Age' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Y-Axis: Sex' })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(dashboardStore.getState().getWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM)).toEqual({
        colAId: SEX_COL_ID,
        colBId: AGE_COL_ID,
      });
    });
  });

  it('shows the unavailable reason and disables the download options when fewer than two columns are allowed', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      const { screen } = await renderHistogramWidget({ completeCaseType: createHistogramCompleteCaseType({ areAgeAndStatusAllowed: false }) });

      await expect.element(screen.getByText('No two compatible columns found to display a histogram.', { exact: false })).toBeInTheDocument();
      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalledWith(expect.objectContaining({ disabled: true, zone: DASHBOARD_COMPONENT_NAME.HISTOGRAM }));
      });
    } finally {
      eventBus.removeEventListener('onDownloadOptionsChanged', changedListener);
    }
  });

  it('shows no chart and disables the download options when there are no cases', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [], is_max_results_exceeded: false }));
      const { dashboardContext, screen } = await renderHistogramWidget({ cases: [] });

      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalledWith(expect.objectContaining({
          items: [expect.objectContaining({ disabled: true, label: 'Save as PNG' }), expect.objectContaining({ disabled: true, label: 'Save as JPEG' })],
          zone: DASHBOARD_COMPONENT_NAME.HISTOGRAM,
        }));
      });
      expect(document.querySelector(HISTOGRAM_CHART_SELECTOR)).toBeNull();

      dashboardContext.highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });
      await expect.element(screen.getByRole('button', { name: 'X-Axis: Age' })).toBeInTheDocument();
    } finally {
      eventBus.removeEventListener('onDownloadOptionsChanged', changedListener);
    }
  });

  it('emits download options for the chart and re-emits them on request', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      await renderHistogramWidget();
      await getHistogramChart();

      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalledWith(expect.objectContaining({ disabled: false, zone: DASHBOARD_COMPONENT_NAME.HISTOGRAM }));
      });

      const lastPayload = changedListener.mock.lastCall?.[0] as { items: { callback: () => void; label: string }[] };
      expect(lastPayload.items.map((item) => item.label)).toEqual(['Save as PNG', 'Save as JPEG']);
      lastPayload.items[0].callback();
      lastPayload.items[1].callback();

      changedListener.mockClear();
      eventBus.emit('onDownloadOptionsRequested', undefined);
      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalled();
      });
    } finally {
      eventBus.removeEventListener('onDownloadOptionsChanged', changedListener);
    }
  });

  it('highlights whole series when all series have highlighted cases', async () => {
    const { dashboardContext, screen } = await renderHistogramWidget();
    const chart = await getHistogramChart();
    await expect.element(screen.getByRole('img', { name: HISTOGRAM_CHART_LABEL })).toBeInTheDocument();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-1', 'case-2', 'case-3', 'case-4'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'highlight' }));
    });
    const highlightCall = dispatchSpy.mock.calls.find(([action]) => (action as { type: string }).type === 'highlight');
    const batch = (highlightCall?.[0] as unknown as { batch: { dataIndex: number; notBlur?: boolean; seriesIndex?: number }[] }).batch;
    expect(batch.every((target) => target.seriesIndex === undefined)).toBe(true);
    expect(batch).toHaveLength(2);
    expect(batch[1].notBlur).toBe(true);
    expect(batch[0].notBlur).toBeUndefined();
  });

  it('highlights only the matching series segments when only some series have highlighted cases', async () => {
    const { dashboardContext, screen } = await renderHistogramWidget();
    const chart = await getHistogramChart();
    await expect.element(screen.getByRole('img', { name: HISTOGRAM_CHART_LABEL })).toBeInTheDocument();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-1', 'case-3'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'highlight' }));
    });
    const highlightCall = dispatchSpy.mock.calls.find(([action]) => (action as { type: string }).type === 'highlight');
    const batch = (highlightCall?.[0] as unknown as { batch: { dataIndex: number; notBlur?: boolean; seriesIndex?: number }[] }).batch;
    expect(batch.every((target) => target.seriesIndex !== undefined)).toBe(true);
    expect(batch).toHaveLength(2);
    expect(batch[0].notBlur).toBeUndefined();
    expect(batch[1].notBlur).toBe(true);
  });

  it('downplays the chart when nothing is highlighted and ignores histogram-origin highlights', async () => {
    const { dashboardContext, screen } = await renderHistogramWidget();
    const chart = await getHistogramChart();
    await expect.element(screen.getByRole('img', { name: HISTOGRAM_CHART_LABEL })).toBeInTheDocument();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.HISTOGRAM });
    dashboardContext.highlightSubject.next({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith({ type: 'downplay' });
    });
    expect(dispatchSpy.mock.calls.some(([action]) => (action as { type: string }).type === 'highlight')).toBe(false);
  });
});
