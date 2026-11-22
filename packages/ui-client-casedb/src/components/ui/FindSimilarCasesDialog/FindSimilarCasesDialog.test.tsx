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
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { getInstanceByDom } from 'echarts/core';
import type { EChartsType } from 'echarts/core';
import { container } from 'tsyringe';
import { createRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { TreeWidgetUtil } from '../../../utils/TreeWidgetUtil';
import {
  clearDashboardStorage,
  createDashboardCase,
  createDashboardCompleteCaseType,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { CASE_SET_FIXTURE_ID } from '../../../test/fixtures/caseSet';
import { renderComponent } from '../../../test/lib';

import { FindSimilarCasesDialog } from './FindSimilarCasesDialog';
import type { FindSimilarCasesDialogRefMethods } from './FindSimilarCasesDialog';

const STORAGE_NAME_POST_FIX_PREFIX = 'find-similar-cases-dialog-test';
let storageCounter = 0;

const SIMILAR_CASES_PATH = '/v1/retrieve/similar_cases';
const IS_OWN_CASES_PATH = '/v1/retrieve/is_own_cases';
const SNP_COL_ID = 'col-gd-snp';
const MLVA_COL_ID = 'col-gd-mlva';
const SNP_COL_LABEL = 'SNP distance';
const MLVA_COL_LABEL = 'MLVA distance';
const SNP_PROTOCOL_MAX_DISTANCE = 5;
const ALL_TREE_ALGORITHM_CODES = ['NJ', 'UPGMA'];

const createTreeAlgorithm = (code: string): CaseDbTreeAlgorithm => ({
  code,
  id: `tree-algorithm-${code}`,
  is_ultrametric: false,
  name: `${code} algorithm`,
  seqdb_tree_algorithm_id: `seqdb-tree-algorithm-${code}`,
  tree_algorithm_class_id: `tree-algorithm-class-${code}`,
} as CaseDbTreeAlgorithm);

const createFindSimilarCompleteCaseType = (): CaseDbCompleteCaseType => {
  const baseCaseType = createDashboardCompleteCaseType();
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
    name: 'SNP protocol',
    seqdb_is_integer_distance: true,
    seqdb_max_stored_distance: SNP_PROTOCOL_MAX_DISTANCE,
    seqdb_seq_distance_protocol_id: 'seqdb-protocol-snp',
    seqdb_seq_distance_type: CaseDbSeqDistanceType.SNP_HAMMING,
  };
  const mlvaProtocol: CaseDbGeneticDistanceProtocol = {
    id: 'gdp-mlva',
    min_scale_unit: 1,
    name: 'MLVA protocol',
    seqdb_is_integer_distance: true,
    seqdb_seq_distance_protocol_id: 'seqdb-protocol-mlva',
    seqdb_seq_distance_type: CaseDbSeqDistanceType.MLVA_HAMMING,
  };
  const treeAlgorithms: Record<string, CaseDbTreeAlgorithm> = Object.fromEntries(ALL_TREE_ALGORITHM_CODES.map((code) => [code, createTreeAlgorithm(code)]));

  return createDashboardCompleteCaseType({
    cols: { ...baseCaseType.cols, [MLVA_COL_ID]: mlvaCol, [SNP_COL_ID]: snpCol },
    genetic_distance_protocols: { 'gdp-mlva': mlvaProtocol, 'gdp-snp': snpProtocol },
    ordered_col_ids: [...baseCaseType.ordered_col_ids, SNP_COL_ID, MLVA_COL_ID],
    ordered_col_ids_by_dim: { ...baseCaseType.ordered_col_ids_by_dim, [dimId]: [...baseCaseType.ordered_col_ids, SNP_COL_ID, MLVA_COL_ID] },
    ref_cols: refCols,
    tree_algorithms: treeAlgorithms,
  });
};

const createCaseSimilarity = (id: string, timedAt: null | string) => (timedAt === null ? { id } : { id, timed_at: timedAt });

let store: ReturnType<typeof createDashboardStore>;
let storageNamePostFix: string;
let requestedPaths: string[];
let requestBodies: Record<string, unknown>[];
let similarCases: { id: string; timed_at?: string }[];
let isOwnById: Record<string, boolean>;
let completeCaseType: CaseDbCompleteCaseType;
const allRows: CaseDbCase[] = [createDashboardCase({ id: 'row-a' }), createDashboardCase({ id: 'row-b' })];
const selectedRows: CaseDbCase[] = [allRows[0]];

const registerSimilarCasesApi = () => {
  mockApiRequest('POST', SIMILAR_CASES_PATH, async (request) => {
    requestedPaths.push(SIMILAR_CASES_PATH);
    requestBodies.push(await request.json() as Record<string, unknown>);
    return Response.json({ cases: similarCases });
  });
  mockApiRequest('POST', IS_OWN_CASES_PATH, async (request) => {
    requestedPaths.push(IS_OWN_CASES_PATH);
    await request.json();
    return Response.json(isOwnById);
  });
};

const setDefaultTreeConfiguration = () => {
  const treeConfiguration = TreeWidgetUtil.getTreeConfigurations(completeCaseType).find((config) => config.col.id === SNP_COL_ID);
  store.getState().updateWidgetDataPersistable(DASHBOARD_COMPONENT_NAME.TREE, { treeConfiguration });
};

let screen: Awaited<ReturnType<typeof renderComponent>>;

const renderDialog = async () => {
  const ref = createRef<FindSimilarCasesDialogRefMethods>();
  screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <TableStoreContextProvider store={store}>
        <FindSimilarCasesDialog ref={ref} />
      </TableStoreContextProvider>
    </DashboardStoreContext>,
  );
  ref.current?.open({ allRows, completeCaseType, selectedRows });
  return ref;
};

