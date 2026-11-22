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
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
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
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataService } from '../../../classes/services/DataService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import { EventBusService } from '../../../classes/services/EventBusService';
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

import { MapWidget } from './MapWidget';

const STORAGE_NAME_POST_FIX = 'MapWidget';
const DIM_OTHER_ID = 'dim-other';
const DIM_GEO_ID = 'dim-geo';
const REF_DIM_OTHER_ID = 'ref-dim-other';
const REF_DIM_GEO_ID = 'ref-dim-geo';
const DIM_GEO_TWO_ID = 'dim-geo-two';
const REF_DIM_GEO_TWO_ID = 'ref-dim-geo-two';
const GEO_COL_DIM_TWO_ID = 'col-geo-dim-two';
const REGION_SET_ID = 'region-set-1';
const REGION_SET_SHAPE_ID = 'region-set-shape-1';
const GEO_COL_ID = 'col-geo';
const GEO_COL_TWO_ID = 'col-geo-two';
const REGION_SET_TWO_ID = 'region-set-2';
const REGION_SET_SHAPE_TWO_ID = 'region-set-shape-2';
const GEO_COL_REGION_SET_TWO_ID = 'col-geo-region-set-two';
const MAP_CANVAS_SELECTOR = '[role="img"][aria-label^="Figure of a map"]';

const REGION_ONE: CaseDbRegion = { center_lat: 0.25, center_lon: 0.25, code: '1', id: 'region-1', name: 'Region one', region_set_id: REGION_SET_ID } as CaseDbRegion;
const REGION_TWO: CaseDbRegion = { center_lat: 0.75, center_lon: 0.75, code: '2', id: 'region-2', name: 'Region two', region_set_id: REGION_SET_ID } as CaseDbRegion;
const REGION_THREE: CaseDbRegion = { center_lat: 0.5, center_lon: 0.5, code: '3', id: 'region-3', name: 'Region three', region_set_id: REGION_SET_TWO_ID } as CaseDbRegion;
const REGIONS: CaseDbRegion[] = [REGION_ONE, REGION_TWO, REGION_THREE];

const createGeoJson = (featureCount: number): string => JSON.stringify({
  features: Array.from({ length: featureCount }, (_, index) => ({
    geometry: {
      coordinates: [[[index, 0], [index + 1, 0], [index + 1, 1], [index, 1], [index, 0]]],
      type: 'Polygon',
    },
    properties: { name: `Feature ${index + 1}` },
    type: 'Feature',
  })),
  type: 'FeatureCollection',
});

const REGION_SET_SHAPE = { geo_json: createGeoJson(2), id: REGION_SET_SHAPE_ID, region_set_id: REGION_SET_ID };
const REGION_SET_SHAPE_TWO = { geo_json: createGeoJson(1), id: REGION_SET_SHAPE_TWO_ID, region_set_id: REGION_SET_TWO_ID };

const createGeoRefDim = (): CaseDbRefDim => ({ code: 'geo', dim_type: CaseDbDimType.GEO, id: REF_DIM_GEO_ID, label: 'Geo' });

