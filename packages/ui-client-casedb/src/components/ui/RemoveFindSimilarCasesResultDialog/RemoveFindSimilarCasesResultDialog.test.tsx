import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { createRef } from 'react';
import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import type { FindSimilarCasesResult } from '../../../models/case-db.models';
import { EventBusService } from '../../../classes/services/EventBusService';

import type { RemoveFindSimilarCasesResultDialogRefMethods } from './RemoveFindSimilarCasesResultDialog';
import { RemoveFindSimilarCasesResultDialog } from './RemoveFindSimilarCasesResultDialog';

const CASE_TYPE_ID = 'case-type-1';
const TREE_LABEL = 'Tree label';
const TREE_ALGORITHM_CODE = 'tree-algorithm-1';
const ACTIONS_TEST_ID = 'RemoveFindSimilarCasesResultDialog-actions';
const CLOSE_BUTTON_TEST_ID = 'RemoveFindSimilarCasesResultDialog-closeButton';
const UNDO_BUTTON_TEST_ID = 'RemoveFindSimilarCasesResultDialog-undoButton';
const APPLY_BUTTON_TEST_ID = 'RemoveFindSimilarCasesResultDialog-applyButton';
const REMOVE_ALL_BUTTON_LABEL = 'Remove all similar cases from result';
const REMOVE_BUTTON_LABEL = 'Remove';

const RESULT_ONE: FindSimilarCasesResult = {
  colId: 'col-1',
  distance: 2,
  key: 'result-1',
  originalCaseIds: ['case-1', 'case-2', 'case-3'],
  similarCaseIds: ['case-4', 'case-5'],
};

const RESULT_TWO: FindSimilarCasesResult = {
  colId: 'col-2',
  distance: 5,
  key: 'result-2',
  originalCaseIds: ['case-1'],
  similarCaseIds: ['case-6'],
};

let storeCounter = 0;
let store: StoreApi<DashboardStore>;

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols: {
      'col-1': {
        code: 'col-1',
        id: 'col-1',
        label: TREE_LABEL,
        ref_col_id: 'ref-col-1',
        tree_algorithm_codes: [TREE_ALGORITHM_CODE],
      },
    },
    dims: {},
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {
      'genetic-distance-protocol-1': { id: 'genetic-distance-protocol-1', name: 'Protocol' },
    },
    id: CASE_TYPE_ID,
    name: 'Case type',
    ordered_col_ids: [],
    ordered_col_ids_by_dim: {},
    ordered_dim_ids: [],
    props: { delete_max_n_cases: 10 },
    ref_cols: {
      'ref-col-1': {
        col_type: CaseDbColType.GENETIC_DISTANCE,
        genetic_distance_protocol_id: 'genetic-distance-protocol-1',
        id: 'ref-col-1',
      },
    },
    ref_dims: {},
    tree_algorithms: {
      [TREE_ALGORITHM_CODE]: { code: TREE_ALGORITHM_CODE, id: TREE_ALGORITHM_CODE, name: 'Algorithm' },
    },
    user_id: null,
  } as unknown as CaseDbCompleteCaseType;
};

const createStore = (): StoreApi<DashboardStore> => {
  storeCounter += 1;
  const newStore = createDashboardStore({
    caseSetId: null,
    completeCaseType: createCompleteCaseType(),
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: `remove-find-similar-cases-result-dialog-${storeCounter}`,
    storageVersion: 1,
  });
  newStore.setState({ globalAbortSignal: new AbortController().signal });
  return newStore;
};

const registerHandlers = () => {
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [] }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
};

const renderDialog = async () => {
  const ref = createRef<RemoveFindSimilarCasesResultDialogRefMethods>();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <RemoveFindSimilarCasesResultDialog ref={ref} />
    </DashboardStoreContext>,
  );
  ref.current?.open({ completeCaseType: createCompleteCaseType() });
  return screen;
};

