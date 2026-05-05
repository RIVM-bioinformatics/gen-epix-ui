import { createStore } from 'zustand';
import { produce } from 'immer';
import { t } from 'i18next';
import difference from 'lodash/difference';
import uniqBy from 'lodash/uniqBy';
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
import {
  CaseDbCaseApi,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import {
  AxiosUtil,
  ConfigManager,
  createTableStoreActions,
  createTableStoreInitialState,
  createTableStorePersistConfiguration,
  FILTER_MODE,
  NotificationManager,
  ObjectUtil,
  QUERY_KEY,
  QueryClientManager,
  QueryManager,
} from '@gen-epix/ui';
import type {
  CreateTableStoreInitialStateKwArgs,
  CreateTableStoreKwArgs,
  FilterValues,
  TableStoreActions,
  TableStoreState,
} from '@gen-epix/ui';

import type {
  CaseTypeRowValue,
  EPI_ZONE,
  FindSimilarCasesResult,
  Stratification,
  StratificationLegendaItem,
  TreeConfiguration,
} from '../../models/epi';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../models/epi';
import type { TreeNode } from '../../models/tree';
import {
  CaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../../utils/CaseTypeUtil';
import { CaseUtil } from '../../utils/CaseUtil';
import { EpiFilterUtil } from '../../utils/EpiFilterUtil';
import { NewickUtil } from '../../utils/NewickUtil';
import { EpiTreeUtil } from '../../utils/EpiTreeUtil';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import { SelectionFilter } from '../../../../ui/src/classes/filters/SelectionFilter';
import { TreeFilter } from '../../../../ui/src/classes/filters/TreeFilter';
import { EpiHighlightingManager } from '../../classes/managers/EpiHighlightingManager';
import type { CaseDbConfig } from '../../models/config';

export interface CreateEpiDashboardStoreInitialStateKwArgs extends CreateTableStoreInitialStateKwArgs<CaseDbCase> {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
}

export type CreateEpiDashboardStoreKwArgs = {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
} & CreateTableStoreKwArgs<CaseDbCase>;

export type EpiDashboardStore = EpiDashboardStoreActions & EpiDashboardStoreState;
interface EpiCurveWidgetData extends WidgetData {
  columnId: string;
  dimensionId: string;
}
interface EpiDashboardStoreActions extends TableStoreActions<CaseDbCase> {
  addTreeFilter: (nodeId: string) => Promise<void>;
  destroy: () => void;
  expandZone: (zone: EPI_ZONE) => void;
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

  updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => void;
  updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => void;
  updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => void;
}
interface EpiDashboardStoreState extends TableStoreState<CaseDbCase> {
  caseSetId: string;
  completeCaseType: CaseDbCompleteCaseType;
  epiCurveWidgetData: EpiCurveWidgetData;
  epiListWidgetData: EpiListWidgetData;
  epiMapWidgetData: EpiMapWidgetData;
  epiTreeWidgetData: EpiTreeWidgetData;
  expandedZone: EPI_ZONE;
  findSimilarCasesResults: FindSimilarCasesResult[];
  isMaxResultsExceeded: boolean;
  isMaxResultsExceededDismissed: boolean;
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
}

interface EpiListWidgetData extends WidgetData {
  visibleItemItemIndex: number;
}

interface EpiMapWidgetData extends WidgetData {
  columnId: string;
  dimensionId: string;
}

interface EpiTreeWidgetData extends WidgetData {
  horizontalScrollPosition: number;
  treeConfiguration: TreeConfiguration;
  verticalScrollPosition: number;
  zoomLevel: number;
}

interface StratifiableColumn {
  col: CaseDbCol;
  enabled: boolean;
}

interface WidgetData {
  isUnavailable: boolean;
}

const rowValueComperator = (a: CaseTypeRowValue, b: CaseTypeRowValue): number => {
  if (a.raw === b.raw) {
    return 0;
  }
  if (a.isMissing) {
    return 1;
  }
  if (b.isMissing) {
    return -1;
  }
  return a.short.localeCompare(b.short);
};

const createWidgetDataInitialState = (): WidgetData => ({
  isUnavailable: false,
});

const createEpiTreeWidgetDataInitialState = (): EpiTreeWidgetData => ({
  ...createWidgetDataInitialState(),
  horizontalScrollPosition: 0,
  treeConfiguration: null,
  verticalScrollPosition: 0,
  zoomLevel: 1,
});

const createEpiDashboardStoreInitialState = (kwArgs: CreateEpiDashboardStoreInitialStateKwArgs): EpiDashboardStoreState => {
  const { caseSetId, completeCaseType, ...createTableStoreInitialStateKwArgs } = kwArgs;

  return {
    ...createTableStoreInitialState<CaseDbCase>(createTableStoreInitialStateKwArgs),
    caseSetId,
    completeCaseType,
    epiCurveWidgetData: {
      ...createWidgetDataInitialState(),
      columnId: null,
      dimensionId: null,
    },
    epiListWidgetData: {
      ...createWidgetDataInitialState(),
      visibleItemItemIndex: 0,
    },
    epiMapWidgetData: {
      ...createWidgetDataInitialState(),
      columnId: null,
      dimensionId: null,
    },
    epiTreeWidgetData: createEpiTreeWidgetDataInitialState(),
    expandedZone: null,
    filteredData: {
      [SELECTION_FILTER_GROUP]: [],
      [TREE_FILTER_GROUP]: [],
    },
    findSimilarCasesResults: [],
    frontendFilterPriorities: [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP],
    isMaxResultsExceeded: false,
    isMaxResultsExceededDismissed: false,
    newick: null,
    numVisibleAttributesInSummary: ConfigManager.getInstance<CaseDbConfig>().config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY,
    stratification: null,
    stratifyableColumns: [],
    tree: null,
    treeAddresses: {},
    treeResponse: null,
  };
};

export const createEpiDashboardStore = (kwArgs: CreateEpiDashboardStoreKwArgs) => {
  const { caseSetId, completeCaseType, ...createTableStoreKwArgs } = kwArgs;

  const epiDashboardStore = createStore<EpiDashboardStore>()(
    persist(
      (set, get) => {
        const initialState = createEpiDashboardStoreInitialState({
          caseSetId,
          completeCaseType,
          ...createTableStoreKwArgs,
        });
        const tableStoreActions = createTableStoreActions<CaseDbCase>({
          get,
          set,
        });

        return {
          ...initialState,
          ...tableStoreActions,
          addTreeFilter: async (nodeId) => {
            const { filters, resetTreeAddresses, setFilterValue } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            await setFilterValue(treeFilter.id, nodeId);
          },
          destroy: () => {
            EpiHighlightingManager.getInstance().reset();
            tableStoreActions.destroy();
          },
          expandZone: (expandedZone: EPI_ZONE) => {
            set({ expandedZone });
          },
          fetchData: async () => {
            set({ dataError: null, isMaxResultsExceeded: false, isMaxResultsExceededDismissed: false });
            const { fetchAbortController: previousFetchAbortController, findSimilarCasesResults, globalAbortSignal } = get();
            const queryClient = QueryClientManager.getInstance().queryClient;

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
            const retrieveCaseIdsByQueryQueryKey = [QUERY_KEY.CASE_IDS_BY_QUERY, completeCaseType.id, JSON.stringify(caseQuery)];

            try {
              let currentCaseIdsByQueryResponse = QueryManager.getInstance().getValidQueryData<CaseDbCaseQueryResult>(retrieveCaseIdsByQueryQueryKey);
              if (!currentCaseIdsByQueryResponse) {
                const retrieveCaseIdsByQueryResponse = (await CaseDbCaseApi.getInstance().retrieveCaseIdsByQuery(caseQuery, { signal: fetchAbortController.signal })).data;
                currentCaseIdsByQueryResponse = retrieveCaseIdsByQueryResponse;
                queryClient.setQueryData(retrieveCaseIdsByQueryQueryKey, currentCaseIdsByQueryResponse);
              }

              // Note:  Combine the case ids from the query with similar case ids from the "find similar cases" feature, to make sure the similar cases are included in the data even if they do not match the current filters.
              //        It's possible the user added similar cases to the current case_set after. Then the case will be included in the query AND the similar case result. So we need to make sure to only include unique case ids.
              const caseIds = uniq([...currentCaseIdsByQueryResponse.case_ids, ...similarCaseIds]);

              const currentCases = QueryManager.getInstance().getValidQueryData<CaseDbCase[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY));
              const currentCaseIds = (currentCases ?? []).map(x => x.id);
              const missingCaseIds = difference(caseIds, currentCaseIds);
              if (missingCaseIds.length) {
                const missingCasesResult = (await CaseDbCaseApi.getInstance().retrieveCasesByIds({
                  case_ids: missingCaseIds,
                  case_type_id: completeCaseType.id,
                }, { signal: fetchAbortController.signal })).data;
                queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY), [...currentCases ?? [], ...missingCasesResult]);
              }

              const casesMap = new Map((QueryManager.getInstance().getValidQueryData<CaseDbCase[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY)) ?? []).map(x => [x.id, x]));
              casesMap.forEach((item) => {
                queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY, item.id), item);
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
            const queryClient = QueryClientManager.getInstance().queryClient;
            const currentCases = QueryManager.getInstance().getValidQueryData<CaseDbCase[]>(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY));
            queryClient.setQueryData(QueryManager.getInstance().getGenericKey(QUERY_KEY.CASES_LAZY), currentCases.map(c => c.id === caseId ? item : c));
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
                NotificationManager.getInstance().showNotification({
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
            const { ALLOWED_COL_TYPES_FOR_STRATIFICATION, STRATIFICATION_COLORS } = ConfigManager.getInstance<CaseDbConfig>().config.epi;

            const filteredCols = CaseTypeUtil.getCols(completeCaseType).filter(col => {
              const column = completeCaseType.ref_cols[col.ref_col_id];
              if (!ALLOWED_COL_TYPES_FOR_STRATIFICATION.includes(column.col_type)) {
                return false;
              }
              return true;
            });
            const stratifyableColumns = filteredCols.map<StratifiableColumn>(col => {
              const numUniqueValues = uniq(data.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType).raw)).length;
              let enabled = true;
              if (numUniqueValues === 0 || numUniqueValues > STRATIFICATION_COLORS.length) {
                enabled = false;
              }
              return {
                col,
                enabled,
              };
            });
            set({ stratifyableColumns });
          },
          reloadTree: () => {
            const { epiTreeWidgetData: { treeConfiguration }, filters, treeResponse } = get();
            const zoomedInTreeNodeName = filters.find(filter => filter instanceof TreeFilter)?.filterValue;
            const tree = zoomedInTreeNodeName ? EpiTreeUtil.findNewTreeRoot(treeResponse, zoomedInTreeNodeName, 'node') : treeResponse;
            if (tree) {
              set({
                treeAddresses: {
                  ...get().treeAddresses,
                  [treeConfiguration.col.id]: {
                    addresses: EpiTreeUtil.createTreeAddresses(tree),
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
              NotificationManager.getInstance().showNotification({
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
              NotificationManager.getInstance().showNotification({
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

          setPhylogeneticTreeResponse: (phylogeneticTree) => {
            const { newick, reloadSelectedIds, reloadSortedData, reloadTree } = get();

            if (newick === phylogeneticTree.newick_repr) {
              return;
            }

            if (phylogeneticTree.newick_repr && phylogeneticTree.newick_repr.trim().length > 0 && phylogeneticTree.newick_repr !== '();') {
              // parse the newick into a tree
              const parsedTree = NewickUtil.parse(phylogeneticTree.newick_repr);
              const sanitizedTree = EpiTreeUtil.sanitizeTree(parsedTree);

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

          stratify: (mode, col) => {
            const { selectedIds, sortedData } = get();
            const caseIdColors: { [key: string]: string } = {};

            const legendaItems: StratificationLegendaItem[] = [];
            const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
            const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};

            const { STRATIFICATION_COLOR_ITEM_MISSING, STRATIFICATION_COLORS } = ConfigManager.getInstance<CaseDbConfig>().config.epi;

            if (mode === STRATIFICATION_MODE.FIELD) {
              const column = completeCaseType.ref_cols[col.ref_col_id];
              const conceptSetConceptIds = EpiDataManager.getInstance().data.conceptsIdsBySetId[column.concept_set_id];
              if (conceptSetConceptIds) {
                if (conceptSetConceptIds.length <= STRATIFICATION_COLORS.length) {
                  conceptSetConceptIds.map(conceptId => EpiDataManager.getInstance().data.conceptsById[conceptId]).sort((a, b) => {
                    if (([
                      CaseDbColType.ORDINAL,
                      CaseDbColType.INTERVAL,
                      CaseDbColType.DECIMAL_0,
                      CaseDbColType.DECIMAL_1,
                      CaseDbColType.DECIMAL_2,
                      CaseDbColType.DECIMAL_3,
                      CaseDbColType.DECIMAL_4,
                      CaseDbColType.DECIMAL_5,
                      CaseDbColType.DECIMAL_6,
                    ] as CaseDbColType[]).includes(column.col_type) && a.rank !== b.rank) {
                      return a.rank - b.rank;
                    }
                    return a.code.localeCompare(b.code);
                  }).forEach((concept, index) => {
                    const color = STRATIFICATION_COLORS[index];
                    const legendaItem: StratificationLegendaItem = {
                      caseIds: [],
                      color,
                      columnType: column.col_type,
                      rowValue: {
                        full: `${concept.code} (${concept.name})`,
                        isMissing: false,
                        long: concept.name,
                        raw: concept.id,
                        short: concept.code,
                      },
                    };
                    legendaItemsByColor[color] = legendaItem;
                    legendaItemsByValue[concept.id] = legendaItem;
                    legendaItems.push(legendaItem);
                  });
                  const legendaItemMissingData: StratificationLegendaItem = {
                    caseIds: [],
                    color: STRATIFICATION_COLOR_ITEM_MISSING,
                    columnType: column.col_type,
                    rowValue: CaseUtil.getMissingRowValue(''),
                  };
                  legendaItemsByColor[STRATIFICATION_COLOR_ITEM_MISSING] = legendaItemMissingData;
                  legendaItemsByValue[''] = legendaItemMissingData;
                  legendaItems.push(legendaItemMissingData);

                  sortedData.forEach(row => {
                    const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
                    const legendaItem = rowValue.isMissing ? legendaItemMissingData : legendaItemsByValue[rowValue.raw];
                    legendaItem.caseIds.push(row.id);
                    caseIdColors[row.id] = legendaItem.color;
                  });
                  if (legendaItemMissingData.caseIds.length === 0) {
                    legendaItems.splice(legendaItems.indexOf(legendaItemMissingData), 1);
                    delete legendaItemsByColor[STRATIFICATION_COLOR_ITEM_MISSING];
                    delete legendaItemsByValue[''];
                  }
                } else {
                  const rowValues = sortedData.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType));
                  const uniqueRowValues = uniqBy(rowValues, (rowValue => rowValue.raw)).sort((a, b) => {
                    return rowValueComperator(a, b);
                  });

                  uniqueRowValues.forEach((rowValue, index) => {
                    const color = rowValue.isMissing ? STRATIFICATION_COLOR_ITEM_MISSING : STRATIFICATION_COLORS[index];
                    const legendaItem: StratificationLegendaItem = {
                      caseIds: [],
                      color,
                      columnType: column.col_type,
                      rowValue,
                    };

                    legendaItemsByColor[color] = legendaItem;
                    legendaItemsByValue[rowValue.raw] = legendaItem;
                    legendaItems.push(legendaItem);
                  });
                  sortedData.forEach(row => {
                    const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
                    const legendaItem = legendaItemsByValue[rowValue.raw];
                    legendaItem.caseIds.push(row.id);
                    caseIdColors[row.id] = legendaItem.color;
                  });
                }

              } else {
                const rawValues = sortedData.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType));
                const uniqueRowValues = uniqBy(rawValues, v => v.raw).sort(rowValueComperator);

                uniqueRowValues.forEach((rowValue, index) => {
                  const color = rowValue.isMissing ? STRATIFICATION_COLOR_ITEM_MISSING : STRATIFICATION_COLORS[index];
                  const legendaItem: StratificationLegendaItem = {
                    caseIds: [],
                    color,
                    columnType: column.col_type,
                    rowValue,
                  };

                  legendaItemsByColor[color] = legendaItem;
                  legendaItemsByValue[rowValue.raw] = legendaItem;
                  legendaItems.push(legendaItem);
                });

                sortedData.forEach(row => {
                  const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
                  const legendaItem = legendaItemsByValue[rowValue.raw];
                  legendaItem.caseIds.push(row.id);
                  caseIdColors[row.id] = legendaItem.color;
                });
              }
              set({
                stratification: {
                  caseIdColors,
                  col,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
                  mode: STRATIFICATION_MODE.FIELD,
                },
              });
            } else if (mode === STRATIFICATION_MODE.SELECTION) {
              const rawValues: STRATIFICATION_SELECTED[] = [STRATIFICATION_SELECTED.SELECTED, STRATIFICATION_SELECTED.UNSELECTED];

              rawValues.forEach(rawValue => {
                const color = rawValue === STRATIFICATION_SELECTED.SELECTED ? STRATIFICATION_COLORS[0] : STRATIFICATION_COLORS[1];
                const presentationValue = rawValue === STRATIFICATION_SELECTED.SELECTED ? t`Selected` : t`Unselected`;
                const legendaItem: StratificationLegendaItem = {
                  caseIds: [],
                  color,
                  rowValue: {
                    full: presentationValue,
                    isMissing: false,
                    long: presentationValue,
                    raw: rawValue,
                    short: presentationValue,
                  },
                };

                legendaItemsByColor[color] = legendaItem;
                legendaItemsByValue[rawValue] = legendaItem;
                legendaItems.push(legendaItem);
              });

              sortedData.forEach(row => {
                const legendaItem = selectedIds.includes(row.id) ? legendaItemsByValue[STRATIFICATION_SELECTED.SELECTED] : legendaItemsByValue[STRATIFICATION_SELECTED.UNSELECTED];

                legendaItem.caseIds.push(row.id);
                caseIdColors[row.id] = legendaItem.color;
              });
              set({
                stratification: {
                  caseIdColors,
                  col,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
                  mode: STRATIFICATION_MODE.SELECTION,
                },
              });
            } else {
              set({ stratification: null });
            }
          },
          treeFilterStepOut: async () => {
            const { filters, resetTreeAddresses, setFilterValue, treeResponse } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            const zoomedInTreeNodeName = EpiTreeUtil.findNewTreeRoot(treeResponse, treeFilter?.filterValue, 'parent').name;
            await setFilterValue(treeFilter.id, zoomedInTreeNodeName === treeResponse.name ? null : zoomedInTreeNodeName);
          },
          updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => {
            set({ epiCurveWidgetData: produce(get().epiCurveWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => {
            set({ epiListWidgetData: produce(get().epiListWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => {
            set({ epiMapWidgetData: produce(get().epiMapWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => {
            set({ epiTreeWidgetData: produce(get().epiTreeWidgetData, (draft) => ({ ...draft, ...data })) });
          },
        };
      },
      createTableStorePersistConfiguration<CaseDbCase, EpiDashboardStore>(kwArgs.storageNamePostFix, kwArgs.storageVersion, (state) => {
        return {
          epiTreeWidgetData: {
            ...createEpiTreeWidgetDataInitialState(),
            treeConfiguration: state.epiTreeWidgetData.treeConfiguration,
          },
          numVisibleAttributesInSummary: state.numVisibleAttributesInSummary,
        };
      }),
    ),
  );
  epiDashboardStore.getState().setFilters(EpiFilterUtil.createFilters(completeCaseType), EpiFilterUtil.createFilterDimensions(completeCaseType), [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP]);
  return epiDashboardStore;
};