const createMapCompleteCaseType = ({ includeGeoDim = true, includeSecondGeoDim = false }: { includeGeoDim?: boolean; includeSecondGeoDim?: boolean } = {}): CaseDbCompleteCaseType => {
  const dims: Record<string, CaseDbDim> = {
    [DIM_OTHER_ID]: { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'other', id: DIM_OTHER_ID, label: 'Other', rank: 1, ref_dim_id: REF_DIM_OTHER_ID },
  };
  const refDims: Record<string, CaseDbRefDim> = {
    [REF_DIM_OTHER_ID]: { code: 'other', dim_type: CaseDbDimType.OTHER, id: REF_DIM_OTHER_ID, label: 'Other' },
  };
  const textCol = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'text', dim_id: DIM_OTHER_ID, id: COMPLETE_CASE_TYPE_TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const cols: Record<string, CaseDbCol> = { [textCol.id]: textCol };
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: REF_DIM_OTHER_ID },
  };
  const orderedColIdsByDim: Record<string, string[]> = { [DIM_OTHER_ID]: [textCol.id] };
  const orderedDimIds = [DIM_OTHER_ID];

  if (includeGeoDim) {
    dims[DIM_GEO_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo', id: DIM_GEO_ID, label: 'Geo', rank: 2, ref_dim_id: REF_DIM_GEO_ID };
    refDims[REF_DIM_GEO_ID] = createGeoRefDim();
    cols[GEO_COL_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo', dim_id: DIM_GEO_ID, id: GEO_COL_ID, label: 'Region', rank: 1, ref_col_id: 'ref-col-geo' };
    cols[GEO_COL_TWO_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo_two', dim_id: DIM_GEO_ID, id: GEO_COL_TWO_ID, label: 'Region two', rank: 2, ref_col_id: 'ref-col-geo-two' };
    cols[GEO_COL_REGION_SET_TWO_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo_set_two', dim_id: DIM_GEO_ID, id: GEO_COL_REGION_SET_TWO_ID, label: 'Region set two', rank: 3, ref_col_id: 'ref-col-geo-set-two' };
    refCols['ref-col-geo'] = { code: 'geo', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_GEO_ID, region_set_id: REGION_SET_ID };
    refCols['ref-col-geo-two'] = { code: 'geo_two', col_type: CaseDbColType.GEO_REGION, description: 'Second geo column', ref_dim_id: REF_DIM_GEO_ID, region_set_id: REGION_SET_ID };
    refCols['ref-col-geo-set-two'] = { code: 'geo_set_two', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_GEO_ID, region_set_id: REGION_SET_TWO_ID };
    orderedColIdsByDim[DIM_GEO_ID] = [GEO_COL_ID, GEO_COL_TWO_ID, GEO_COL_REGION_SET_TWO_ID];
    orderedDimIds.push(DIM_GEO_ID);

    if (includeSecondGeoDim) {
      dims[DIM_GEO_TWO_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo_dim_two', id: DIM_GEO_TWO_ID, label: 'Geo two', rank: 3, ref_dim_id: REF_DIM_GEO_TWO_ID };
      refDims[REF_DIM_GEO_TWO_ID] = { code: 'geo_dim_two', dim_type: CaseDbDimType.GEO, id: REF_DIM_GEO_TWO_ID, label: 'Geo two' };
      cols[GEO_COL_DIM_TWO_ID] = { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'geo_dim_two', dim_id: DIM_GEO_TWO_ID, id: GEO_COL_DIM_TWO_ID, label: 'Region in dim two', rank: 1, ref_col_id: 'ref-col-geo-dim-two' };
      refCols['ref-col-geo-dim-two'] = { code: 'geo_dim_two', col_type: CaseDbColType.GEO_REGION, ref_dim_id: REF_DIM_GEO_TWO_ID, region_set_id: REGION_SET_ID };
      orderedColIdsByDim[DIM_GEO_TWO_ID] = [GEO_COL_DIM_TWO_ID];
      orderedDimIds.push(DIM_GEO_TWO_ID);
    }
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
    description: 'Map case type',
    dims,
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: COMPLETE_CASE_TYPE_ID,
    name: 'Map case type',
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

const createMapCase = (id: string, content: Record<string, string>): CaseDbCase => createDashboardCase({
  content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: id, ...content },
  id,
});

const CASES: CaseDbCase[] = [
  createMapCase('case-1', { [GEO_COL_ID]: REGION_ONE.id, [GEO_COL_TWO_ID]: REGION_TWO.id }),
  createMapCase('case-2', { [GEO_COL_ID]: REGION_ONE.id, [GEO_COL_TWO_ID]: REGION_TWO.id }),
  createMapCase('case-3', { [GEO_COL_ID]: REGION_TWO.id, [GEO_COL_TWO_ID]: REGION_ONE.id }),
  createMapCase('case-4', { [GEO_COL_REGION_SET_TWO_ID]: REGION_THREE.id }),
];

const REGION_SETS: CaseDbRegionSet[] = [
  { code: REGION_SET_ID, id: REGION_SET_ID, name: 'Region set one' } as CaseDbRegionSet,
  { code: REGION_SET_TWO_ID, id: REGION_SET_TWO_ID, name: 'Region set two' } as CaseDbRegionSet,
];

const registerRegionApis = () => {
  mockApiRequest('POST', '/v1/region_sets/query', () => Response.json(REGION_SETS));
  mockApiRequest('POST', '/v1/regions/query', () => Response.json(REGIONS));
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

type RenderMapWidgetOptions = {
  cases?: CaseDbCase[];
  columnId?: string;
  completeCaseType?: CaseDbCompleteCaseType;
  highlight?: DashboardContextValue['highlight'];
  regionSetShapes?: unknown[];
  selectedIds?: string[];
};

const createDashboardContextValue = (highlight: DashboardContextValue['highlight']): DashboardContextValue => ({
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

const renderErrorFallback = ({ error }: FallbackProps) => (
  <div>
    {(error as Error).message}
  </div>
);

const renderMapWidget = async ({
  cases = CASES,
  columnId,
  completeCaseType = createMapCompleteCaseType(),
  highlight = vi.fn(),
  regionSetShapes = [REGION_SET_SHAPE, REGION_SET_SHAPE_TWO],
  selectedIds,
}: RenderMapWidgetOptions = {}) => {
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

  registerRegionApis();
  await container.resolve(DataService).loadMissingRegions(completeCaseType, new AbortController().signal);
  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: cases.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(cases));
  mockApiRequest('POST', '/v1/region_set_shapes/query', () => Response.json(regionSetShapes));

  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();
  if (columnId) {
    dashboardStore.getState().updateWidgetData(DASHBOARD_COMPONENT_NAME.MAP, { columnId });
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
            <ErrorBoundary fallbackRender={renderErrorFallback}>
              <MapWidget />
            </ErrorBoundary>
          </div>
        </DashboardContext>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardContext, dashboardStore, highlight, screen };
};

const getMapChartDom = () => document.querySelector<HTMLElement>(MAP_CANVAS_SELECTOR);

const getMapChart = async (): Promise<EChartsType> => {
  await vi.waitFor(() => {
    expect(getMapChartDom()).not.toBeNull();
  });
  const chart = getInstanceByDom(getMapChartDom());
  if (!chart) {
    throw new Error('Map chart instance not found');
  }
  return chart;
};

// ECharts types the trigger payload strictly; these tests send partial payloads shaped like the ones ECharts emits.
const triggerChartEvent = (chart: EChartsType, eventType: string, payload: object) => {
  chart.trigger(eventType, payload);
};

describe('MapWidget', () => {
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

  it('renders a map for the preferred geo column', async () => {
    const { screen } = await renderMapWidget();

    await expect.element(screen.getByText('Map: Region two')).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getMapChartDom()).not.toBeNull();
    });
  });

  it('renders the map for the column stored in the widget data', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID });

    await expect.element(screen.getByText('Map: Region')).toBeInTheDocument();
  });

  it('switches the displayed geo column from the title menu', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID });

    await userEvent.click(screen.getByRole('button', { name: 'Map: Region' }).element());
    await userEvent.click(screen.getByRole('menuitem', { exact: true, name: 'Region two' }).element());

    await expect.element(screen.getByText('Map: Region two')).toBeInTheDocument();
  });

  it('lists the geo columns of every geo dimension in the title menu, separated by a divider', async () => {
    const { screen } = await renderMapWidget({
      columnId: GEO_COL_ID,
      completeCaseType: createMapCompleteCaseType({ includeSecondGeoDim: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Map: Region' }).element());
    await userEvent.click(screen.getByRole('menuitem', { exact: true, name: 'Region in dim two' }).element());

    await expect.element(screen.getByText('Map: Region in dim two')).toBeInTheDocument();
  });

  it('shows the unavailable message when no geo column is found', async () => {
    const completeCaseType = createMapCompleteCaseType({ includeGeoDim: false });
    const { screen } = await renderMapWidget({ completeCaseType });

    await expect.element(screen.getByText('Epi map can not be shown')).toBeInTheDocument();
  });

  it('shows the unavailable message when the stored column is not found', async () => {
    const { screen } = await renderMapWidget({ columnId: 'col-unknown' });

    await expect.element(screen.getByText('No geographical column found.', { exact: false })).toBeInTheDocument();
  });

  it('shows the unavailable message when no shape exists for the selected column', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID, regionSetShapes: [] });

    await expect.element(screen.getByText('No geographical shape found for the selected column.', { exact: false })).toBeInTheDocument();
  });

  it('shows the unavailable message when no cases have valid geographical information', async () => {
    const cases = [createMapCase('case-no-geo', {})];
    const { screen } = await renderMapWidget({ cases, columnId: GEO_COL_ID });

    await expect.element(screen.getByText('No cases with valid geographical information found for the selected column.', { exact: false })).toBeInTheDocument();
  });

  it('shows the unavailable message when the geo json is null', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID, regionSetShapes: [{ ...REGION_SET_SHAPE, geo_json: 'null' }] });

    await expect.element(screen.getByText('No geographical shape found for the selected column.', { exact: false })).toBeInTheDocument();
  });

  it('treats malformed geo json as having no regions', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID, regionSetShapes: [{ ...REGION_SET_SHAPE, geo_json: '{not json' }] });

    await expect.element(screen.getByText('Map: Region')).toBeInTheDocument();
  });

  it('shows the missing cases warning when some cases have no region', async () => {
    const cases = [...CASES, createMapCase('case-missing', { [GEO_COL_ID]: 'unknown-region' })];
    const { screen } = await renderMapWidget({ cases, columnId: GEO_COL_ID });

    await expect.element(screen.getByText('Missing cases: 2 (40%)')).toBeInTheDocument();
  });

  it('ignores highlight updates that originate from the map itself', async () => {
    const { dashboardContext } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.MAP });
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('highlights and downplays regions in response to highlight subject updates', async () => {
    const { dashboardContext } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-1'], origin: 'OTHER' });
    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'highlight' }));
    });

    dashboardContext.highlightSubject.next({ caseIds: [], origin: 'OTHER' });
    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'downplay' }));
    });
  });

  it('disables the download options until the chart is ready', async () => {
    const eventBus = container.resolve(EventBusService);
    const changedListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', changedListener);
    try {
      await renderMapWidget({ columnId: GEO_COL_ID });

      await vi.waitFor(() => {
        expect(changedListener).toHaveBeenCalled();
      });
      const firstPayload = changedListener.mock.calls[0][0] as { items: { disabled: boolean }[] };
      expect(firstPayload.items.every((item) => item.disabled)).toBe(true);

      await vi.waitFor(() => {
        const lastPayload = changedListener.mock.lastCall?.[0] as { disabled: boolean; items: { callback: () => void; disabled: boolean; label: string }[] };
        expect(lastPayload.disabled).toBe(false);
        expect(lastPayload.items.map((item) => [item.label, item.disabled])).toEqual([['Save as PNG', false], ['Save as JPEG', false]]);
        lastPayload.items.forEach((item) => item.callback());
      });
    } finally {
      eventBus.removeEventListener('onDownloadOptionsChanged', changedListener);
    }
  });

  it('highlights the cases of a hovered region and clears the highlight on mouse out', async () => {
    const { highlight } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();

    triggerChartEvent(chart, 'mouseover', { data: { genEpixData: { caseIds: ['case-1', 'case-2'] } } });
    expect(highlight).toHaveBeenLastCalledWith({ caseIds: ['case-1', 'case-2'], origin: DASHBOARD_COMPONENT_NAME.MAP });

    triggerChartEvent(chart, 'mouseout', {});
    expect(highlight).toHaveBeenLastCalledWith({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.MAP });
  });

  it('ignores hover events that carry no case data', async () => {
    const { highlight } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();

    triggerChartEvent(chart, 'mouseover', {});
    expect(highlight).not.toHaveBeenCalled();
  });

  it('shows the region context menu on mouse up and filters on the focussed region', async () => {
    const { dashboardStore, screen } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();

    triggerChartEvent(chart, 'mouseup', {
      data: { genEpixData: { caseIds: ['case-1'], regionId: REGION_ONE.id } },
      event: { event: new MouseEvent('mouseup', { clientX: 100, clientY: 100 }) },
    });
    const filterMenuItem = screen.getByRole('menuitem', { exact: true, name: 'Filter (show only Region one)' });
    await expect.element(filterMenuItem).toBeVisible();
    await userEvent.click(filterMenuItem.element());

    await vi.waitFor(() => {
      expect(dashboardStore.getState().filters.find((filter) => filter.id === GEO_COL_ID)?.filterValue).toEqual([REGION_ONE.id]);
    });
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Filter (show only Region one)' })).not.toBeInTheDocument();
  });

  it('closes the region context menu without a filter item when the region is unknown', async () => {
    const { screen } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();

    triggerChartEvent(chart, 'mouseup', {
      data: { genEpixData: { caseIds: ['case-1'], regionId: 'region-unknown' } },
      event: { event: new MouseEvent('mouseup', { clientX: 100, clientY: 100 }) },
    });
    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByText('Map: Region', { exact: true })).toBeInTheDocument();
    await expect.poll(() => document.querySelectorAll('[role="menuitem"]').length).toBe(0);
  });

  it('dispatches an empty highlight for highlighted case ids that are not on the map', async () => {
    const { dashboardContext } = await renderMapWidget({ columnId: GEO_COL_ID });
    const chart = await getMapChart();
    const dispatchSpy = vi.spyOn(chart, 'dispatchAction');

    dashboardContext.highlightSubject.next({ caseIds: ['case-unknown'], origin: 'OTHER' });
    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith({ dataIndex: [], seriesIndex: [], type: 'highlight' });
    });
  });
});
