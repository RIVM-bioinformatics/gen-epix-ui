import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import type { CaseDbConfig } from '../../../models/config.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { Grouping } from './Grouping';

const STORAGE_NAME_POST_FIX = 'Grouping';
const TEXT_COL_ID = COMPLETE_CASE_TYPE_TEXT_COL_ID;
const SINGLE_VALUE_COL_ID = 'col-single-value';
const REF_COL_SINGLE_VALUE_ID = 'ref-col-single-value';
const COL_IDS = [TEXT_COL_ID, SINGLE_VALUE_COL_ID];
const GROUPING_LABEL = 'Grouping';
const GROUPED_BY_SELECTED_ROWS_LABEL = 'Grouped by Selected rows';
const GROUPED_BY_SIMILAR_CASES_LABEL = 'Grouped by Similar cases';
const GROUPED_BY_TEXT_LABEL = 'Grouped by Text';
const SELECTED_ROWS_LABEL = 'Selected rows';
const SIMILAR_CASES_LABEL = 'Similar cases';
const TEXT_FIELD_LABEL = 'Text';
const SINGLE_VALUE_FIELD_LABEL = 'Single value';

// The text column has two unique values, the single value column has one and is therefore not stratifiable.
const CASES: CaseDbCase[] = [
  createDashboardCase({ content: { [SINGLE_VALUE_COL_ID]: 'Same', [TEXT_COL_ID]: 'Alpha' }, id: 'case-1' }),
  createDashboardCase({ content: { [SINGLE_VALUE_COL_ID]: 'Same', [TEXT_COL_ID]: 'Beta' }, id: 'case-2' }),
  createDashboardCase({ content: { [SINGLE_VALUE_COL_ID]: 'Same', [TEXT_COL_ID]: null }, id: 'case-3' }),
];
const CASE_IDS = CASES.map((dashboardCase) => dashboardCase.id);

const createGroupingCompleteCaseType = () => {
  const baseCompleteCaseType = createCompleteCaseType();
  const textCol = baseCompleteCaseType.cols[TEXT_COL_ID];
  const textRefCol = baseCompleteCaseType.ref_cols[textCol.ref_col_id];
  const baseAccess = baseCompleteCaseType.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  return createCompleteCaseType({
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: { ...baseAccess, read_col_ids: COL_IDS },
    },
    cols: {
      [SINGLE_VALUE_COL_ID]: { ...textCol, code: 'single_value', id: SINGLE_VALUE_COL_ID, label: SINGLE_VALUE_FIELD_LABEL, rank: 2, ref_col_id: REF_COL_SINGLE_VALUE_ID },
      [TEXT_COL_ID]: textCol,
    },
    ordered_col_ids: COL_IDS,
    ordered_col_ids_by_dim: { 'dim-other': COL_IDS },
    ref_cols: {
      [REF_COL_SINGLE_VALUE_ID]: { ...textRefCol },
      [textCol.ref_col_id]: textRefCol,
    },
  });
};

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderGrouping = async () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createGroupingCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;
  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();

  const screen = await renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <Grouping />
    </DashboardStoreContext>,
  );
  return { dashboardStore, screen };
};

describe('Grouping', () => {
  beforeEach(() => {
    clearDashboardStorage();
    mockDashboardApi(createGroupingCompleteCaseType());
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: CASE_IDS, is_max_results_exceeded: false }));
    mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(CASES));
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows the grouping label and leaves stratification unset when nothing is grouped', async () => {
    const { screen } = await renderGrouping();

    await expect.element(screen.getByText(GROUPING_LABEL, { exact: true })).toBeInTheDocument();
    expect(activeDashboardStore?.getState().stratification).toBeNull();
  });

  it('disables the grouping button when no column is stratifiable', async () => {
    const { dashboardStore, screen } = await renderGrouping();
    dashboardStore.setState({ stratifyableColumns: [] });

    await expect.element(screen.getByRole('button', { exact: true, name: GROUPING_LABEL })).toBeDisabled();
  });

  it('lists the grouping options and marks non-stratifiable fields as disabled', async () => {
    const { screen } = await renderGrouping();
    await screen.getByText(GROUPING_LABEL, { exact: true }).click();

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'None' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: SELECTED_ROWS_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: SIMILAR_CASES_LABEL })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: TEXT_FIELD_LABEL })).not.toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { exact: true, name: SINGLE_VALUE_FIELD_LABEL })).toHaveAttribute('aria-disabled', 'true');
  });

  it('groups by selected rows and removes the grouping when selected rows is clicked again', async () => {
    const { dashboardStore, screen } = await renderGrouping();
    await screen.getByText(GROUPING_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: SELECTED_ROWS_LABEL }).click();

    await expect.element(screen.getByText(GROUPED_BY_SELECTED_ROWS_LABEL, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Selected', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Unselected', { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification?.mode).toBe('SELECTION');

    await screen.getByText(GROUPED_BY_SELECTED_ROWS_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: SELECTED_ROWS_LABEL }).click();

    await expect.element(screen.getByText(GROUPING_LABEL, { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification).toBeNull();
  });

  it('groups by similar cases and removes the grouping when similar cases is clicked again', async () => {
    const { dashboardStore, screen } = await renderGrouping();
    await screen.getByText(GROUPING_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: SIMILAR_CASES_LABEL }).click();

    await expect.element(screen.getByText(GROUPED_BY_SIMILAR_CASES_LABEL, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Cases found by similarity', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Regular cases', { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification?.mode).toBe('SIMILAR_CASES');

    await screen.getByText(GROUPED_BY_SIMILAR_CASES_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: SIMILAR_CASES_LABEL }).click();

    await expect.element(screen.getByText(GROUPING_LABEL, { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification).toBeNull();
  });

  it('groups by a field, shows its values as legend items and removes the grouping when the field is clicked again', async () => {
    const { dashboardStore, screen } = await renderGrouping();
    await screen.getByText(GROUPING_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: TEXT_FIELD_LABEL }).click();

    await expect.element(screen.getByText(GROUPED_BY_TEXT_LABEL, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Beta', { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification?.col?.id).toBe(TEXT_COL_ID);

    await screen.getByText(GROUPED_BY_TEXT_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: TEXT_FIELD_LABEL }).click();

    await expect.element(screen.getByText(GROUPING_LABEL, { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification).toBeNull();
  });

  it('clears the grouping when None is clicked', async () => {
    const { dashboardStore, screen } = await renderGrouping();
    await screen.getByText(GROUPING_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: SELECTED_ROWS_LABEL }).click();
    await expect.element(screen.getByText(GROUPED_BY_SELECTED_ROWS_LABEL, { exact: true })).toBeInTheDocument();

    await screen.getByText(GROUPED_BY_SELECTED_ROWS_LABEL, { exact: true }).click();
    await screen.getByRole('menuitem', { exact: true, name: 'None' }).click();

    await expect.element(screen.getByText(GROUPING_LABEL, { exact: true })).toBeInTheDocument();
    expect(dashboardStore.getState().stratification).toBeNull();
  });
});
