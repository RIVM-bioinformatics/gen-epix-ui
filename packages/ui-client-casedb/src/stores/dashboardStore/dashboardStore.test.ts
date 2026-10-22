import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import {
  CaseDbCaseApi,
  CaseDbSeqDistanceType,
  CaseDbTreeAlgorithmType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCaseQuery,
  CaseDbCaseQueryResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbGeneticDistanceProtocol,
  CaseDbPhylogeneticTree,
  CaseDbRefCol,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { AxiosUtil } from '@gen-epix/ui-client-common/utils/AxiosUtil';
import { FILTER_MODE } from '@gen-epix/ui-client-common/classes/abstracts/FilterAbstract';
import { TextFilter } from '@gen-epix/ui-client-common/classes/filters';
import { TreeUtil } from '@gen-epix/ui-phylogenetic-tree/utils/TreeUtil';
import { NewickUtil } from '@gen-epix/ui-phylogenetic-tree/utils/NewickUtil';
import type { TreeNode } from '@gen-epix/ui-phylogenetic-tree/models/tree.models';

import { StratificationUtil } from '../../utils/StratificationUtil';
import { CASEDB_QUERY_KEY } from '../../constants/query.constants';
import { DASHBOARD_COMPONENT_NAME } from '../../constants/dashboard.constants';
import { CaseDbStandardConfigUtil } from '../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../theme/demoTheme';
import type { CaseDbConfig } from '../../models/config.models';
import {
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../../utils/CaseTypeUtil';
import type { FindSimilarCasesResult } from '../../models/case-db.models';
import type { TreeConfiguration } from '../../models/dashboard.models';
import type {
  StratifiableColumn,
  Stratification,
} from '../../models/stratification.models';
import { STRATIFICATION_MODE } from '../../models/stratification.models';

import { createDashboardStore as createDashboardStoreImplementation } from './dashboardStore';

const completeCaseType: CaseDbCompleteCaseType = {
  case_date_dim_id: null,
  case_type_access_abacs: {},
  case_type_share_abacs: {},
  cols: {},
  dims: {},
  etiological_agents: {},
  etiologies: {},
  genetic_distance_protocols: {
    'protocol-1': {
      min_scale_unit: 1,
      name: 'Protocol one',
      seqdb_is_integer_distance: true,
      seqdb_max_stored_distance: 10,
      seqdb_seq_distance_protocol_id: 'seq-protocol-1',
      seqdb_seq_distance_type: CaseDbSeqDistanceType.SNP_HAMMING,
    },
  },
  id: 'case-type-1',
  name: 'Case type one',
  ordered_col_ids: [],
  ordered_col_ids_by_dim: {},
  ordered_dim_ids: [],
  ref_cols: {},
  ref_dims: {},
  tree_algorithms: {},
  user_id: null,
};

const createCase = (id: string): CaseDbCase => ({
  case_type_id: completeCaseType.id,
  id,
} as CaseDbCase);

const createColumn = (): CaseDbCol => ({
  case_type_id: completeCaseType.id,
  code: 'column-1',
  dim_id: 'dimension-1',
  id: 'column-1',
  label: 'Column one',
  rank: 1,
  ref_col_id: 'reference-column-1',
});

const createTreeNode = (name: string): TreeNode => ({
  children: [],
  name,
  subTreeLeaveNames: [name],
  subTreeNames: [name],
});

const createTreeConfiguration = (): TreeConfiguration => ({
  col: createColumn(),
  computedId: 'tree-column',
  geneticDistanceProtocol: {} as unknown as CaseDbGeneticDistanceProtocol,
  refCol: {} as unknown as CaseDbRefCol,
  treeAlgorithm: { code: 'NJ' } as unknown as CaseDbTreeAlgorithm,
});

const createFieldStratification = (col: CaseDbCol): Stratification => ({
  caseIdColors: {},
  col,
  colorForIsMissing: '#000000',
  mode: STRATIFICATION_MODE.FIELD,
});

const createStratification = (mode: STRATIFICATION_MODE): Stratification => ({
  ...createFieldStratification(createColumn()),
  mode,
});

const prepareTree = (store: ReturnType<typeof createDashboardStoreImplementation>, tree = createTreeNode('root')): TreeNode => {
  store.getState().updateWidgetDataPersistable(DASHBOARD_COMPONENT_NAME.TREE, {
    treeConfiguration: createTreeConfiguration(),
  });
  store.setState({
    tree,
    treeResponse: tree,
  });
  vi.spyOn(TreeUtil, 'createTreeAddresses').mockReturnValue({});
  return tree;
};

const createCaseQueryResult = (
  caseQuery: CaseDbCaseQuery,
  caseIds: string[] = [],
  isMaxResultsExceeded = false,
): CaseDbCaseQueryResult => ({
  case_ids: caseIds,
  case_query: caseQuery,
  is_max_results_exceeded: isMaxResultsExceeded,
});

type Deferred<T> = {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
};

let storageSequence = 0;
const cleanups: Array<() => void> = [];

const createDashboardHarness = (caseSetId = 'case-set-1') => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const retrieveCaseIdsByQuery = vi.fn(async (query: CaseDbCaseQuery, _options: { signal: AbortSignal }) => Promise.resolve({
    data: createCaseQueryResult(query),
  }));
  const retrieveCasesByIds = vi.fn(async (_request: unknown, _options: { signal: AbortSignal }) => Promise.resolve({ data: [] as CaseDbCase[] }));
  const config: CaseDbConfig = {
    ...CaseDbStandardConfigUtil.createConfig(),
    theme: createCaseDbDemoTheme('light'),
  };
  const storageNamePostFix = `dashboard-store-test-${++storageSequence}`;

  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(CaseDbCaseApi, { retrieveCaseIdsByQuery, retrieveCasesByIds } as unknown as CaseDbCaseApi);

  const store = createDashboardStoreImplementation({
    caseSetId,
    completeCaseType,
    config,
    idSelectorCallback: row => row.id,
    storageNamePostFix,
    storageVersion: 1,
  });

  const dispose = () => {
    store.getState().destroy();
    queryClientService.queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-${storageNamePostFix}`);
  };
  cleanups.push(dispose);

  return {
    config,
    queryClientService,
    retrieveCaseIdsByQuery,
    retrieveCasesByIds,
    store,
  };
};

afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup());
  vi.restoreAllMocks();
});

describe('createDashboardStore', () => {
  it('initializes state and keeps widget defaults independent', () => {
    const { config, store } = createDashboardHarness();
    const initialState = store.getState();

    expect(initialState.caseSetId).toBe('case-set-1');
    expect(initialState.completeCaseType).toBe(completeCaseType);
    expect(initialState.dataContext).toBe(completeCaseType);
    expect(initialState.numVisibleAttributesInSummary).toBe(config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY);
    expect(initialState.filters.map(filter => filter.id)).toEqual(['selected', 'sequence_id']);
    expect(initialState.frontendFilterPriorities).toEqual([SELECTION_FILTER_GROUP, TREE_FILTER_GROUP]);
    expect(initialState.widgetData[DASHBOARD_COMPONENT_NAME.MAP]).toEqual(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.MAP].dataDefaultValues);
    expect(initialState.widgetDataPersistable[DASHBOARD_COMPONENT_NAME.TREE]).toEqual(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.TREE].dataPersistableDefaultValues);
    expect(initialState.widgetData[DASHBOARD_COMPONENT_NAME.MAP]).not.toBe(initialState.widgetDataPersistable[DASHBOARD_COMPONENT_NAME.MAP]);
  });

  it('updates widget data, persisted widget data, zone, and summary visibility', () => {
    const { config, store } = createDashboardHarness();
    const state = store.getState();

    state.expandZone('north');
    state.setNumVisibleAttributesInSummary(3);
    state.updateWidgetData(DASHBOARD_COMPONENT_NAME.MAP, { columnId: 'col-1' });
    state.updateWidgetDataPersistable(DASHBOARD_COMPONENT_NAME.TREE, { treeConfiguration: { col: { id: 'col-1' } } });

    expect(store.getState().expandedZone).toBe('north');
    expect(store.getState().numVisibleAttributesInSummary).toBe(3);
    expect(store.getState().getWidgetData<{ columnId: string }>(DASHBOARD_COMPONENT_NAME.MAP)).toMatchObject({ columnId: 'col-1' });
    expect(store.getState().getWidgetDataPersistable<{ treeConfiguration: { col: { id: string } } }>(DASHBOARD_COMPONENT_NAME.TREE)).toMatchObject({
      treeConfiguration: { col: { id: 'col-1' } },
    });
    expect(config.dashboard.WIDGETS[DASHBOARD_COMPONENT_NAME.MAP].dataDefaultValues).toEqual({ columnId: null, dimensionId: null });
  });
});

describe('dashboard data and filters', () => {
  it('mutates a cached case without changing other cases', () => {
    const { queryClientService, store } = createDashboardHarness();
    const firstCase = createCase('case-1');
    const secondCase = createCase('case-2');
    const cacheKey = queryClientService.getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY);
    queryClientService.queryClient.setQueryData(cacheKey, [firstCase, secondCase]);
    const replacement = { ...firstCase, name: 'Updated' } as CaseDbCase;

    store.getState().mutateCachedCase('case-1', replacement);

    expect(queryClientService.queryClient.getQueryData(cacheKey)).toEqual([replacement, secondCase]);
  });

  it('filters selected rows and returns the original data for an initial selection', () => {
    const { store } = createDashboardHarness();
    const rows = [createCase('case-1'), createCase('case-2')];
    const selectionFilter = store.getState().filters.find(filter => filter.id === 'selected');

    selectionFilter.filterValue = ['case-2'];
    expect(store.getState().reloadFilterPriorityData(SELECTION_FILTER_GROUP, rows)).toEqual([rows[1]]);

    selectionFilter.filterValue = [];
    expect(store.getState().reloadFilterPriorityData(SELECTION_FILTER_GROUP, rows)).toBe(rows);
    expect(() => store.getState().reloadFilterPriorityData('unknown', rows)).toThrow('Unknown filter group: unknown');
  });

  it('filters tree leaves and retains rows while the tree filter is initial', () => {
    const { store } = createDashboardHarness();
    const rows = [createCase('case-1'), createCase('case-2')];
    const root = createTreeNode('root');
    store.setState({ tree: { ...root, subTreeLeaveNames: ['case-2'] } });
    const reloadTree = vi.spyOn(store.getState(), 'reloadTree').mockImplementation(() => undefined);
    const treeFilter = store.getState().filters.find(filter => filter.id === 'sequence_id');

    expect(store.getState().reloadFilterPriorityData(TREE_FILTER_GROUP, rows)).toBe(rows);
    treeFilter.filterValue = 'root';
    expect(store.getState().reloadFilterPriorityData(TREE_FILTER_GROUP, rows)).toEqual([rows[1]]);
    expect(reloadTree).toHaveBeenCalledTimes(2);
  });

  it('clears field stratification when its column is disabled', () => {
    const { store } = createDashboardHarness();
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');
    const col = createColumn();

    store.setState({
      stratification: createFieldStratification(col),
      stratifyableColumns: [{ col, enabled: false } satisfies StratifiableColumn],
    });
    store.getState().reloadFieldStratification();

    expect(showNotification).toHaveBeenCalledOnce();
    expect(store.getState().stratification).toBeNull();

    store.setState({
      stratification: createFieldStratification(col),
      stratifyableColumns: [{ col, enabled: true }],
    });
    store.getState().reloadFieldStratification();
    expect(showNotification).toHaveBeenCalledOnce();
  });

  it('adds and removes a tree filter and resets tree addresses', async () => {
    const { store } = createDashboardHarness();
    const root = prepareTree(store);
    vi.spyOn(TreeUtil, 'findNewTreeRoot').mockReturnValue(root);

    await store.getState().addTreeFilter('leaf-1');
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBe('leaf-1');

    store.setState({
      treeAddresses: {
        'column-1': {
          addresses: { root: '0' },
          algorithmCode: 'NJ',
        },
      },
    });
    store.getState().resetTreeAddresses();
    expect(store.getState().treeAddresses).toEqual({});

    await store.getState().removeTreeFilter();
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
    await store.getState().removeTreeFilter();
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
  });

  it('steps a tree filter out to its parent node', async () => {
    const { store } = createDashboardHarness();
    const root = prepareTree(store);
    const parent = createTreeNode('parent');
    const findNewTreeRoot = vi.spyOn(TreeUtil, 'findNewTreeRoot').mockImplementation((_tree, nodeName, selector) => {
      if (selector === 'parent' || nodeName === 'parent') {
        return parent;
      }
      return root;
    });
    await store.getState().setFilterValue('sequence_id', 'leaf');

    await store.getState().treeFilterStepOut();

    expect(findNewTreeRoot).toHaveBeenCalledWith(root, 'leaf', 'parent');
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBe('parent');
    expect(store.getState().treeAddresses).toMatchObject({
      'column-1': { algorithmCode: 'NJ' },
    });

    await store.getState().setFilterValue('sequence_id', 'leaf');
    findNewTreeRoot.mockReturnValue(root);
    await store.getState().treeFilterStepOut();
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
  });

  it('removes an unchanged tree filter but keeps a changed tree filter value', async () => {
    const { store } = createDashboardHarness();
    const root = prepareTree(store);
    vi.spyOn(TreeUtil, 'findNewTreeRoot').mockReturnValue(root);
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');

    await store.getState().setFilterValue('sequence_id', 'node-1');
    await store.getState().setFilterValues({
      selected: [],
      sequence_id: 'node-1',
    });
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
    expect(showNotification).toHaveBeenCalledOnce();

    await store.getState().setFilterValue('sequence_id', 'node-1');
    await store.getState().setFilterValues({
      selected: [],
      sequence_id: 'node-2',
    });
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBe('node-2');
    expect(showNotification).toHaveBeenCalledOnce();
  });

  it('removes tree filtering from similar-case results and reapplies similar-case stratification', async () => {
    const { store } = createDashboardHarness();
    const root = prepareTree(store);
    vi.spyOn(TreeUtil, 'findNewTreeRoot').mockReturnValue(root);
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');
    const similarCaseResults: FindSimilarCasesResult[] = [{
      colId: 'column-1',
      distance: 1,
      key: 'similar-cases',
      originalCaseIds: ['case-1'],
      similarCaseIds: ['case-2'],
    }];
    store.setState({
      globalAbortSignal: new AbortController().signal,
      stratification: createStratification(STRATIFICATION_MODE.SIMILAR_CASES),
    });
    const treeFilter = store.getState().filters.find(filter => filter.id === 'sequence_id');
    treeFilter.filterValue = 'leaf';
    const stratify = vi.spyOn(store.getState(), 'stratify').mockImplementation(() => undefined);

    await store.getState().setFindSimilarCasesResults(similarCaseResults);

    expect(store.getState().findSimilarCasesResults).toEqual(similarCaseResults);
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
    expect(showNotification).toHaveBeenCalledOnce();
    expect(stratify).toHaveBeenCalledWith(STRATIFICATION_MODE.SIMILAR_CASES);
  });

  it('sets similar-case results without removing an initial tree filter', async () => {
    const { store } = createDashboardHarness();
    store.setState({ globalAbortSignal: new AbortController().signal });
    const notificationService = container.resolve(NotificationService);
    const showNotification = vi.spyOn(notificationService, 'showNotification');
    const stratify = vi.spyOn(store.getState(), 'stratify').mockImplementation(() => undefined);
    const similarCaseResults: FindSimilarCasesResult[] = [];

    await store.getState().setFindSimilarCasesResults(similarCaseResults);

    expect(store.getState().findSimilarCasesResults).toEqual([]);
    expect(store.getState().filters.find(filter => filter.id === 'sequence_id')?.filterValue).toBeNull();
    expect(showNotification).not.toHaveBeenCalled();
    expect(stratify).not.toHaveBeenCalled();
  });

  it('applies selection stratification according to selected IDs and current mode', () => {
    const { store } = createDashboardHarness();
    const stratify = vi.spyOn(store.getState(), 'stratify').mockImplementation(() => undefined);

    store.getState().setSelectedIds(['case-1']);
    expect(stratify).toHaveBeenLastCalledWith(STRATIFICATION_MODE.SELECTION);

    store.setState({ stratification: createStratification(STRATIFICATION_MODE.FIELD) });
    stratify.mockClear();
    store.getState().setSelectedIds(['case-2']);
    expect(stratify).not.toHaveBeenCalled();

    store.getState().setSelectedIds([]);
    expect(stratify).not.toHaveBeenCalled();

    store.setState({ stratification: createStratification(STRATIFICATION_MODE.SELECTION) });
    store.getState().setSelectedIds([]);
    expect(stratify).toHaveBeenLastCalledWith(null);
  });

  it('delegates stratification using current tree, selection, and data state', () => {
    const { store } = createDashboardHarness();
    const getStratification = vi.spyOn(StratificationUtil, 'getStratification').mockReturnValue(null);
    store.setState({
      findSimilarCasesResults: [{
        colId: 'column-1',
        distance: 1,
        key: 'similar-cases',
        originalCaseIds: ['case-1'],
        similarCaseIds: ['case-2'],
      }],
      selectedIds: ['case-1'],
      sortedData: [createCase('case-1')],
    });

    store.getState().stratify(STRATIFICATION_MODE.SELECTION, createColumn());

    expect(getStratification.mock.calls[0]?.[0]).toMatchObject({
      completeCaseType,
      mode: STRATIFICATION_MODE.SELECTION,
      selectedIds: ['case-1'],
      similarCaseIds: ['case-2'],
      sortedData: [createCase('case-1')],
    });
    expect(getStratification.mock.calls[0]?.[0].col?.id).toBe('column-1');
  });

  it('updates the tree when a phylogenetic tree is returned', () => {
    const { store } = createDashboardHarness();
    const parsedTree = createTreeNode('parsed');
    const sanitizedTree = createTreeNode('sanitized');
    store.getState().updateWidgetDataPersistable(DASHBOARD_COMPONENT_NAME.TREE, {
      treeConfiguration: createTreeConfiguration(),
    });
    const parse = vi.spyOn(NewickUtil, 'parse').mockReturnValue(parsedTree);
    const sanitizeTree = vi.spyOn(TreeUtil, 'sanitizeTree').mockReturnValue(sanitizedTree);
    const getSortedNames = vi.spyOn(NewickUtil, 'getSortedNames').mockReturnValue(['case-1', 'case-2']);
    vi.spyOn(TreeUtil, 'createTreeAddresses').mockReturnValue({});
    const response: CaseDbPhylogeneticTree = {
      newick_repr: '(case-1,case-2)root;',
      protocol_id: 'protocol-1',
      tree_algorithm_code: CaseDbTreeAlgorithmType.NJ,
    };

    store.getState().setPhylogeneticTreeResponse(response);

    expect(parse).toHaveBeenCalledWith(response.newick_repr);
    expect(sanitizeTree).toHaveBeenCalledWith(parsedTree, 10);
    expect(getSortedNames).toHaveBeenCalledWith(sanitizedTree);
    expect(store.getState().newick).toBe(response.newick_repr);
    expect(store.getState().sortedIds).toEqual(['case-1', 'case-2']);
    expect(store.getState().tree).toBe(sanitizedTree);
    expect(store.getState().treeResponse).toBe(sanitizedTree);
  });

  it.each(['', '  ', '();'])('clears tree state for an empty tree representation %j', (newick) => {
    const { store } = createDashboardHarness();
    const previousTree = createTreeNode('previous');
    store.setState({
      newick: 'previous-newick',
      sortedIds: ['case-1'],
      tree: previousTree,
      treeResponse: previousTree,
    });

    store.getState().setPhylogeneticTreeResponse({
      newick_repr: newick,
      tree_algorithm_code: CaseDbTreeAlgorithmType.NJ,
    });

    expect(store.getState().newick).toBe(newick);
    expect(store.getState().sortedIds).toEqual([]);
    expect(store.getState().tree).toBeNull();
    expect(store.getState().treeResponse).toBeNull();
  });

  it('ignores a repeated phylogenetic tree response', () => {
    const { store } = createDashboardHarness();
    const newick = '(case-1,case-2)root;';
    store.setState({ newick });
    const parse = vi.spyOn(NewickUtil, 'parse');

    store.getState().setPhylogeneticTreeResponse({
      newick_repr: newick,
      tree_algorithm_code: CaseDbTreeAlgorithmType.NJ,
    });

    expect(parse).not.toHaveBeenCalled();
  });

  it('loads missing cases and combines duplicate IDs from similar-case results', async () => {
    const { queryClientService, retrieveCaseIdsByQuery, retrieveCasesByIds, store } = createDashboardHarness();
    const globalAbortController = new AbortController();
    store.setState({
      findSimilarCasesResults: [{
        colId: 'col-1',
        distance: 1,
        key: 'similar-cases',
        originalCaseIds: ['case-1'],
        similarCaseIds: ['case-2', 'case-1'],
      } satisfies FindSimilarCasesResult],
      globalAbortSignal: globalAbortController.signal,
    });
    retrieveCaseIdsByQuery.mockResolvedValue({
      data: createCaseQueryResult({
        case_set_ids: ['case-set-1'],
        case_type_id: 'case-type-1',
        filter: undefined,
      }, ['case-1', 'case-1'], true),
    });
    retrieveCasesByIds.mockResolvedValue({
      data: [createCase('case-1'), createCase('case-2')],
    });

    await store.getState().fetchData();

    expect(retrieveCaseIdsByQuery.mock.calls[0]?.[0]).toEqual({
      case_set_ids: ['case-set-1'],
      case_type_id: 'case-type-1',
      filter: undefined,
    });
    expect(retrieveCaseIdsByQuery.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(retrieveCasesByIds.mock.calls[0]?.[0]).toEqual({
      case_ids: ['case-1', 'case-2'],
      case_type_id: 'case-type-1',
    });
    expect(retrieveCasesByIds.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(store.getState().baseData.map(item => item.id)).toEqual(['case-1', 'case-2']);
    expect(store.getState().isMaxResultsExceeded).toBe(true);
    expect(store.getState().isDataLoading).toBe(false);
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY))).toEqual([
      createCase('case-1'),
      createCase('case-2'),
    ]);
  });

  it('reuses cached query IDs and cached cases when no case set is selected', async () => {
    const { queryClientService, retrieveCaseIdsByQuery, retrieveCasesByIds, store } = createDashboardHarness('');
    const caseData = [createCase('case-1')];
    const query: CaseDbCaseQuery = {
      case_set_ids: undefined,
      case_type_id: 'case-type-1',
      filter: undefined,
    };
    const queryKey = [CASEDB_QUERY_KEY.CASE_IDS_BY_QUERY, 'case-type-1', JSON.stringify(query)];
    queryClientService.queryClient.setQueryData(queryKey, createCaseQueryResult(query, ['case-1']));
    queryClientService.queryClient.setQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY), caseData);
    store.setState({ globalAbortSignal: new AbortController().signal });

    await store.getState().fetchData();

    expect(retrieveCaseIdsByQuery).not.toHaveBeenCalled();
    expect(retrieveCasesByIds).not.toHaveBeenCalled();
    expect(store.getState().baseData).toEqual(caseData);
  });

  it('passes backend filters to the case-ID query', async () => {
    const { retrieveCaseIdsByQuery, store } = createDashboardHarness();
    const textFilter = new TextFilter({
      filterMode: FILTER_MODE.BACKEND,
      filterPriority: 'backend',
      id: 'text-filter',
      label: 'Text filter',
    });
    textFilter.filterValue = 'word';
    store.setState({
      filters: [...store.getState().filters, textFilter],
      globalAbortSignal: new AbortController().signal,
    });

    await store.getState().fetchData();

    expect(retrieveCaseIdsByQuery.mock.calls[0]?.[0].filter).toMatchObject({
      filters: [textFilter.toBackendFilter()],
      operator: 'AND',
      type: 'COMPOSITE',
    });
  });

  it('clears loading and exposes a current fetch error', async () => {
    const { retrieveCaseIdsByQuery, store } = createDashboardHarness();
    const error = new Error('Case query failed');
    retrieveCaseIdsByQuery.mockRejectedValue(error);
    store.setState({ globalAbortSignal: new AbortController().signal });

    await store.getState().fetchData();

    expect(store.getState().isDataLoading).toBe(false);
    expect(store.getState().dataError).toBe(error);
  });

  it('clears loading without exposing a cancelled current fetch as an error', async () => {
    const { retrieveCaseIdsByQuery, store } = createDashboardHarness();
    const cancellation = new Error('Cancelled');
    vi.spyOn(AxiosUtil, 'isAxiosCanceledError').mockReturnValue(true);
    retrieveCaseIdsByQuery.mockRejectedValue(cancellation);
    store.setState({ globalAbortSignal: new AbortController().signal });

    await store.getState().fetchData();

    expect(store.getState().isDataLoading).toBe(false);
    expect(store.getState().dataError).toBeNull();
  });

  it('aborts the active request when the global signal is aborted', async () => {
    const request = createDeferred<{ data: CaseDbCaseQueryResult }>();
    const { retrieveCaseIdsByQuery, store } = createDashboardHarness();
    const globalAbortController = new AbortController();
    retrieveCaseIdsByQuery.mockReturnValue(request.promise);
    store.setState({ globalAbortSignal: globalAbortController.signal });

    const fetchPromise = store.getState().fetchData();
    const fetchAbortController = store.getState().fetchAbortController;
    globalAbortController.abort();

    expect(fetchAbortController.signal.aborted).toBe(true);
    request.resolve({
      data: createCaseQueryResult({
        case_set_ids: ['case-set-1'],
        case_type_id: 'case-type-1',
        filter: undefined,
      }),
    });
    await fetchPromise;
  });

  it('does not let a superseded fetch clear the current loading state', async () => {
    const firstRequest = createDeferred<{ data: CaseDbCaseQueryResult }>();
    const secondRequest = createDeferred<{ data: CaseDbCaseQueryResult }>();
    const { retrieveCaseIdsByQuery, store } = createDashboardHarness();
    retrieveCaseIdsByQuery
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    store.setState({ globalAbortSignal: new AbortController().signal });

    const firstFetch = store.getState().fetchData();
    const firstController = store.getState().fetchAbortController;
    const secondFetch = store.getState().fetchData();
    expect(firstController.signal.aborted).toBe(true);
    firstRequest.reject(new Error('Superseded request failed'));

    await firstFetch;
    expect(store.getState().isDataLoading).toBe(true);

    secondRequest.resolve({
      data: createCaseQueryResult({
        case_set_ids: ['case-set-1'],
        case_type_id: 'case-type-1',
        filter: undefined,
      }),
    });
    await secondFetch;
    expect(store.getState().isDataLoading).toBe(false);
  });
});
