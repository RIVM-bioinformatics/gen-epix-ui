import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCaseSetMember,
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
} from 'vitest';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
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

import type { RemoveCasesFromEventDialogRefMethods } from './RemoveCasesFromEventDialog';
import { RemoveCasesFromEventDialog } from './RemoveCasesFromEventDialog';

const CASE_TYPE_ID = 'case-type-1';
const CONFIRM_BUTTON_TEST_ID = 'RemoveCasesFromEventDialog-confirmButton';
const ACTIONS_TEST_ID = 'RemoveCasesFromEventDialog-actions';
const CLOSE_BUTTON_TEST_ID = 'RemoveCasesFromEventDialog-closeButton';
const DEFAULT_DELETE_MAX_N_CASES = 10;

const CASE_SET: CaseDbCaseSet = {
  case_set_category_id: 'cat-1',
  case_set_date: '2024-01-15',
  case_set_status_id: 'status-1',
  case_type_id: CASE_TYPE_ID,
  code: 'code',
  created_in_data_collection_id: 'dc-1',
  description: 'description',
  id: 'cs-current',
  name: 'Event one',
};

const CASE_ONE: CaseDbCase = { case_type_id: CASE_TYPE_ID, content: {}, created_in_data_collection_id: 'dc-1', id: 'case-1' };
const CASE_TWO: CaseDbCase = { case_type_id: CASE_TYPE_ID, content: {}, created_in_data_collection_id: 'dc-1', id: 'case-2' };
const CASE_THREE: CaseDbCase = { case_type_id: CASE_TYPE_ID, content: {}, created_in_data_collection_id: 'dc-1', id: 'case-3' };

const MEMBER_ONE: CaseDbCaseSetMember = { case_id: CASE_ONE.id, case_set_id: CASE_SET.id, id: 'member-1' };
const MEMBER_TWO: CaseDbCaseSetMember = { case_id: CASE_TWO.id, case_set_id: CASE_SET.id, id: 'member-2' };
const MEMBER_OTHER_EVENT: CaseDbCaseSetMember = { case_id: CASE_ONE.id, case_set_id: 'cs-other', id: 'member-3' };

let caseSetMembers: CaseDbCaseSetMember[] = [];
let deleteRequests: string[][] = [];
let storeCounter = 0;
let store: StoreApi<DashboardStore>;

const createCompleteCaseType = (deleteMaxNCases: number): CaseDbCompleteCaseType => {
  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols: {},
    dims: {},
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: [],
    id: CASE_TYPE_ID,
    name: 'Case type',
    ordered_col_ids: [],
    ordered_col_ids_by_dim: {},
    ordered_dim_ids: [],
    props: { delete_max_n_cases: deleteMaxNCases },
    ref_cols: {},
    ref_dims: {},
    tree_algorithms: {},
    user_id: null,
  } as unknown as CaseDbCompleteCaseType;
};

const createStore = (deleteMaxNCases = DEFAULT_DELETE_MAX_N_CASES): StoreApi<DashboardStore> => {
  storeCounter += 1;
  const newStore = createDashboardStore({
    caseSetId: CASE_SET.id,
    completeCaseType: createCompleteCaseType(deleteMaxNCases),
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: `remove-cases-from-event-dialog-${storeCounter}`,
    storageVersion: 1,
  });
  newStore.setState({ globalAbortSignal: new AbortController().signal });
  return newStore;
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/case_sets', () => Response.json([CASE_SET]));
  mockApiRequest('POST', '/v1/case_sets/query', () => Response.json([CASE_SET]));
  mockApiRequest('POST', '/v1/case_set_members/query', async (request) => {
    const body = await request.json() as { filters: { key: string; members: string[] }[] };
    const caseIds = body.filters.find(filter => filter.key === 'case_id')?.members ?? [];
    const caseSetIds = body.filters.find(filter => filter.key === 'case_set_id')?.members ?? [];
    return Response.json(caseSetMembers.filter(member => caseIds.includes(member.case_id) && caseSetIds.includes(member.case_set_id)));
  });
  mockApiRequest('DELETE', '/v1/case_set_members/batch', (request) => {
    const ids = new URL(request.url).searchParams.get('ids')?.split(',') ?? [];
    deleteRequests.push(ids);
    caseSetMembers = caseSetMembers.filter(member => !ids.includes(member.id));
    return Response.json(ids);
  });
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [] }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
};

