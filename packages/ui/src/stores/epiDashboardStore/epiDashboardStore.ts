import { createStore } from 'zustand';
import { produce } from 'immer';
import { t } from 'i18next';
import difference from 'lodash/difference';
import uniqBy from 'lodash/uniqBy';
import uniq from 'lodash/uniq';
import last from 'lodash/last';
import { persist } from 'zustand/middleware';

import type {
  CreateTableStoreKwArgs,
  CreateTableStoreInitialStateKwArgs,
  TableStoreActions,
  TableStoreState,
} from '../tableStore';
import {
  createTableStoreInitialState,
  createTableStoreActions,
  createTableStorePersistConfiguration,
} from '../tableStore';
import type {
  Col,
  Case,
  CompleteCaseType,
  PhylogeneticTree,
  TypedCompositeFilter,
  CaseQuery,
  CaseQueryResult,
} from '../../api';
import {
  ColType,
  CaseApi,
} from '../../api';
import { FILTER_MODE } from '../../classes/abstracts/FilterAbstract';
import { SelectionFilter } from '../../classes/filters/SelectionFilter';
import { TreeFilter } from '../../classes/filters/TreeFilter';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { EpiHighlightingManager } from '../../classes/managers/EpiHighlightingManager';
import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type {
  TreeConfiguration,
  EPI_ZONE,
  Stratification,
  CaseTypeRowValue,
  StratificationLegendaItem,
  FindSimilarCasesResult,
} from '../../models/epi';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../models/epi';
import type { FilterValues } from '../../models/filter';
import { QUERY_KEY } from '../../models/query';
import type { TreeNode } from '../../models/tree';
import { AxiosUtil } from '../../utils/AxiosUtil';
import {
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
  CaseTypeUtil,
} from '../../utils/CaseTypeUtil';
import { CaseUtil } from '../../utils/CaseUtil';
import { EpiFilterUtil } from '../../utils/EpiFilterUtil';
import { NewickUtil } from '../../utils/NewickUtil';
import { EpiTreeUtil } from '../../utils/EpiTreeUtil';
import { ObjectUtil } from '../../utils/ObjectUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

interface WidgetData {
  isUnavailable: boolean;
}

interface StratifiableColumn {
  col: Col;
  enabled: boolean;
}

interface EpiTreeWidgetData extends WidgetData {
  treeConfiguration: TreeConfiguration;
  verticalScrollPosition: number;
  horizontalScrollPosition: number;
  zoomLevel: number;
}
interface EpiListWidgetData extends WidgetData {
  visibleItemItemIndex: number;
}
interface EpiCurveWidgetData extends WidgetData {
  dimensionId: string;
  columnId: string;
}
interface EpiMapWidgetData extends WidgetData {
  dimensionId: string;
  columnId: string;
}

interface EpiDashboardStoreState extends TableStoreState<Case> {
  expandedZone: EPI_ZONE;
  epiCurveWidgetData: EpiCurveWidgetData;
  epiListWidgetData: EpiListWidgetData;
  epiMapWidgetData: EpiMapWidgetData;
  epiTreeWidgetData: EpiTreeWidgetData;
  newick: string;
  stratification: Stratification;
  tree: TreeNode;
  treeResponse: TreeNode;
  treeAddresses: {
    [key: string]: {
      addresses: { [key: string]: string };
      algorithmCode: string;
    };
  };
  completeCaseType: CompleteCaseType;
  caseSetId: string;
  stratifyableColumns: StratifiableColumn[];
  numVisibleAttributesInSummary: number;
  isMaxResultsExceeded: boolean;
  isMaxResultsExceededDismissed: boolean;
  findSimilarCasesResults: FindSimilarCasesResult[];
}

interface EpiDashboardStoreActions extends TableStoreActions<Case> {
  expandZone: (zone: EPI_ZONE) => void;
  removeTreeFilter: () => Promise<void>;
  mutateCachedCase: (caseId: string, item: Case) => void;
  setPhylogeneticTreeResponse: (phylogeneticTree: PhylogeneticTree) => void;
  stratify: (mode: STRATIFICATION_MODE, col?: Col) => void;
  updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => void;
  updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => void;
  updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => void;
  updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => void;
  addTreeFilter: (nodeId: string) => Promise<void>;
  treeFilterStepOut: () => Promise<void>;
  destroy: () => void;
  resetTreeAddresses: () => void;
  setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => void;
  setFindSimilarCasesResults: (findSimilarCasesResults: FindSimilarCasesResult[]) => Promise<void>;

