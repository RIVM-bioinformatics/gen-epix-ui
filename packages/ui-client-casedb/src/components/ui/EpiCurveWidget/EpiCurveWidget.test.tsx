import { format } from 'date-fns';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { getInstanceByDom } from 'echarts/core';
import type { EChartsType } from 'echarts/core';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

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
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';

import { EpiCurveWidget } from './EpiCurveWidget';

const STORAGE_NAME_POST_FIX = 'EpiCurveWidget';
const DIM_OTHER_ID = 'dim-other';
const DIM_TIME_ID = 'dim-time';
const REF_DIM_TIME_ID = 'ref-dim-time';
const DIM_SECOND_TIME_ID = 'dim-second-time';
const REF_DIM_SECOND_TIME_ID = 'ref-dim-second-time';
const ONSET_COL_ID = 'col-onset';
const DAY_COL_ID = 'col-day';
const WEEK_COL_ID = 'col-week';
const MONTH_COL_ID = 'col-month';
const QUARTER_COL_ID = 'col-quarter';
const YEAR_COL_ID = 'col-year';
const EPI_CURVE_CHART_SELECTOR = '[role="img"][aria-label^="Epidemiological"]';

type TimeColDefinition = {
  code: string;
  colType: CaseDbColType;
  id: string;
  label: string;
};

const TIME_COL_DEFINITIONS: TimeColDefinition[] = [
  { code: 'day', colType: CaseDbColType.TIME_DAY, id: DAY_COL_ID, label: 'Day' },
  { code: 'week', colType: CaseDbColType.TIME_WEEK, id: WEEK_COL_ID, label: 'Week' },
  { code: 'month', colType: CaseDbColType.TIME_MONTH, id: MONTH_COL_ID, label: 'Month' },
  { code: 'quarter', colType: CaseDbColType.TIME_QUARTER, id: QUARTER_COL_ID, label: 'Quarter' },
  { code: 'year', colType: CaseDbColType.TIME_YEAR, id: YEAR_COL_ID, label: 'Year' },
];

const createEpiCurveCompleteCaseType = ({ includeSecondTimeDim = false, includeTimeDim = true }: { includeSecondTimeDim?: boolean; includeTimeDim?: boolean } = {}): CaseDbCompleteCaseType => {
  const timeDefinitions = includeTimeDim ? TIME_COL_DEFINITIONS : [];
  const dimOther: CaseDbDim = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'other', id: DIM_OTHER_ID, label: 'Other', rank: 1, ref_dim_id: 'ref-dim-other' };
  const dimTime: CaseDbDim = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'time', id: DIM_TIME_ID, label: 'Time', rank: 2, ref_dim_id: REF_DIM_TIME_ID };
  const dims: Record<string, CaseDbDim> = { [DIM_OTHER_ID]: dimOther };
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-other': { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  };
  if (timeDefinitions.length) {
    dims[DIM_TIME_ID] = dimTime;
    refDims[REF_DIM_TIME_ID] = { code: 'time', dim_type: CaseDbDimType.TIME, id: REF_DIM_TIME_ID, label: 'Time' };
  }

  const textCol = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'text', dim_id: DIM_OTHER_ID, id: COMPLETE_CASE_TYPE_TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const cols: Record<string, CaseDbCol> = { [textCol.id]: textCol };
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
  };
  timeDefinitions.forEach((definition, index) => {
    cols[definition.id] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: definition.code, dim_id: DIM_TIME_ID, id: definition.id, label: definition.label, rank: index + 1, ref_col_id: `ref-${definition.id}` };
    refCols[`ref-${definition.id}`] = { code: definition.code, col_type: definition.colType, ref_dim_id: REF_DIM_TIME_ID };
  });

  const orderedColIdsByDim: Record<string, string[]> = { [DIM_OTHER_ID]: [textCol.id] };
  const orderedDimIds = [DIM_OTHER_ID];
  if (timeDefinitions.length) {
    orderedColIdsByDim[DIM_TIME_ID] = timeDefinitions.map((definition) => definition.id);
    orderedDimIds.push(DIM_TIME_ID);
  }
  if (includeSecondTimeDim && timeDefinitions.length) {
    dims[DIM_SECOND_TIME_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'onset', id: DIM_SECOND_TIME_ID, label: 'Onset', rank: 3, ref_dim_id: REF_DIM_SECOND_TIME_ID };
    refDims[REF_DIM_SECOND_TIME_ID] = { code: 'onset', dim_type: CaseDbDimType.TIME, id: REF_DIM_SECOND_TIME_ID, label: 'Onset' };
    cols[ONSET_COL_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'onset', dim_id: DIM_SECOND_TIME_ID, id: ONSET_COL_ID, label: 'Onset day', rank: 1, ref_col_id: 'ref-col-onset' };
    refCols['ref-col-onset'] = { code: 'onset', col_type: CaseDbColType.TIME_DAY, ref_dim_id: REF_DIM_SECOND_TIME_ID };
    orderedColIdsByDim[DIM_SECOND_TIME_ID] = [ONSET_COL_ID];
    orderedDimIds.push(DIM_SECOND_TIME_ID);
  }

  const readColIds = Object.keys(cols);

  return {
    case_date_dim_id: null,
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: {
        add_case: false,
        add_case_set: false,
        case_type_id: COMPLETE_CASE_TYPE_ID,
        data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
        is_private: false,
        read_case_set: false,
        read_col_ids: readColIds,
        remove_case: false,
        remove_case_set: false,
        write_case_set: false,
        write_col_ids: [],
      },
    },
    case_type_share_abacs: {},
    cols,
    description: 'Epi curve case type',
    dims,
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: COMPLETE_CASE_TYPE_ID,
    name: 'Epi curve case type',
    ordered_col_ids: readColIds,
    ordered_col_ids_by_dim: orderedColIdsByDim,
    ordered_dim_ids: orderedDimIds,
    props: { read_max_n_cases: 1000, read_max_tree_size: 100 },
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