const renderDialog = async (rows: CaseDbCase[]) => {
  const ref = createRef<RemoveCasesFromEventDialogRefMethods>();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <RemoveCasesFromEventDialog ref={ref} />
    </DashboardStoreContext>,
  );
  ref.current?.open({ caseSet: CASE_SET, rows });
  return screen;
};

const getNotifications = () => {
  return container.resolve(NotificationService).data.map((notification) => {
    return { message: notification.message, severity: notification.severity };
  });
};

describe('RemoveCasesFromEventDialog', () => {
  beforeEach(() => {
    caseSetMembers = [MEMBER_ONE, MEMBER_TWO, MEMBER_OTHER_EVENT];
    deleteRequests = [];
    store = createStore();
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-remove-cases-from-event-dialog-${storeCounter}`);
    container.resolve(NotificationService).clearNotifications();
  });

  it('asks for confirmation to remove the selected cases from the event', async () => {
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('Remove selected cases from event')).toBeVisible();
    await expect.element(screen.getByText('Are you sure you want to remove 2 selected cases from Event one?')).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeEnabled();
  });

  it('removes the selected cases from the event and reports success', async () => {
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => caseSetMembers.length).toBe(1);
    expect(deleteRequests).toEqual([[MEMBER_ONE.id, MEMBER_TWO.id]]);
    expect(caseSetMembers).toEqual([MEMBER_OTHER_EVENT]);
    await expect.poll(() => getNotifications().some(notification => notification.severity === 'success')).toBe(true);
  });

  it('only removes the cases that are part of the event', async () => {
    const screen = await renderDialog([CASE_ONE, CASE_THREE]);

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => deleteRequests.length).toBe(1);
    expect(deleteRequests).toEqual([[MEMBER_ONE.id]]);
  });

  it('disables the actions while the cases are being removed', async () => {
    let releaseDelete: () => void = () => undefined;
    const deleteGate = new Promise<void>((resolve) => {
      releaseDelete = resolve;
    });
    mockApiRequest('DELETE', '/v1/case_set_members/batch', async (request) => {
      await deleteGate;
      const ids = new URL(request.url).searchParams.get('ids')?.split(',') ?? [];
      deleteRequests.push(ids);
      caseSetMembers = caseSetMembers.filter(member => !ids.includes(member.id));
      return Response.json(ids);
    });
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID)).toBeDisabled();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeDisabled();

    releaseDelete();

    await expect.poll(() => caseSetMembers.length).toBe(1);
  });

  it('keeps the cases in the event and reports an error when removing fails', async () => {
    mockApiRequest('DELETE', '/v1/case_set_members/batch', () => Response.json({}, { status: 500 }));
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => getNotifications().some(notification => notification.severity === 'error')).toBe(true);
    expect(caseSetMembers).toEqual([MEMBER_ONE, MEMBER_TWO, MEMBER_OTHER_EVENT]);
  });

  it('closes the dialog without removing anything when the close button is clicked', async () => {
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID).click();

    await expect.poll(() => screen.getByText('Are you sure you want to remove 2 selected cases from Event one?').query()).toBeNull();
    expect(deleteRequests).toEqual([]);
    expect(caseSetMembers).toHaveLength(3);
  });

  it('does not offer removal when more cases are selected than the delete limit allows', async () => {
    store.getState().destroy();
    store = createStore(1);
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('You can only remove up to 1 cases at a time. Please refine your selection and try again.')).toBeVisible();
    expect(screen.getByTestId(CONFIRM_BUTTON_TEST_ID).query()).toBeNull();
    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID)).toBeEnabled();
  });

  it('does not show the confirmation message when the cases of the event cannot be loaded', async () => {
    mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json({}, { status: 500 }));
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.poll(() => screen.getByText('Are you sure you want to remove 2 selected cases from Event one?').query()).toBeNull();
    await expect.element(screen.getByTestId(ACTIONS_TEST_ID).getByTestId(CLOSE_BUTTON_TEST_ID)).toBeVisible();
  });
});