  // Private
  reloadStratification: () => void;
  reloadTree: () => void;
  reloadStratifyableColumns: () => void;
}

export type EpiDashboardStore = EpiDashboardStoreState & EpiDashboardStoreActions;

export type CreateEpiDashboardStoreKwArgs = CreateTableStoreKwArgs<Case> & {
  completeCaseType: CompleteCaseType;
  caseSetId: string;
};

export interface CreateEpiDashboardStoreInitialStateKwArgs extends CreateTableStoreInitialStateKwArgs<Case> {
  completeCaseType: CompleteCaseType;
  caseSetId: string;
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
  treeConfiguration: null,
  verticalScrollPosition: 0,
  horizontalScrollPosition: 0,
  zoomLevel: 1,
});

const createEpiDashboardStoreInitialState = (kwArgs: CreateEpiDashboardStoreInitialStateKwArgs): EpiDashboardStoreState => {
  const { completeCaseType, caseSetId, ...createTableStoreInitialStateKwArgs } = kwArgs;

  return {
    ...createTableStoreInitialState<Case>(createTableStoreInitialStateKwArgs),
    filteredData: {
      [SELECTION_FILTER_GROUP]: [],
      [TREE_FILTER_GROUP]: [],
    },
    stratifyableColumns: [],
    frontendFilterPriorities: [SELECTION_FILTER_GROUP, TREE_FILTER_GROUP],
    completeCaseType,
    caseSetId,
    expandedZone: null,
    stratification: null,
    tree: null,
    treeAddresses: {},
    newick: null,
    treeResponse: null,
    findSimilarCasesResults: [],
    epiTreeWidgetData: createEpiTreeWidgetDataInitialState(),
    epiListWidgetData: {
      ...createWidgetDataInitialState(),
      visibleItemItemIndex: 0,
    },
    epiCurveWidgetData: {
      ...createWidgetDataInitialState(),
      dimensionId: null,
      columnId: null,
    },
    epiMapWidgetData: {
      ...createWidgetDataInitialState(),
      dimensionId: null,
      columnId: null,
    },
    numVisibleAttributesInSummary: ConfigManager.instance.config.epi.INITIAL_NUM_VISIBLE_ATTRIBUTES_IN_CASE_SUMMARY,
    isMaxResultsExceeded: false,
    isMaxResultsExceededDismissed: false,
  };
};

