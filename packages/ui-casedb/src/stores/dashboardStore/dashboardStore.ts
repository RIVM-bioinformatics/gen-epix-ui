import { createStore } from 'zustand';
import { produce } from 'immer';
import { t } from 'i18next';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import last from 'lodash/last';
import { persist } from 'zustand/middleware';
import type {
  CaseDbCase,
  CaseDbCaseQuery,
  CaseDbCaseQueryResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbPhylogeneticTree,
  CaseDbTypedCompositeFilter,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  AxiosUtil,
  ConfigService,
  createTableStoreActions,
  createTableStoreInitialState,
  createTableStorePersistConfiguration,
  FILTER_MODE,
  NotificationService,
  ObjectUtil,
  QueryClientService,
} from '@gen-epix/ui';
import type {
  CreateTableStoreInitialStateKwArgs,
  CreateTableStoreKwArgs,
  FilterValues,
  TableStoreActions,
  TableStoreState,
} from '@gen-epix/ui';

import type {
  FindSimilarCasesResult,
  StratifiableColumn,
  Stratification,
  TreeConfiguration,
} from '../../models/caseDb';
import { STRATIFICATION_MODE } from '../../models/caseDb';
import type { TreeNode } from '../../models/tree';
import {
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../../utils/CaseTypeUtil';
import { FilterUtil } from '../../utils/FilterUtil';
import { NewickUtil } from '../../utils/NewickUtil';
import { TreeUtil } from '../../utils/TreeUtil';
import type { CaseDbConfig } from '../../models/config';
import { CASEDB_QUERY_KEY } from '../../data/query';
import { SelectionFilter } from '../../classes/filters/SelectionFilter';
import { TreeFilter } from '../../classes/filters/TreeFilter';
import { StratificationUtil } from '../../utils/StratificationUtil';

export interface CreateDashboardStoreInitialStateKwArgs extends CreateTableStoreInitialStateKwArgs<CaseDbCase, CaseDbCompleteCaseType> {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
}

export type CreateDashboardStoreKwArgs = {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
} & CreateTableStoreKwArgs<CaseDbCase, CaseDbCompleteCaseType>;

export type DashboardStore = DashboardStoreActions & DashboardStoreState;
interface DashboardStoreActions extends TableStoreActions<CaseDbCase, CaseDbCompleteCaseType> {
  addTreeFilter: (nodeId: string) => Promise<void>;
  destroy: () => void;
  expandZone: (zone: string) => void;
  mutateCachedCase: (caseId: string, item: CaseDbCase) => void;
  // Private
  reloadStratification: () => void;
  reloadStratifyableColumns: () => void;
  reloadTree: () => void;
  removeTreeFilter: () => Promise<void>;
  resetTreeAddresses: () => void;
  setFindSimilarCasesResults: (findSimilarCasesResults: FindSimilarCasesResult[]) => Promise<void>;
  setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => void;
  setPhylogeneticTreeResponse: (phylogeneticTree: CaseDbPhylogeneticTree) => void;
  stratify: (mode: STRATIFICATION_MODE, col?: CaseDbCol) => void;
  treeFilterStepOut: () => Promise<void>;
  updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => void;

  updateListWidgetData: (data: Partial<ListWidgetData>) => void;
  updateMapWidgetData: (data: Partial<MapWidgetData>) => void;
  updateTreeWidgetData: (data: Partial<TreeWidgetData>) => void;
}
interface DashboardStoreState extends TableStoreState<CaseDbCase, CaseDbCompleteCaseType> {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
  epiCurveWidgetData: EpiCurveWidgetData;
  expandedZone: string;
  findSimilarCasesResults: FindSimilarCasesResult[];
  isMaxResultsExceeded: boolean;
  isMaxResultsExceededDismissed: boolean;
  listWidgetData: ListWidgetData;
  mapWidgetData: MapWidgetData;
  newick: string;
  numVisibleAttributesInSummary: number;
  stratification: Stratification;
  stratifyableColumns: StratifiableColumn[];
  tree: TreeNode;
  treeAddresses: {
    [key: string]: {
      addresses: { [key: string]: string };
      algorithmCode: string;
    };
  };
  treeResponse: TreeNode;
  treeWidgetData: TreeWidgetData;
}
interface EpiCurveWidgetData extends WidgetData {
  columnId: string;
  dimensionId: string;
}

interface ListWidgetData extends WidgetData {
  visibleItemItemIndex: number;
}

interface MapWidgetData extends WidgetData {
  columnId: string;
  dimensionId: string;
}

interface TreeWidgetData extends WidgetData {
  horizontalScrollPosition: number;
  treeConfiguration: TreeConfiguration;
  verticalScrollPosition: number;
  zoomLevel: number;
}

interface WidgetData {
  isUnavailable: boolean;
}

const createWidgetDataInitialState = (): WidgetData => ({
  isUnavailable: false,
});

const createTreeWidgetDataInitialState = (): TreeWidgetData => ({
  ...createWidgetDataInitialState(),
  horizontalScrollPosition: 0,
  treeConfiguration: null,
  verticalScrollPosition: 0,
  zoomLevel: 1,
});

const createDashboardStoreInitialState = (kwArgs: CreateDashboardStoreInitialStateKwArgs): DashboardStoreState => {
  const { caseSetId, completeCaseType, ...createTableStoreInitialStateKwArgs } = kwArgs;

  return {
    ...createTableStoreInitialState<CaseDbCase, CaseDbCompleteCaseType>(createTableStoreInitialStateKwArgs),
    caseSetId,
    completeCaseType,
    dataContext: completeCaseType,
    epiCurveWidgetData: {
      ...createWidgetDataInitialState(),
      columnId: null,
      dimensionId: null,
    },
    expandedZone: null,
    filteredData: {
      [SELECTION_FILTER_GROUP]: [],
      [TREE_FILTER_GROUP]: [],
    },
    findSimilarCasesResults: [],
    frontendFilterPriorities: [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP],
    isMaxResultsExceeded: false,
    isMaxResultsExceededDismissed: false,
    listWidgetData: {
      ...createWidgetDataInitialState(),
      visibleItemItemIndex: 0,
    },
    mapWidgetData: {
      ...createWidgetDataInitialState(),
      columnId: null,
      dimensionId: null,
    },
    newick: null,
    numVisibleAttributesInSummary: ConfigService.getInstance<CaseDbConfig>().config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY,
    stratification: null,
    stratifyableColumns: [],
    tree: null,
    treeAddresses: {},
    treeResponse: null,
    treeWidgetData: createTreeWidgetDataInitialState(),
  };
};

export const createDashboardStore = (kwArgs: CreateDashboardStoreKwArgs) => {
  const { caseSetId, completeCaseType, ...createTableStoreKwArgs } = kwArgs;

  const dashboardStore = createStore<DashboardStore>()(
    persist(
      (set, get) => {
        const initialState = createDashboardStoreInitialState({
          caseSetId,
          completeCaseType,
          ...createTableStoreKwArgs,
        });
        const tableStoreActions = createTableStoreActions<CaseDbCase, CaseDbCompleteCaseType>({
          get,
          set,
        });

        return {
          ...initialState,
          ...tableStoreActions,
          addTreeFilter: async (nodeId: string) => {
            const { filters, reloadSelectedIds, resetTreeAddresses, setFilterValue } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            await setFilterValue(treeFilter.id, nodeId);
            reloadSelectedIds();
          },
          destroy: () => {
            tableStoreActions.destroy();
          },
          expandZone: (expandedZone: string) => {
            set({ expandedZone });
          },
          fetchData: async () => {
            set({ dataError: null, isMaxResultsExceeded: false, isMaxResultsExceededDismissed: false });
            const { fetchAbortController: previousFetchAbortController, findSimilarCasesResults, globalAbortSignal } = get();
            const queryClient = QueryClientService.getInstance().queryClient;

            const similarCaseIds = findSimilarCasesResults?.flatMap((result) => result.similarCaseIds) || [];

            if (previousFetchAbortController && !previousFetchAbortController.signal.aborted) {
              previousFetchAbortController.abort();
            }
            const fetchAbortController = new AbortController();
            const globalAbortSignalListener = () => {
              fetchAbortController.abort();
              globalAbortSignal.removeEventListener('abort', globalAbortSignalListener);
            };
            globalAbortSignal.addEventListener('abort', globalAbortSignalListener);

            set({ fetchAbortController });
            set({ isDataLoading: true });
            const { filters, setBaseData } = get();
            const activeFilters = filters
              .filter(filter => filter.filterMode === FILTER_MODE.BACKEND && !filter.isInitialFilterValue())
              .map(activeFilter => activeFilter.toBackendFilter())
              .filter(x => !!x);
            const compositeFilter: CaseDbTypedCompositeFilter = activeFilters.length
              ? {
                filters: activeFilters,
                operator: 'AND',
                type: 'COMPOSITE',
              }
              : undefined;

            const caseQuery: CaseDbCaseQuery = {
              case_set_ids: caseSetId ? [caseSetId] : undefined,
              case_type_id: completeCaseType.id,
              filter: compositeFilter,
            };
            const retrieveCaseIdsByQueryQueryKey = [CASEDB_QUERY_KEY.CASE_IDS_BY_QUERY, completeCaseType.id, JSON.stringify(caseQuery)];

            try {
              let currentCaseIdsByQueryResponse = QueryClientService.getInstance().getValidQueryData<CaseDbCaseQueryResult>(retrieveCaseIdsByQueryQueryKey);
              if (!currentCaseIdsByQueryResponse) {
                const retrieveCaseIdsByQueryResponse = (await CaseDbCaseApi.getInstance().retrieveCaseIdsByQuery(caseQuery, { signal: fetchAbortController.signal })).data;
                currentCaseIdsByQueryResponse = retrieveCaseIdsByQueryResponse;
                queryClient.setQueryData(retrieveCaseIdsByQueryQueryKey, currentCaseIdsByQueryResponse);
              }

              // Note:  Combine the case ids from the query with similar case ids from the "find similar cases" feature, to make sure the similar cases are included in the data even if they do not match the current filters.
              //        It's possible the user added similar cases to the current case_set after. Then the case will be included in the query AND the similar case result. So we need to make sure to only include unique case ids.
              const caseIds = uniq([...currentCaseIdsByQueryResponse.case_ids, ...similarCaseIds]);

              const currentCases = QueryClientService.getInstance().getValidQueryData<CaseDbCase[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY));
              const currentCaseIds = (currentCases ?? []).map(x => x.id);
              const missingCaseIds = difference(caseIds, currentCaseIds);
              if (missingCaseIds.length) {
                const missingCasesResult = (await CaseDbCaseApi.getInstance().retrieveCasesByIds({
                  case_ids: missingCaseIds,
                  case_type_id: completeCaseType.id,
                }, { signal: fetchAbortController.signal })).data;
                queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY), [...currentCases ?? [], ...missingCasesResult]);
              }

              const casesMap = new Map((QueryClientService.getInstance().getValidQueryData<CaseDbCase[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY)) ?? []).map(x => [x.id, x]));
              casesMap.forEach((item) => {
                queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY, item.id), item);
              });
              const cases = caseIds.map(id => casesMap.get(id));

              setBaseData(cases);
              set({ isDataLoading: false, isMaxResultsExceeded: currentCaseIdsByQueryResponse.is_max_results_exceeded });
            } catch (error: unknown) {
              if (!AxiosUtil.isAxiosCanceledError(error)) {
                set({ dataError: error as Error });
              }
            } finally {
              globalAbortSignal.removeEventListener('abort', globalAbortSignalListener);
            }
          },
          mutateCachedCase: (caseId: string, item: CaseDbCase) => {
            const queryClient = QueryClientService.getInstance().queryClient;
            const currentCases = QueryClientService.getInstance().getValidQueryData<CaseDbCase[]>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY));
            queryClient.setQueryData(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY), currentCases.map(c => c.id === caseId ? item : c));
          },
          reloadFilterData: () => {
            const { reloadStratification, reloadStratifyableColumns } = get();
            tableStoreActions.reloadFilterData();
            reloadStratifyableColumns();
            reloadStratification();
          },
          // Private
          reloadFilterPriorityData: (filterPriority: string, data: CaseDbCase[]): CaseDbCase[] => {
            const { filters, reloadTree } = get();
            if (filterPriority === SELECTION_FILTER_GROUP) {
              const selectionFilter = filters.find(filter => filter instanceof SelectionFilter);
              let filteredCases: CaseDbCase[];
              if (!selectionFilter.isInitialFilterValue()) {
                const caseIdsInSelection = selectionFilter.filterValue;
                filteredCases = data.filter(c => caseIdsInSelection.includes(c.id));
              } else {
                filteredCases = data;
              }
              return filteredCases;
            }
            if (filterPriority === TREE_FILTER_GROUP) {
              const treeFilter = filters.find(filter => filter instanceof TreeFilter);
              reloadTree();
              const { tree } = get();
              let filteredCases: CaseDbCase[];
              if (!treeFilter.isInitialFilterValue()) {
                const { subTreeLeaveNames } = tree;
                filteredCases = data.filter(c => subTreeLeaveNames.includes(c.id));
              } else {
                filteredCases = data;
              }
              return filteredCases;
            }
            throw new Error(`Unknown filter group: ${filterPriority}`);
          },
          reloadStratification: () => {
            const { stratification, stratify, stratifyableColumns } = get();
            if (stratification?.mode === STRATIFICATION_MODE.FIELD) {
              const activeStratifyableColumn = stratifyableColumns.find(c => c.col.ref_col_id === stratification.col.ref_col_id);
              if (!activeStratifyableColumn?.enabled) {
                // column no longer stratifiable
                NotificationService.getInstance().showNotification({
                  message: t`The grouping column is no longer available. Grouping has been removed.`,
                  severity: 'info',
                });
                stratify(null);
                return;
              }
            }

            if (!stratification) {
              return;
            }
            stratify(stratification.mode, stratification.col);
          },
          reloadStratifyableColumns: () => {
            const { filteredData, frontendFilterPriorities } = get();

            const data = filteredData[last(frontendFilterPriorities)];
            const stratifyableColumns = StratificationUtil.getStratifyableColumns({
              completeCaseType,
              data,
            });
            set({ stratifyableColumns });
          },
          reloadTree: () => {
            const { filters, treeResponse, treeWidgetData: { treeConfiguration } } = get();
            const zoomedInTreeNodeName = filters.find(filter => filter instanceof TreeFilter)?.filterValue;
            const tree = zoomedInTreeNodeName ? TreeUtil.findNewTreeRoot(treeResponse, zoomedInTreeNodeName, 'node') : treeResponse;
            if (tree) {
              set({
                treeAddresses: {
                  ...get().treeAddresses,
                  [treeConfiguration.col.id]: {
                    addresses: TreeUtil.createTreeAddresses(tree),
                    algorithmCode: treeConfiguration.treeAlgorithm.code,
                  },
                },
              });
            }
            set({ tree });
          },
          removeTreeFilter: async () => {
            const { filters, resetTreeAddresses, setFilterValue } = get();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            if (treeFilter.filterValue) {
              resetTreeAddresses();
              await setFilterValue(treeFilter.id, treeFilter.initialFilterValue);
            }
          },
          resetTreeAddresses: () => {
            set({ treeAddresses: {} });
          },
          // Overwrite table store actions
          setFilterValues: async (filterValues: FilterValues) => {
            const { filters: prevFilters } = get();
            const previousFilterValues: FilterValues = {};
            prevFilters.forEach(filter => {
              previousFilterValues[filter.id] = filter.filterValue;
            });
            const filterValuesDiff = ObjectUtil.getObjectDiff(previousFilterValues, filterValues);
            const treeFilter = prevFilters.find(filter => filter instanceof TreeFilter);
            const hadTreeFilter = !treeFilter.isInitialFilterValue(previousFilterValues[treeFilter.id]);
            if (hadTreeFilter && !filterValuesDiff.includes(treeFilter.id)) {
              NotificationService.getInstance().showNotification({
                message: t`The tree filter has automatically been removed, because it's incompatible with the results of the other filters.`,
                severity: 'info',
              });
              await tableStoreActions.setFilterValues({
                ...filterValues,
                [treeFilter.id]: treeFilter.initialFilterValue,
              });
            } else {
              await tableStoreActions.setFilterValues(filterValues);
            }
          },
          setFindSimilarCasesResults: async (findSimilarCasesResults: FindSimilarCasesResult[]) => {
            const { filters } = get();
            const filterValues: FilterValues = {};
            filters.forEach(filter => {
              filterValues[filter.id] = filter.filterValue;
            });
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            const hasTreeFilter = !treeFilter.isInitialFilterValue(filterValues[treeFilter.id]);
            if (hasTreeFilter) {
              NotificationService.getInstance().showNotification({
                message: t`The tree filter has automatically been removed, because it's incompatible with the results of "Find Similar Cases".`,
                severity: 'info',
              });
              await tableStoreActions.setFilterValues({
                ...filterValues,
                [treeFilter.id]: treeFilter.initialFilterValue,
              });
            }
            set({ findSimilarCasesResults });
            await get().fetchData();
          },
          setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => {
            set({ numVisibleAttributesInSummary });
          },

          setPhylogeneticTreeResponse: (phylogeneticTree: CaseDbPhylogeneticTree) => {
            const { newick, reloadSelectedIds, reloadSortedData, reloadTree } = get();

            if (newick === phylogeneticTree.newick_repr) {
              return;
            }

            if (phylogeneticTree.newick_repr && phylogeneticTree.newick_repr.trim().length > 0 && phylogeneticTree.newick_repr !== '();') {
              // parse the newick into a tree
              const parsedTree = NewickUtil.parse(phylogeneticTree.newick_repr);
              const sanitizedTree = TreeUtil.sanitizeTree(parsedTree, completeCaseType.genetic_distance_protocols[phylogeneticTree.protocol_id].seqdb_max_stored_distance); // FIXME

              // the tree determines the order of the line list
              const sortedIds = NewickUtil.getSortedNames(sanitizedTree);

              set({
                newick: phylogeneticTree.newick_repr,
                sortedIds,
                tree: sanitizedTree,
                treeResponse: sanitizedTree,
              });
            } else {
              set({
                newick: phylogeneticTree.newick_repr,
                sortedIds: [],
                tree: null,
                treeResponse: null,
              });
            }

            reloadTree();
            reloadSortedData();
            reloadSelectedIds();
          },
          setSelectedIds: (selectedIds: string[]) => {
            tableStoreActions.setSelectedIds(selectedIds);

            const { stratification, stratify } = get();

            // Apply stratification
            if (selectedIds.length && (!stratification || stratification?.mode === STRATIFICATION_MODE.SELECTION)) {
              stratify(STRATIFICATION_MODE.SELECTION);
            } else if (stratification?.mode === STRATIFICATION_MODE.SELECTION && !selectedIds.length) {
              stratify(null);
            }
          },

          stratify: (mode: STRATIFICATION_MODE, col?: CaseDbCol) => {
            const { selectedIds, sortedData } = get();
            set({
              stratification: StratificationUtil.getStratification({
                col,
                completeCaseType,
                mode,
                selectedIds,
                sortedData,
              }),
            });
          },
          treeFilterStepOut: async () => {
            const { filters, resetTreeAddresses, setFilterValue, treeResponse } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            const zoomedInTreeNodeName = TreeUtil.findNewTreeRoot(treeResponse, treeFilter?.filterValue, 'parent').name;
            await setFilterValue(treeFilter.id, zoomedInTreeNodeName === treeResponse.name ? null : zoomedInTreeNodeName);
          },
          updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => {
            set({ epiCurveWidgetData: produce(get().epiCurveWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateListWidgetData: (data: Partial<ListWidgetData>) => {
            set({ listWidgetData: produce(get().listWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateMapWidgetData: (data: Partial<MapWidgetData>) => {
            set({ mapWidgetData: produce(get().mapWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateTreeWidgetData: (data: Partial<TreeWidgetData>) => {
            set({ treeWidgetData: produce(get().treeWidgetData, (draft) => ({ ...draft, ...data })) });
          },
        };
      },
      createTableStorePersistConfiguration<CaseDbCase, CaseDbCompleteCaseType, DashboardStore>(kwArgs.storageNamePostFix, kwArgs.storageVersion, (state) => {
        return {
          numVisibleAttributesInSummary: state.numVisibleAttributesInSummary,
          treeWidgetData: {
            ...createTreeWidgetDataInitialState(),
            treeConfiguration: state.treeWidgetData.treeConfiguration,
          },
        };
      }),
    ),
  );
  dashboardStore.getState().setFilters(FilterUtil.createFilters(completeCaseType), FilterUtil.createFilterDimensions(completeCaseType), [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP]);
  return dashboardStore;
};