const createTimeCase = (id: string, content: Record<string, string>): CaseDbCase => createDashboardCase({
  content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: id, ...content },
  id,
});

const CASES: CaseDbCase[] = [
  createTimeCase('case-1', { [DAY_COL_ID]: '2024-01-10', [MONTH_COL_ID]: '2024-01', [QUARTER_COL_ID]: '2024-Q1', [WEEK_COL_ID]: '2024-W02', [YEAR_COL_ID]: '2024' }),
  createTimeCase('case-2', { [DAY_COL_ID]: '2024-01-10', [MONTH_COL_ID]: '2024-01', [QUARTER_COL_ID]: '2024-Q1', [WEEK_COL_ID]: '2024-W02', [YEAR_COL_ID]: '2024' }),
  createTimeCase('case-3', { [DAY_COL_ID]: '2024-01-12', [MONTH_COL_ID]: '2024-02', [QUARTER_COL_ID]: '2024-Q1', [WEEK_COL_ID]: '2024-W03', [YEAR_COL_ID]: '2024' }),
  createTimeCase('case-4', { [DAY_COL_ID]: '2024-02-01', [MONTH_COL_ID]: '2024-02', [QUARTER_COL_ID]: '2024-Q1', [WEEK_COL_ID]: '2024-W05', [YEAR_COL_ID]: '2024' }),
  createTimeCase('case-5', { [MONTH_COL_ID]: '2024-01', [QUARTER_COL_ID]: '2024-Q1', [WEEK_COL_ID]: '2024-W02', [YEAR_COL_ID]: '2024' }),
];