describe('RemoveFindSimilarCasesResultDialog', () => {
  let removeLinkListener: () => void = () => undefined;
  let linkListener: ReturnType<typeof vi.fn<(payload: void) => void>>;

  beforeEach(() => {
    store = createStore();
    registerHandlers();
    linkListener = vi.fn<(payload: void) => void>();
    removeLinkListener = container.resolve(EventBusService).addEventListener('onLinkLineListAndTree', linkListener);
  });

  afterEach(() => {
    removeLinkListener();
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-remove-find-similar-cases-result-dialog-${storeCounter}`);
  });

  it('shows only the close action when there are no similar cases results', async () => {
    store.setState({ findSimilarCasesResults: [] });
    const screen = await renderDialog();

    await expect.element(screen.getByText('Result without similar cases (0 cases)')).toBeVisible();
    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID)).toBeVisible();
    await expect.poll(() => screen.getByTestId(ACTIONS_TEST_ID).getByTestId(UNDO_BUTTON_TEST_ID).query()).toBeNull();
    await expect.poll(() => screen.getByTestId(ACTIONS_TEST_ID).getByTestId(APPLY_BUTTON_TEST_ID).query()).toBeNull();
    await expect.poll(() => screen.getByText(REMOVE_ALL_BUTTON_LABEL).query()).toBeNull();
  });

  it('shows the statistics of the first similar cases result', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await expect.element(screen.getByText('Result without similar cases (3 cases)')).toBeVisible();
    await expect.element(screen.getByText(REMOVE_ALL_BUTTON_LABEL)).toBeVisible();
    await expect.element(screen.getByText('Searched 3 cases for similar cases.')).toBeVisible();
    await expect.element(screen.getByText(`Tree: ${TREE_LABEL}`)).toBeVisible();
    await expect.element(screen.getByText('Distance: 2')).toBeVisible();
    await expect.element(screen.getByText('Found similar cases: 2')).toBeVisible();
    await expect.element(screen.getByText('New number of cases: 5')).toBeVisible();
  });

  it('only enables removing the last similar cases group', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await expect.element(screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).first()).toBeDisabled();
    await expect.element(screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last()).toBeEnabled();
  });

  it('removes a similar cases group and offers undo and apply', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last().click();

    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(UNDO_BUTTON_TEST_ID)).toBeVisible();
    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(APPLY_BUTTON_TEST_ID)).toBeVisible();
    await expect.element(screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last()).toBeEnabled();
    expect(store.getState().findSimilarCasesResults).toEqual([RESULT_ONE, RESULT_TWO]);
  });

  it('restores the removed similar cases groups on undo', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last().click();
    await screen.getByTestId(ACTIONS_TEST_ID).getByTestId(UNDO_BUTTON_TEST_ID).click();

    await expect.poll(() => screen.getByTestId(ACTIONS_TEST_ID).getByTestId(UNDO_BUTTON_TEST_ID).query()).toBeNull();
    await expect.poll(() => screen.getByTestId(ACTIONS_TEST_ID).getByTestId(APPLY_BUTTON_TEST_ID).query()).toBeNull();
    await expect.element(screen.getByText('Tree: col-2')).toBeVisible();
  });

  it('applies the intermediate results, emits a link event and closes', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last().click();
    await screen.getByTestId(ACTIONS_TEST_ID).getByTestId(APPLY_BUTTON_TEST_ID).click();

    await expect.poll(() => store.getState().findSimilarCasesResults).toEqual([RESULT_ONE]);
    await vi.waitFor(() => {
      expect(linkListener).toHaveBeenCalledTimes(1);
    });
    await expect.poll(() => screen.getByText('Remove similar cases from results').query()).toBeNull();
  });

  it('closes without changing the results', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await screen.getByRole('button', { exact: true, name: REMOVE_BUTTON_LABEL }).last().click();
    await screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID).click();

    await expect.poll(() => screen.getByText('Remove similar cases from results').query()).toBeNull();
    expect(store.getState().findSimilarCasesResults).toEqual([RESULT_ONE, RESULT_TWO]);
    expect(linkListener).not.toHaveBeenCalled();
  });

  it('removes all similar cases results and closes', async () => {
    store.setState({ findSimilarCasesResults: [RESULT_ONE, RESULT_TWO] });
    const screen = await renderDialog();

    await screen.getByText(REMOVE_ALL_BUTTON_LABEL).click();

    await expect.poll(() => store.getState().findSimilarCasesResults).toEqual([]);
    await expect.poll(() => screen.getByText('Remove similar cases from results').query()).toBeNull();
  });
});
