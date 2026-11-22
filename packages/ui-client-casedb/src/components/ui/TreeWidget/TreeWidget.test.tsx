import {
  CaseDbColType,
  CaseDbSeqDistanceType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbGeneticDistanceProtocol,
  CaseDbRefCol,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';
import { ErrorBoundary } from 'react-error-boundary';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';

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
  createDashboardCompleteCaseType,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';

import { TreeWidget } from './TreeWidget';

const STORAGE_NAME_POST_FIX_PREFIX = 'tree-widget-test';
const TREE_PATH = '/v1/calculate/phylogenetic_tree';
const SNP_COL_ID = 'col-gd-snp';
const MLVA_COL_ID = 'col-gd-mlva';
const SNP_COL_LABEL = 'SNP distance';
const MLVA_COL_LABEL = 'MLVA distance';
const SNP_PROTOCOL_NAME = 'SNP protocol';
const MLVA_PROTOCOL_NAME = 'MLVA protocol';
const NJ_ALGORITHM_NAME = 'NJ algorithm';
const UPGMA_ALGORITHM_NAME = 'UPGMA algorithm';
const VALID_NEWICK = '(row-a:1,row-b:2);';
const EMPTY_NEWICK = '();';
const TREE_FIGURE_NAME = `Figure of a phylogenetic tree belonging to ${SNP_COL_LABEL}. Generated using ${SNP_PROTOCOL_NAME} and ${NJ_ALGORITHM_NAME}.`;
const MLVA_TREE_FIGURE_NAME = `Figure of a phylogenetic tree belonging to ${MLVA_COL_LABEL}. Generated using ${MLVA_PROTOCOL_NAME} and ${UPGMA_ALGORITHM_NAME}.`;
const SNP_CONFIGURATION_LABEL = `${SNP_PROTOCOL_NAME} - ${NJ_ALGORITHM_NAME}`;
const MLVA_CONFIGURATION_LABEL = `${MLVA_PROTOCOL_NAME} - ${UPGMA_ALGORITHM_NAME}`;
const TWO_CASES = [createDashboardCase({ content: {}, id: 'row-a' }), createDashboardCase({ content: {}, id: 'row-b' })];

const createTreeAlgorithm = (code: string): CaseDbTreeAlgorithm => ({
  code,
  id: `tree-algorithm-${code}`,
  is_ultrametric: false,
  name: `${code} algorithm`,
  seqdb_tree_algorithm_id: `seqdb-tree-algorithm-${code}`,
  tree_algorithm_class_id: `tree-algorithm-class-${code}`,
} as CaseDbTreeAlgorithm);

const createTreeCompleteCaseType = (props: Partial<CaseDbCompleteCaseType['props']> = {}): CaseDbCompleteCaseType => {
  const baseCaseType = createDashboardCompleteCaseType({ props: { read_max_n_cases: 1000, read_max_tree_size: 100, ...props } as CaseDbCompleteCaseType['props'] });
  const dimId = baseCaseType.ordered_dim_ids[0];
  const refDimId = baseCaseType.dims[dimId].ref_dim_id;
  const createGeneticDistanceCol = (id: string, label: string, refColId: string, treeAlgorithmCode: string): CaseDbCol => ({
    case_type_id: baseCaseType.id,
    code: id,
    dim_id: dimId,
    id,
    label,
    rank: 2,
    ref_col_id: refColId,
    tree_algorithm_codes: [treeAlgorithmCode],
  } as CaseDbCol);
  const snpCol = createGeneticDistanceCol(SNP_COL_ID, SNP_COL_LABEL, 'ref-col-gd-snp', 'NJ');
  const mlvaCol = createGeneticDistanceCol(MLVA_COL_ID, MLVA_COL_LABEL, 'ref-col-gd-mlva', 'UPGMA');
  const refCols: Record<string, CaseDbRefCol> = {
    ...baseCaseType.ref_cols,
    'ref-col-gd-mlva': { code: 'gd_mlva', col_type: CaseDbColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp-mlva', label: MLVA_COL_LABEL, ref_dim_id: refDimId },
    'ref-col-gd-snp': { code: 'gd_snp', col_type: CaseDbColType.GENETIC_DISTANCE, genetic_distance_protocol_id: 'gdp-snp', label: SNP_COL_LABEL, ref_dim_id: refDimId },
  };
  const snpProtocol: CaseDbGeneticDistanceProtocol = {
    id: 'gdp-snp',
    min_scale_unit: 1,
    name: SNP_PROTOCOL_NAME,
    seqdb_is_integer_distance: true,
    seqdb_max_stored_distance: 5,
    seqdb_seq_distance_protocol_id: 'seqdb-protocol-snp',
    seqdb_seq_distance_type: CaseDbSeqDistanceType.SNP_HAMMING,
  };
  const mlvaProtocol: CaseDbGeneticDistanceProtocol = {
    id: 'gdp-mlva',
    min_scale_unit: 1,
    name: MLVA_PROTOCOL_NAME,
    seqdb_is_integer_distance: true,
    seqdb_max_stored_distance: 5,
    seqdb_seq_distance_protocol_id: 'seqdb-protocol-mlva',
    seqdb_seq_distance_type: CaseDbSeqDistanceType.MLVA_HAMMING,
  };
  const treeAlgorithms: Record<string, CaseDbTreeAlgorithm> = {
    NJ: createTreeAlgorithm('NJ'),
    UPGMA: createTreeAlgorithm('UPGMA'),
  };

  return createDashboardCompleteCaseType({
    cols: { ...baseCaseType.cols, [SNP_COL_ID]: snpCol, [MLVA_COL_ID]: mlvaCol },
    genetic_distance_protocols: { 'gdp-mlva': mlvaProtocol, 'gdp-snp': snpProtocol },
    ordered_col_ids: [...baseCaseType.ordered_col_ids, SNP_COL_ID, MLVA_COL_ID],
    ordered_col_ids_by_dim: { ...baseCaseType.ordered_col_ids_by_dim, [dimId]: [...baseCaseType.ordered_col_ids, SNP_COL_ID, MLVA_COL_ID] },
    props: { read_max_n_cases: 1000, read_max_tree_size: 100, ...props } as CaseDbCompleteCaseType['props'],
    ref_cols: refCols,
    tree_algorithms: treeAlgorithms,
  });
};

const createDashboardContextValue = (): DashboardContextValue => ({
  highlight: vi.fn(),
  highlightSubject: new Subject<Highlighting>({ caseIds: [], origin: null }),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;
let storageCounter = 0;
let requestBodies: Record<string, unknown>[];

type TreeResponder = (body: Record<string, unknown>) => Promise<Response> | Response;

const defaultTreeResponder: TreeResponder = (body) => {
  const protocolId = body.genetic_distance_col_id === MLVA_COL_ID ? 'gdp-mlva' : 'gdp-snp';
  return Response.json({ newick_repr: VALID_NEWICK, protocol_id: protocolId });
};

type RenderTreeWidgetOptions = {
  cases?: CaseDbCase[];
  completeCaseType?: CaseDbCompleteCaseType;
  treeResponder?: TreeResponder;
};

const renderTreeWidget = async ({
  cases = TWO_CASES,
  completeCaseType = createTreeCompleteCaseType(),
  treeResponder = defaultTreeResponder,
}: RenderTreeWidgetOptions = {}) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  storageCounter += 1;
  const storageNamePostFix = `${STORAGE_NAME_POST_FIX_PREFIX}-${storageCounter}`;
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType,
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;

  requestBodies = [];
  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: cases.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(cases));
  mockApiRequest('POST', TREE_PATH, async (request) => {
    const body = await request.json() as Record<string, unknown>;
    requestBodies.push(body);
    return treeResponder(body);
  });

  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();

  const dashboardContext = createDashboardContextValue();
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardStoreContext value={dashboardStore}>
        <DashboardContext value={dashboardContext}>
          <div style={{ height: 600, width: 800 }}>
            <ErrorBoundary fallbackRender={({ error }) => <div>{(error as Error).message}</div>}>
              <TreeWidget />
            </ErrorBoundary>
          </div>
        </DashboardContext>
      </DashboardStoreContext>
    </UserProfileStoreContext>,
  );
  return { dashboardContext, dashboardStore, screen, storageNamePostFix };
};

describe('TreeWidget', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    for (let index = 1; index <= storageCounter; index += 1) {
      const storageNamePostFix = `${STORAGE_NAME_POST_FIX_PREFIX}-${index}`;
      localStorage.removeItem(`GENEPIX-TableStore-${storageNamePostFix}`);
      localStorage.removeItem(`GENEPIX-TableStore-epiDashboardStoreLoader-${storageNamePostFix}`);
    }
  });

  it('renders the phylogenetic tree for the default configuration', async () => {
    const { screen } = await renderTreeWidget();

    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: `Tree: ${SNP_CONFIGURATION_LABEL}` })).toBeInTheDocument();
    expect(requestBodies).toEqual([
      expect.objectContaining({
        case_ids: ['row-a', 'row-b'],
        genetic_distance_col_id: SNP_COL_ID,
        tree_algorithm_code: 'NJ',
      }),
    ]);
  });

  it('shows the loading spinner while the tree is being generated', async () => {
    let releaseTree: (response: Response) => void = () => undefined;
    const pendingTree = new Promise<Response>((resolve) => {
      releaseTree = resolve;
    });
    const { screen } = await renderTreeWidget({
      treeResponder: async () => pendingTree,
    });

    await expect.element(screen.getByRole('status').getByText('Loading')).toBeInTheDocument();

    releaseTree(Response.json({ newick_repr: VALID_NEWICK, protocol_id: 'gdp-snp' }));

    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();
  });

  it('shows a notice when there are not enough sequences for a tree', async () => {
    const { screen } = await renderTreeWidget({ cases: [TWO_CASES[0]] });

    await expect.element(screen.getByText('not enough sequences', { exact: false })).toBeInTheDocument();
    expect(requestBodies).toHaveLength(0);
  });

  it('shows a notice when the tree could not be generated', async () => {
    const { screen } = await renderTreeWidget({
      treeResponder: () => Response.json({ newick_repr: EMPTY_NEWICK, protocol_id: 'gdp-snp' }),
    });

    await expect.element(screen.getByText('could not be generated', { exact: false })).toBeInTheDocument();
  });

  it('shows a notice with a refine filters action when there are too many cases', async () => {
    const { screen } = await renderTreeWidget({
      completeCaseType: createTreeCompleteCaseType({ read_max_tree_size: 1 }),
    });
    const openFiltersMenuListener = vi.fn();
    const eventBus = container.resolve(EventBusService);
    eventBus.addEventListener('openFiltersMenu', openFiltersMenuListener);

    await expect.element(screen.getByText('exceeds the maximum allowed number of cases', { exact: false })).toBeInTheDocument();
    expect(requestBodies).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Refine filters' }).element());
    expect(openFiltersMenuListener).toHaveBeenCalledTimes(1);
    eventBus.removeEventListener('openFiltersMenu', openFiltersMenuListener);
  });

  it('shows the unavailable state when the tree request fails', async () => {
    const { screen } = await renderTreeWidget({
      treeResponder: () => new Response('server error', { status: 500 }),
    });

    await vi.waitFor(() => {
      expect(requestBodies).toHaveLength(1);
    });
    await expect.poll(() => document.querySelector('[role="figure"]')).toBeNull();
    await expect.element(screen.getByRole('button', { name: `Tree: ${SNP_CONFIGURATION_LABEL}` })).toBeInTheDocument();
  });

  it('shows the widget without a tree configuration when no tree algorithms are available', async () => {
    const { screen } = await renderTreeWidget({
      completeCaseType: createDashboardCompleteCaseType(),
    });

    await expect.element(screen.getByText('Tree', { exact: true })).toBeInTheDocument();
    expect(requestBodies).toHaveLength(0);
  });

  it('switches the tree configuration through the title menu', async () => {
    const { screen } = await renderTreeWidget();

    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: `Tree: ${SNP_CONFIGURATION_LABEL}` }).element());
    await userEvent.click(screen.getByRole('menuitem', { name: MLVA_CONFIGURATION_LABEL }).element());

    await expect.element(screen.getByRole('figure', { name: MLVA_TREE_FIGURE_NAME })).toBeInTheDocument();
    expect(requestBodies.at(-1)).toEqual(expect.objectContaining({
      genetic_distance_col_id: MLVA_COL_ID,
      tree_algorithm_code: 'UPGMA',
    }));
  });

  it('emits download options for the tree and runs the export actions', async () => {
    const { screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    const eventBus = container.resolve(EventBusService);
    const downloadOptionsListener = vi.fn();
    eventBus.addEventListener('onDownloadOptionsChanged', downloadOptionsListener);
    eventBus.emit('onDownloadOptionsRequested');

    await vi.waitFor(() => {
      expect(downloadOptionsListener).toHaveBeenCalled();
    });
    const payload = downloadOptionsListener.mock.lastCall?.[0] as { disabled: boolean; items: { callback: () => void; label: string }[]; zone: string };
    expect(payload.zone).toBe(DASHBOARD_COMPONENT_NAME.TREE);
    expect(payload.disabled).toBe(false);
    expect(payload.items.map((item) => item.label)).toEqual(['Save as Newick', 'Save as JPEG', 'Save as PNG']);

    payload.items[0].callback();
    payload.items[2].callback();

    await screen.unmount();
    expect(downloadOptionsListener).toHaveBeenLastCalledWith(expect.objectContaining({ items: null, zone: DASHBOARD_COMPONENT_NAME.TREE }));
    eventBus.removeEventListener('onDownloadOptionsChanged', downloadOptionsListener);
  });

  it('toggles the link between the tree and the line list', async () => {
    const { screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    const linkToggle = screen.getByRole('button', { name: /Tree and Line List/ });
    await expect.element(linkToggle).toBeInTheDocument();
    const initialLabel = linkToggle.element().getAttribute('aria-label');
    await userEvent.click(linkToggle.element());

    await expect.poll(() => screen.getByRole('button', { name: /Tree and Line List/ }).element().getAttribute('aria-label')).not.toBe(initialLabel);
  });

  it('unlinks and links the tree through event bus events', async () => {
    const { screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();
    const eventBus = container.resolve(EventBusService);

    eventBus.emit('onUnlinkLineListAndTree', { userInitiated: false });
    await expect.element(screen.getByRole('button', { name: 'Link Tree and Line List' })).toBeInTheDocument();

    eventBus.emit('onLinkLineListAndTree');
    await expect.element(screen.getByRole('button', { name: 'Unlink Tree and Line List' })).toBeInTheDocument();
  });

  it('disables the tree filter actions without an active tree filter', async () => {
    const { screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    await expect.element(screen.getByRole('button', { name: 'Remove tree filter' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Change tree filter to nearest ancestor' })).toBeDisabled();
  });

  it('steps out of an active tree filter to the tree root from the primary menu', async () => {
    const { dashboardStore, screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    await dashboardStore.getState().addTreeFilter('row-a');
    await expect.element(screen.getByRole('button', { name: 'Remove tree filter' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Change tree filter to nearest ancestor' }).element());

    await expect.element(screen.getByRole('button', { name: 'Remove tree filter' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Change tree filter to nearest ancestor' })).toBeDisabled();
  });

  it('removes an active tree filter from the primary menu', async () => {
    const { dashboardStore, screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    await dashboardStore.getState().addTreeFilter('row-a');
    await expect.element(screen.getByRole('button', { name: 'Remove tree filter' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Remove tree filter' }).element());

    await expect.element(screen.getByRole('button', { name: 'Remove tree filter' })).toBeDisabled();
  });

  it('forwards highlights from other widgets to the tree without echoing them back', async () => {
    const { dashboardContext, screen } = await renderTreeWidget();
    await expect.element(screen.getByRole('figure', { name: TREE_FIGURE_NAME })).toBeInTheDocument();

    dashboardContext.highlightSubject.next({ caseIds: ['row-a'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });
    dashboardContext.highlightSubject.next({ caseIds: ['row-a'], origin: DASHBOARD_COMPONENT_NAME.TREE });

    expect(dashboardContext.highlight).not.toHaveBeenCalled();
  });
});