const getChart = async (): Promise<EChartsType> => {
  let chart: EChartsType | undefined;
  await vi.waitFor(() => {
    const dom = document.querySelector<HTMLElement>('[_echarts_instance_]');
    chart = dom ? getInstanceByDom(dom) : undefined;
    expect(chart).toBeDefined();
  });
  return chart;
};

const getAddButton = () => screen.getByTestId('FindSimilarCasesDialog-addSimilarCasesButton');

const chooseTree = async (label: string) => {
  await screen.getByRole('combobox', { name: 'Tree' }).click();
  await screen.getByRole('option', { exact: true, name: label }).click();
};

const search = async () => {
  await screen.getByRole('button', { exact: true, name: 'Search' }).click();
};

const setMaxDistance = async (value: string) => {
  await screen.getByRole('textbox', { name: 'Max distance' }).fill(value);
};

describe('FindSimilarCasesDialog', () => {
  beforeEach(() => {
    storageCounter += 1;
    storageNamePostFix = `${STORAGE_NAME_POST_FIX_PREFIX}-${storageCounter}`;
    requestedPaths = [];
    requestBodies = [];
    similarCases = [];
    isOwnById = {};
    completeCaseType = createFindSimilarCompleteCaseType();
    mockDashboardApi(completeCaseType);
    registerSimilarCasesApi();
    store = createDashboardStore({
      caseSetId: CASE_SET_FIXTURE_ID,
      completeCaseType,
      config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
      idSelectorCallback: (row: CaseDbCase) => row.id,
      storageNamePostFix,
      storageVersion: 1,
    });
    store.setState({ globalAbortSignal: new AbortController().signal });
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    localStorage.removeItem(`GENEPIX-TableStore-${storageNamePostFix}`);
    clearDashboardStorage();
  });

  it('renders the description and the close and add buttons', async () => {
    await renderDialog();

    await expect.element(screen.getByText('Find similar cases')).toBeVisible();
    await expect.element(screen.getByText('Select a tree and maximum distance to find similar cases for the 1 selected cases.')).toBeVisible();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Close' })).toBeEnabled();
    await expect.element(getAddButton()).toBeDisabled();
  });

  it('uses the default tree from the tree widget and shows the similar cases', async () => {
    setDefaultTreeConfiguration();
    similarCases = [createCaseSimilarity('row-b', '2024-01-05'), createCaseSimilarity('sim-own-1', '2024-01-03'), createCaseSimilarity('sim-other-1', '2024-01-10'), createCaseSimilarity('sim-other-2', '2024-01-12'), createCaseSimilarity('sim-no-date', null)];
    isOwnById = { 'sim-own-1': true };
    await renderDialog();
    await expect.element(screen.getByRole('combobox', { name: 'Tree' })).toHaveTextContent(SNP_COL_LABEL);

    await setMaxDistance('2');
    await search();

    await expect.element(screen.getByText('Found 5 similar cases with a distance of 2.')).toBeVisible();
    await expect.element(screen.getByText('4 similar cases can be added to the line list.')).toBeVisible();
    await expect.element(screen.getByText('1 similar cases found that are already in the line list.')).toBeVisible();
    await expect.element(getAddButton()).toHaveTextContent('Add 4 similar cases to line list');
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search again' })).toBeVisible();
    expect(requestBodies[0]).toEqual({ case_ids: ['row-a'], case_type_id: completeCaseType.id, genetic_distance_col_id: SNP_COL_ID, max_distance: 2 });
    expect(requestedPaths).toEqual([SIMILAR_CASES_PATH, IS_OWN_CASES_PATH]);
  });

  it('shows a warning when no similar cases are found', async () => {
    setDefaultTreeConfiguration();
    similarCases = [];
    await renderDialog();

    await setMaxDistance('1');
    await search();

    await expect.element(screen.getByText('Found 0 similar cases with a distance of 1.')).toBeVisible();
    await expect.element(getAddButton()).toBeDisabled();
  });

  it('disables the add button when all similar cases are already in the line list', async () => {
    setDefaultTreeConfiguration();
    similarCases = [createCaseSimilarity('row-b', '2024-01-05')];
    await renderDialog();

    await setMaxDistance('2');
    await search();

    await expect.element(screen.getByText('1 similar cases found that are already in the line list.')).toBeVisible();
    await expect.element(getAddButton()).toBeDisabled();
    await expect.element(screen.getByText('0 similar cases can be added to the line list.')).toBeVisible();
  });

  it('filters the similar cases by organization through the chart legend', async () => {
    setDefaultTreeConfiguration();
    similarCases = [createCaseSimilarity('row-b', '2024-01-05'), createCaseSimilarity('sim-own-1', '2024-01-03'), createCaseSimilarity('sim-other-1', '2024-01-10'), createCaseSimilarity('sim-other-2', '2024-01-12')];
    isOwnById = { 'sim-own-1': true };
    await renderDialog();
    await setMaxDistance('2');
    await search();
    await expect.element(getAddButton()).toHaveTextContent('Add 3 similar cases to line list');
    const chart = await getChart();

    chart.dispatchAction({ name: 'Cases from other organizations', type: 'legendToggleSelect' });
    await expect.element(getAddButton()).toHaveTextContent('Add 1 similar cases to line list');
    await expect.element(screen.getByText('1 similar cases found that are already in the line list.')).not.toBeInTheDocument();

    chart.dispatchAction({ name: 'Cases from other organizations', type: 'legendToggleSelect' });
    await expect.element(getAddButton()).toHaveTextContent('Add 3 similar cases to line list');
    chart.dispatchAction({ name: 'Own cases', type: 'legendToggleSelect' });
    await expect.element(getAddButton()).toHaveTextContent('Add 2 similar cases to line list');
  });

  it('filters the similar cases by a date range selected in the chart', async () => {
    setDefaultTreeConfiguration();
    similarCases = [createCaseSimilarity('row-b', '2024-01-05'), createCaseSimilarity('sim-own-1', '2024-01-03'), createCaseSimilarity('sim-other-1', '2024-01-10'), createCaseSimilarity('sim-other-2', '2024-01-12'), createCaseSimilarity('sim-no-date', null)];
    isOwnById = { 'sim-own-1': true };
    await renderDialog();
    await setMaxDistance('2');
    await search();
    await expect.element(getAddButton()).toHaveTextContent('Add 4 similar cases to line list');
    const chart = await getChart();

    chart.dispatchAction({ endValue: 2, startValue: 0, type: 'dataZoom' });
    await expect.element(getAddButton()).toHaveTextContent('Add 1 similar cases to line list');
    await expect.element(screen.getByText('1 similar cases found that are already in the line list.')).toBeVisible();
  });

  it('adds the similar cases to the dashboard results and closes the dialog', async () => {
    setDefaultTreeConfiguration();
    similarCases = [createCaseSimilarity('row-b', '2024-01-05'), createCaseSimilarity('sim-own-1', '2024-01-03'), createCaseSimilarity('sim-other-1', '2024-01-10')];
    isOwnById = { 'sim-own-1': true };
    await renderDialog();
    await setMaxDistance('2');
    await search();
    await expect.element(getAddButton()).toHaveTextContent('Add 2 similar cases to line list');

    await getAddButton().click();

    await vi.waitFor(() => expect(store.getState().findSimilarCasesResults).toHaveLength(1));
    const [result] = store.getState().findSimilarCasesResults;
    expect(result).toMatchObject({ colId: SNP_COL_ID, distance: 2, originalCaseIds: ['row-a', 'row-b'] });
    expect([...result.similarCaseIds].sort((first, second) => first.localeCompare(second))).toEqual(['sim-other-1', 'sim-own-1']);
    await vi.waitFor(() => expect(screen.getByText('Find similar cases').query()).toBeNull());
  });

  it('closes the dialog with the close button', async () => {
    setDefaultTreeConfiguration();
    await renderDialog();
    await expect.element(screen.getByText('Find similar cases')).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Close' }).click();

    await vi.waitFor(() => expect(screen.getByText('Find similar cases').query()).toBeNull());
    expect(requestedPaths).toEqual([]);
  });

  it('does not search without a tree or with an invalid max distance', async () => {
    setDefaultTreeConfiguration();
    await renderDialog();

    await setMaxDistance('0');
    await search();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeVisible();

    await setMaxDistance('1.5');
    await search();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeVisible();

    await setMaxDistance(String(SNP_PROTOCOL_MAX_DISTANCE + 1));
    await search();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeVisible();

    expect(requestedPaths).toEqual([]);
  });

  it('requires a tree when no default tree is configured and searches after one is chosen', async () => {
    similarCases = [createCaseSimilarity('sim-other-1', '2024-01-10')];
    await renderDialog();
    await expect.element(screen.getByRole('combobox', { name: 'Tree' })).toBeVisible();

    await setMaxDistance('10');
    await search();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeVisible();
    expect(requestedPaths).toEqual([]);

    await chooseTree(MLVA_COL_LABEL);
    await search();

    await expect.element(screen.getByText('Found 1 similar cases with a distance of 10.')).toBeVisible();
    expect(requestBodies[0]).toMatchObject({ genetic_distance_col_id: MLVA_COL_ID, max_distance: 10 });
  });
});