export const createEpiDashboardStore = (kwArgs: CreateEpiDashboardStoreKwArgs) => {
  const { completeCaseType, caseSetId, ...createTableStoreKwArgs } = kwArgs;

  const epiDashboardStore = createStore<EpiDashboardStore>()(
    persist(
      (set, get) => {
        const initialState = createEpiDashboardStoreInitialState({
          caseSetId,
          completeCaseType,
          ...createTableStoreKwArgs,
        });
        const tableStoreActions = createTableStoreActions<Case>({
          set,
          get,
        });

        return {
          ...initialState,
          ...tableStoreActions,
          setNumVisibleAttributesInSummary: (numVisibleAttributesInSummary: number) => {
            set({ numVisibleAttributesInSummary });
          },
          resetTreeAddresses: () => {
            set({ treeAddresses: {} });
          },
          addTreeFilter: async (nodeId) => {
            const { setFilterValue, filters, resetTreeAddresses } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            await setFilterValue(treeFilter.id, nodeId);
          },
          treeFilterStepOut: async () => {
            const { setFilterValue, filters, treeResponse, resetTreeAddresses } = get();
            resetTreeAddresses();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            const zoomedInTreeNodeName = EpiTreeUtil.findNewTreeRoot(treeResponse, treeFilter?.filterValue, 'parent').name;
            await setFilterValue(treeFilter.id, zoomedInTreeNodeName === treeResponse.name ? null : zoomedInTreeNodeName);
          },
          removeTreeFilter: async () => {
            const { setFilterValue, filters, resetTreeAddresses } = get();
            const treeFilter = filters.find(filter => filter instanceof TreeFilter);
            if (treeFilter.filterValue) {
              resetTreeAddresses();
              await setFilterValue(treeFilter.id, treeFilter.initialFilterValue);
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
              NotificationManager.instance.showNotification({
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
          stratify: (mode, col) => {
            const { sortedData, selectedIds } = get();
            const caseIdColors: { [key: string]: string } = {};

            const legendaItems: StratificationLegendaItem[] = [];
            const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
            const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};

            const { STRATIFICATION_COLORS, STRATIFICATION_COLOR_ITEM_MISSING } = ConfigManager.instance.config.epi;

            if (mode === STRATIFICATION_MODE.FIELD) {
              const column = completeCaseType.ref_cols[col.ref_col_id];
              const conceptSetConceptIds = EpiDataManager.instance.data.conceptsIdsBySetId[column.concept_set_id];
              if (conceptSetConceptIds) {
                if (conceptSetConceptIds.length <= STRATIFICATION_COLORS.length) {
                  conceptSetConceptIds.map(conceptId => EpiDataManager.instance.data.conceptsById[conceptId]).sort((a, b) => {
                    if (([
                      ColType.ORDINAL,
                      ColType.INTERVAL,
                      ColType.DECIMAL_0,
                      ColType.DECIMAL_1,
                      ColType.DECIMAL_2,
                      ColType.DECIMAL_3,
                      ColType.DECIMAL_4,
                      ColType.DECIMAL_5,
                      ColType.DECIMAL_6,
                    ] as ColType[]).includes(column.col_type) && a.rank !== b.rank) {
                      return a.rank - b.rank;
                    }
                    return a.code.localeCompare(b.code);
                  }).forEach((concept, index) => {
                    const color = STRATIFICATION_COLORS[index];
                    const legendaItem: StratificationLegendaItem = {
                      caseIds: [],
                      color,
                      rowValue: {
                        isMissing: false,
                        raw: concept.id,
                        full: `${concept.code} (${concept.name})`,
                        short: concept.code,
                        long: concept.name,
                      },
                      columnType: column.col_type,
                    };
                    legendaItemsByColor[color] = legendaItem;
                    legendaItemsByValue[concept.id] = legendaItem;
                    legendaItems.push(legendaItem);
                  });
                  const legendaItemMissingData: StratificationLegendaItem = {
                    caseIds: [],
                    color: STRATIFICATION_COLOR_ITEM_MISSING,
                    rowValue: CaseUtil.getMissingRowValue(''),
                    columnType: column.col_type,
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
                      rowValue,
                      columnType: column.col_type,
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
                    rowValue,
                    columnType: column.col_type,
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
                  mode: STRATIFICATION_MODE.FIELD,
                  col,
                  caseIdColors,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
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
                    raw: rawValue,
                    full: presentationValue,
                    long: presentationValue,
                    short: presentationValue,
                    isMissing: false,
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
                  mode: STRATIFICATION_MODE.SELECTION,
                  col,
                  caseIdColors,
                  legendaItems,
                  legendaItemsByColor,
                  legendaItemsByValue,
                },
              });
            } else {
              set({ stratification: null });
            }
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
          expandZone: (expandedZone: EPI_ZONE) => {
            set({ expandedZone });
          },
          updateEpiTreeWidgetData: (data: Partial<EpiTreeWidgetData>) => {
            set({ epiTreeWidgetData: produce(get().epiTreeWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiListWidgetData: (data: Partial<EpiListWidgetData>) => {
            set({ epiListWidgetData: produce(get().epiListWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiCurveWidgetData: (data: Partial<EpiCurveWidgetData>) => {
            set({ epiCurveWidgetData: produce(get().epiCurveWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          updateEpiMapWidgetData: (data: Partial<EpiMapWidgetData>) => {
            set({ epiMapWidgetData: produce(get().epiMapWidgetData, (draft) => ({ ...draft, ...data })) });
          },
          mutateCachedCase: (caseId: string, item: Case) => {
            const queryClient = QueryClientManager.instance.queryClient;
            const currentCases = QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY));
            queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY), currentCases.map(c => c.id === caseId ? item : c));
          },
          setPhylogeneticTreeResponse: (phylogeneticTree) => {
            const { reloadSortedData, reloadTree, reloadSelectedIds, newick } = get();

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
                treeResponse: sanitizedTree,
                tree: sanitizedTree,
                sortedIds,
              });
            } else {
              set({
                newick: phylogeneticTree.newick_repr,
                treeResponse: null,
                tree: null,
                sortedIds: [],
              });
            }

            reloadTree();
            reloadSortedData();
            reloadSelectedIds();
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
              NotificationManager.instance.showNotification({
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
          reloadFilterData: () => {
            const { reloadStratification, reloadStratifyableColumns } = get();
            tableStoreActions.reloadFilterData();
            reloadStratifyableColumns();
            reloadStratification();
          },

          // Private
          reloadFilterPriorityData: (filterPriority: string, data: Case[]): Case[] => {
            const { filters, reloadTree } = get();
            if (filterPriority === SELECTION_FILTER_GROUP) {
              const selectionFilter = filters.find(filter => filter instanceof SelectionFilter);
              let filteredCases: Case[];
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
              let filteredCases: Case[];
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
          reloadTree: () => {
            const { filters, treeResponse, epiTreeWidgetData: { treeConfiguration } } = get();
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
          reloadStratifyableColumns: () => {
            const { filteredData, frontendFilterPriorities } = get();

            const data = filteredData[last(frontendFilterPriorities)];
            const { ALLOWED_COL_TYPES_FOR_STRATIFICATION, STRATIFICATION_COLORS } = ConfigManager.instance.config.epi;

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
          reloadStratification: () => {
            const { stratification, stratify, stratifyableColumns } = get();
            if (stratification?.mode === STRATIFICATION_MODE.FIELD) {
              const activeStratifyableColumn = stratifyableColumns.find(c => c.col.ref_col_id === stratification.col.ref_col_id);
              if (!activeStratifyableColumn?.enabled) {
                // column no longer stratifiable
                NotificationManager.instance.showNotification({
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
          destroy: () => {
            EpiHighlightingManager.instance.reset();
            tableStoreActions.destroy();
          },
          fetchData: async () => {
            set({ isMaxResultsExceeded: false, isMaxResultsExceededDismissed: false, dataError: null });
            const { fetchAbortController: previousFetchAbortController, globalAbortSignal, findSimilarCasesResults } = get();
            const queryClient = QueryClientManager.instance.queryClient;

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
            const compositeFilter: TypedCompositeFilter = activeFilters.length
              ? {
                type: 'COMPOSITE',
                filters: activeFilters,
                operator: 'AND',
              }
              : undefined;

            const caseQuery: CaseQuery = {
              case_type_id: completeCaseType.id,
              case_set_ids: caseSetId ? [caseSetId] : undefined,
              filter: compositeFilter,
            };
            const retrieveCaseIdsByQueryQueryKey = QueryUtil.getRetrieveCaseIdsByQueryKey(completeCaseType.id, caseQuery);

            try {
              let currentCaseIdsByQueryResponse = QueryUtil.getValidQueryData<CaseQueryResult>(retrieveCaseIdsByQueryQueryKey);
              if (!currentCaseIdsByQueryResponse) {
                const retrieveCaseIdsByQueryResponse = (await CaseApi.instance.retrieveCaseIdsByQuery(caseQuery, { signal: fetchAbortController.signal })).data;
                currentCaseIdsByQueryResponse = retrieveCaseIdsByQueryResponse;
                queryClient.setQueryData(retrieveCaseIdsByQueryQueryKey, currentCaseIdsByQueryResponse);
              }

              // Note:  Combine the case ids from the query with similar case ids from the "find similar cases" feature, to make sure the similar cases are included in the data even if they do not match the current filters.
              //        It's possible the user added similar cases to the current case_set after. Then the case will be included in the query AND the similar case result. So we need to make sure to only include unique case ids.
              const caseIds = uniq([...currentCaseIdsByQueryResponse.case_ids, ...similarCaseIds]);

              const currentCases = QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY));
              const currentCaseIds = (currentCases ?? []).map(x => x.id);
              const missingCaseIds = difference(caseIds, currentCaseIds);
              if (missingCaseIds.length) {
                const missingCasesResult = (await CaseApi.instance.retrieveCasesByIds({
                  case_type_id: completeCaseType.id,
                  case_ids: missingCaseIds,
                }, { signal: fetchAbortController.signal })).data;
                queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY), [...currentCases ?? [], ...missingCasesResult]);
              }

              const casesMap = new Map((QueryUtil.getValidQueryData<Case[]>(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY)) ?? []).map(x => [x.id, x]));
              casesMap.forEach((item) => {
                queryClient.setQueryData(QueryUtil.getGenericKey(QUERY_KEY.CASES_LAZY, item.id), item);
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
        };
      },
      createTableStorePersistConfiguration<Case, EpiDashboardStore>(kwArgs.storageNamePostFix, kwArgs.storageVersion, (state) => {
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