const createDashboardContextValue = (highlight: DashboardContextValue['highlight']): DashboardContextValue => ({
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

type RenderEpiCurveWidgetOptions = {
  cases?: CaseDbCase[];
  columnId?: string;
  completeCaseType?: CaseDbCompleteCaseType;
  highlight?: DashboardContextValue['highlight'];
  selectedIds?: string[];
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderEpiCurveWidget = async ({
  cases = CASES,
  columnId,
  completeCaseType = createEpiCurveCompleteCaseType(),
  highlight = vi.fn(),
  selectedIds,
}: RenderEpiCurveWidgetOptions = {}) => {
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

  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: cases.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(cases));

  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();
  if (columnId) {
    dashboardStore.getState().updateWidgetData(DASHBOARD_COMPONENT_NAME.EPI_CURVE, { columnId });
  }
  if (selectedIds) {
    dashboardStore.getState().setSelectedIds(selectedIds);
  }

  const dashboardContext = createDashboardContextValue(highlight);
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardStoreContext value={dashboardStore}>
        <DashboardContext value={dashboardContext}>
          <div style={{ height: 600, width: 800 }}>
            <EpiCurveWidget />
          </div>
        </DashboardContext>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardStore, highlight, screen };
};

// Time-dimension filters are stored under the dimension's preferred column, not under the clicked column
const getDateFilterId = (dashboardStore: ReturnType<typeof createDashboardStore>, columnId: string): string =>
  dashboardStore.getState().filterDimensions.find(filterDimension => filterDimension.filterIds.includes(columnId)).preferredFilterId;

// Top-level filterValues is not populated by the filter update, so the range is read from the filter itself
const getDateFilterRange = (dashboardStore: ReturnType<typeof createDashboardStore>, columnId: string): string[] => {
  const filterId = getDateFilterId(dashboardStore, columnId);
  const filter = dashboardStore.getState().filters.find(candidate => candidate.id === filterId);
  return (filter.filterValue as Date[]).map(bound => format(bound, 'yyyy-MM-dd'));
};

const getEpiCurveChartDom = () => document.querySelector<HTMLElement>(EPI_CURVE_CHART_SELECTOR);

const getEpiCurveChart = async (): Promise<EChartsType> => {
  await vi.waitFor(() => {
    expect(getEpiCurveChartDom()).not.toBeNull();
  });
  const chart = getInstanceByDom(getEpiCurveChartDom());
  if (!chart) {
    throw new Error('Epi curve chart instance not found');
  }
  // Bars grow from zero during the entry animation, so hit-testing only works once it has finished.
  await new Promise<void>((resolve) => {
    const isAnimationFinished = () => chart.getZr().animation.isFinished();
    const poll = setInterval(() => {
      if (isAnimationFinished()) {
        clearInterval(poll);
        resolve();
      }
    }, 20);
    chart.on('finished', () => {
      clearInterval(poll);
      resolve();
    });
  });
  return chart;
};

const getRenderedSeriesTypes = (): string[] => {
  const chart = getInstanceByDom(getEpiCurveChartDom());
  if (!chart) {
    return [];
  }
  const series = (chart.getOption().series ?? []) as { type?: string }[];
  return series.map((item) => item.type ?? '');
};

const getBarPixel = (chart: EChartsType, dataIndex: number) => {
  const [x, y] = chart.convertToPixel({ gridIndex: 0 }, [dataIndex, 0.5]);
  return { x, y };
};

const clickBar = async (dataIndex: number) => {
  const chart = await getEpiCurveChart();
  const position = getBarPixel(chart, dataIndex);
  await userEvent.hover(chart.getDom(), { position });
  await userEvent.click(chart.getDom(), { position });
};

const hoverBar = async (dataIndex: number) => {
  const chart = await getEpiCurveChart();
  await userEvent.hover(chart.getDom(), { position: getBarPixel(chart, dataIndex) });
};

describe('EpiCurveWidget', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
    localStorage.removeItem(`GENEPIX-TableStore-epiDashboardStoreLoader-${STORAGE_NAME_POST_FIX}`);
  });

  it('renders a bar chart for the selected time column', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID });

    await expect.element(screen.getByText('Epi curve: Day')).toBeInTheDocument();
    expect(getEpiCurveChartDom()).not.toBeNull();
  });

  it('auto-selects a preferred time column when none is stored', async () => {
    await renderEpiCurveWidget();

    await vi.waitFor(() => {
      expect(getEpiCurveChartDom()).not.toBeNull();
    });
    expect(document.body.textContent).not.toContain('No time column selected.');
  });

  it('shows the unavailable message when the case type has no time dimension', async () => {
    const { screen } = await renderEpiCurveWidget({ completeCaseType: createEpiCurveCompleteCaseType({ includeTimeDim: false }) });

    await expect.element(screen.getByText(/No time column found\./)).toBeInTheDocument();
  });

  it('shows the unavailable message when there are no cases', async () => {
    const { screen } = await renderEpiCurveWidget({ cases: [] });

    await expect.element(screen.getByText(/No cases found\./)).toBeInTheDocument();
  });

  it('shows the unavailable message when the stored time column does not exist', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: 'missing-col' });

    await expect.element(screen.getByText(/No time column selected\./)).toBeInTheDocument();
  });

  it('shows the unavailable message when no case has a valid date for the selected column', async () => {
    const casesWithoutWeek = CASES.map((caseItem) => ({ ...caseItem, content: { ...caseItem.content, [WEEK_COL_ID]: 'not-a-date' } }));
    const { screen } = await renderEpiCurveWidget({ cases: casesWithoutWeek, columnId: WEEK_COL_ID });

    await expect.element(screen.getByText(/No cases with valid date- \/ time information found for the selected column\./)).toBeInTheDocument();
  });

  it('shows the missing cases warning when some cases have no date for the selected column', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID });

    await expect.element(screen.getByText('Missing cases: 1 (20%)')).toBeInTheDocument();
  });

  it('switches the primary menu to the area chart when stratification is available', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID, selectedIds: ['case-1', 'case-2'] });

    await screen.getByRole('button', { name: 'Normalized stacked area chart' }).click();

    await vi.waitFor(() => {
      expect(getRenderedSeriesTypes()).toContain('line');
    });
    expect(getRenderedSeriesTypes()).not.toContain('bar');
  });

  it('keeps the area chart disabled when no stratification is available', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID });

    await expect.element(screen.getByRole('button', { name: 'Normalized stacked area chart' })).toBeDisabled();
  });

  it('falls back to the bar chart when the stratification is removed while in area mode', async () => {
    const { dashboardStore, screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID, selectedIds: ['case-1', 'case-2'] });
    await screen.getByRole('button', { name: 'Normalized stacked area chart' }).click();
    await getEpiCurveChart();

    dashboardStore.getState().setSelectedIds([]);

    await vi.waitFor(() => {
      const renderedTypes = getRenderedSeriesTypes();
      expect(renderedTypes.length).toBeGreaterThan(0);
      expect(renderedTypes.every((seriesType) => seriesType === 'bar')).toBe(true);
    });
    await expect.element(screen.getByRole('button', { name: 'Normalized stacked area chart' })).toBeDisabled();
  });

  it('highlights the cases of a hovered bar', async () => {
    const highlight = vi.fn();
    await renderEpiCurveWidget({ columnId: DAY_COL_ID, highlight });

    await hoverBar(0);

    await vi.waitFor(() => {
      expect(highlight).toHaveBeenCalledWith(expect.objectContaining({ origin: DASHBOARD_COMPONENT_NAME.EPI_CURVE }));
    });
  });

  it('opens a context menu for a clicked bar and filters the dashboard to that date', async () => {
    const { dashboardStore, screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID });

    await clickBar(0);
    await screen.getByRole('menuitem', { name: /Filter \(show only 2024-01-10\)/ }).click();

    await vi.waitFor(() => {
      expect(getDateFilterRange(dashboardStore, DAY_COL_ID)).toEqual(['2024-01-10', '2024-01-10']);
    });
  });

  it.each([
    // The week axis starts at the empty first ISO week (2024-W01), so bar 0 is Jan 1 to 7
    { colId: WEEK_COL_ID, expectedFilter: ['2024-01-01', '2024-01-07'], label: 'Week' },
    { colId: MONTH_COL_ID, expectedFilter: ['2024-01-01', '2024-01-31'], label: 'Month' },
    { colId: QUARTER_COL_ID, expectedFilter: ['2024-01-01', '2024-03-31'], label: 'Quarter' },
    { colId: YEAR_COL_ID, expectedFilter: ['2024-01-01', '2024-12-31'], label: 'Year' },
  ])('filters the dashboard to the bar date range for a $label column', async ({ colId, expectedFilter }) => {
    const { dashboardStore, screen } = await renderEpiCurveWidget({ columnId: colId });

    await clickBar(0);
    await screen.getByRole('menuitem', { name: /Filter \(show only/ }).click();

    await vi.waitFor(() => {
      expect(getDateFilterRange(dashboardStore, colId)).toEqual(expectedFilter);
    });
  });

  it('returns to the bar chart from the area chart via the primary menu', async () => {
    const { screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID, selectedIds: ['case-1', 'case-2'] });
    await screen.getByRole('button', { name: 'Normalized stacked area chart' }).click();
    await vi.waitFor(() => {
      expect(getRenderedSeriesTypes()).toContain('line');
    });

    await screen.getByRole('button', { name: 'Bar chart' }).click();

    await vi.waitFor(() => {
      expect(getRenderedSeriesTypes()).toContain('bar');
    });
    expect(getRenderedSeriesTypes()).not.toContain('line');
  });

  it('lists the columns of every time dimension in the title menu', async () => {
    const { screen } = await renderEpiCurveWidget({
      columnId: DAY_COL_ID,
      completeCaseType: createEpiCurveCompleteCaseType({ includeSecondTimeDim: true }),
    });

    await screen.getByRole('button', { name: 'Epi curve: Day' }).click();

    await expect.element(screen.getByRole('menuitem', { name: 'Month' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: 'Onset day' })).toBeVisible();
  });

  it('changes the time column from the title menu', async () => {
    const { dashboardStore, screen } = await renderEpiCurveWidget({ columnId: DAY_COL_ID });

    await screen.getByRole('button', { name: 'Epi curve: Day' }).click();
    await screen.getByRole('menuitem', { name: 'Month' }).click();

    await vi.waitFor(() => {
      expect(dashboardStore.getState().getWidgetData<{ columnId: string }>(DASHBOARD_COMPONENT_NAME.EPI_CURVE).columnId).toBe(MONTH_COL_ID);
    });
  });

  it('emits download options for the chart and re-emits them on request', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      await renderEpiCurveWidget({ columnId: DAY_COL_ID });
      await getEpiCurveChart();

      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalledWith(expect.objectContaining({ disabled: false, zone: DASHBOARD_COMPONENT_NAME.EPI_CURVE }));
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

  it('disables the download options when the widget is unavailable', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      await renderEpiCurveWidget({ cases: [] });

      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));
      });
    } finally {
      eventBus.removeEventListener('onDownloadOptionsChanged', changedListener);
    }
  });
});
