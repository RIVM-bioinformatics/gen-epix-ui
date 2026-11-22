import type {
  CaseDbCase,
  CaseDbCaseDataCollectionLink,
  CaseDbCaseRights,
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetDataCollectionLink,
  CaseDbCaseSetMember,
  CaseDbCaseSetStatus,
  CaseDbCompleteCaseType,
  CaseDbDataCollection,
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
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import { CaseDbDataUtil } from '../../../utils/CaseDbDataUtil';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';

import type { AddCasesToEventDialogRefMethods } from './AddCasesToEventDialog';
import { AddCasesToEventDialog } from './AddCasesToEventDialog';

const CASE_TYPE_ID = 'case-type-1';
const OTHER_CASE_TYPE_ID = 'case-type-2';
const CONFIRM_BUTTON_TEST_ID = 'AddCasesToEventDialog-confirmButton';
const SHARING_LABEL = 'Should the selected cases be given the same access rights as the selected event?';
const SELECT_EVENT_LABEL = 'Select event';

const DATA_COLLECTION_ONE: CaseDbDataCollection = { id: 'dc-1', name: 'Data collection one' };

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: 'cat-1', name: 'Category', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: 'status-1', name: 'Status', rank: 1 };

const createCaseSet = (overrides: Partial<CaseDbCaseSet> & Pick<CaseDbCaseSet, 'id' | 'name'>): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY.id,
    case_set_date: '2024-01-15',
    case_set_status_id: STATUS.id,
    case_type_id: CASE_TYPE_ID,
    code: 'code',
    created_in_data_collection_id: DATA_COLLECTION_ONE.id,
    description: 'description',
    ...overrides,
  };
};

const CURRENT_CASE_SET = createCaseSet({ id: 'cs-current', name: 'Current event' });
const OTHER_CASE_SET = createCaseSet({ id: 'cs-other', name: 'Other event' });
const SECOND_OTHER_CASE_SET = createCaseSet({ id: 'cs-other-2', name: 'Second other event' });
const OTHER_TYPE_CASE_SET = createCaseSet({ case_type_id: OTHER_CASE_TYPE_ID, id: 'cs-other-type', name: 'Other type event' });

const CASE_ONE: CaseDbCase = {
  case_type_id: CASE_TYPE_ID,
  content: {},
  created_in_data_collection_id: DATA_COLLECTION_ONE.id,
  id: 'case-1',
};
const CASE_TWO: CaseDbCase = {
  case_type_id: CASE_TYPE_ID,
  content: {},
  created_in_data_collection_id: DATA_COLLECTION_ONE.id,
  id: 'case-2',
};

const COMPLETE_CASE_TYPE = {
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
  ref_cols: {},
  ref_dims: {},
  tree_algorithms: {},
  user_id: null,
} as unknown as CaseDbCompleteCaseType;

let caseSets: CaseDbCaseSet[] = [];
let caseSetMembers: CaseDbCaseSetMember[] = [];
let caseSetDataCollectionLinks: CaseDbCaseSetDataCollectionLink[] = [];
let requestedPaths: string[] = [];
let storeCounter = 0;
let store: StoreApi<DashboardStore>;

const createRights = (caseId: string): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [DATA_COLLECTION_ONE.id],
    can_delete: false,
    case_id: caseId,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ONE.id,
    data_collection_ids: [],
    is_full_access: false,
    read_col_ids: [],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [],
    write_col_ids: [],
  };
};

const createStore = (): StoreApi<DashboardStore> => {
  storeCounter += 1;
  return createDashboardStore({
    caseSetId: CURRENT_CASE_SET.id,
    completeCaseType: COMPLETE_CASE_TYPE,
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: `add-cases-to-event-dialog-${storeCounter}`,
    storageVersion: 1,
  });
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/case_sets', () => Response.json(caseSets));
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION_ONE]));
  mockApiRequest('POST', '/v1/case_sets/query', () => Response.json(caseSets));
  mockApiRequest('POST', '/v1/case_set_members/query', async (request) => {
    requestedPaths.push('POST /v1/case_set_members/query');
    const body = await request.json() as { invert: boolean; key: 'case_id' | 'case_set_id'; members: string[] };
    const matchingMembers = caseSetMembers.filter((member) => {
      const value = body.key === 'case_id' ? member.case_id : member.case_set_id;
      return body.members.includes(value) !== body.invert;
    });
    return Response.json(matchingMembers);
  });
  mockApiRequest('POST', '/v1/case_set_data_collection_links/query', async (request) => {
    const body = await request.json() as { members: string[] };
    return Response.json(caseSetDataCollectionLinks.filter(link => body.members.includes(link.case_set_id)));
  });
  mockApiRequest('POST', '/v1/case_set_members/batch', async (request) => {
    requestedPaths.push('POST /v1/case_set_members/batch');
    const items = await request.json() as CaseDbCaseSetMember[];
    caseSetMembers = [...caseSetMembers, ...items];
    return Response.json(items);
  });
  mockApiRequest('POST', '/v1/retrieve/case_rights', async (request) => {
    requestedPaths.push('POST /v1/retrieve/case_rights');
    const body = await request.json() as { case_ids: string[] };
    return Response.json(body.case_ids.map(createRights));
  });
  mockApiRequest('POST', '/v1/case_data_collection_links/batch', async (request) => {
    requestedPaths.push('POST /v1/case_data_collection_links/batch');
    const items = await request.json() as CaseDbCaseDataCollectionLink[];
    return Response.json(items);
  });
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [] }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
};

const renderDialog = async (rows: CaseDbCase[], currentCaseSet: CaseDbCaseSet | null = CURRENT_CASE_SET) => {
  const ref = createRef<AddCasesToEventDialogRefMethods>();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <TableStoreContextProvider store={store}>
        <AddCasesToEventDialog ref={ref} />
      </TableStoreContextProvider>
    </DashboardStoreContext>,
  );
  ref.current?.open({ currentCaseSet, rows });
  return screen;
};

const getNotifications = () => {
  return container.resolve(NotificationService).data.map((notification) => {
    return { message: notification.message, severity: notification.severity };
  });
};

describe('AddCasesToEventDialog', () => {
  beforeEach(() => {
    caseSets = [CURRENT_CASE_SET, OTHER_CASE_SET];
    caseSetMembers = [];
    caseSetDataCollectionLinks = [];
    requestedPaths = [];
    store = createStore();
    store.setState({ globalAbortSignal: new AbortController().signal });
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-add-cases-to-event-dialog-${storeCounter}`);
    container.resolve(NotificationService).clearNotifications();
  });

  it('preselects the only eligible event and adds the selected cases to it', async () => {
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText(`Add 2 selected case(s) to ${CaseDbDataUtil.getCaseSetName(OTHER_CASE_SET)}`)).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeEnabled();

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => caseSetMembers.length).toBe(2);
    expect(caseSetMembers).toEqual([
      { case_id: CASE_ONE.id, case_set_id: OTHER_CASE_SET.id },
      { case_id: CASE_TWO.id, case_set_id: OTHER_CASE_SET.id },
    ]);
    await expect.poll(() => getNotifications().some(notification => notification.severity === 'success')).toBe(true);
  });

  it('shows that no data collections are available when the selected event has no links', async () => {
    const screen = await renderDialog([CASE_ONE]);

    await expect.element(screen.getByText('No data collections to add')).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: SHARING_LABEL })).toBeDisabled();
  });

  it('shares the cases with the data collections of the selected event when sharing is enabled', async () => {
    caseSetDataCollectionLinks = [{ case_set_id: OTHER_CASE_SET.id, data_collection_id: DATA_COLLECTION_ONE.id }];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('The selected event is shared in the following data collection(s):')).toBeVisible();
    await expect.element(screen.getByText(DATA_COLLECTION_ONE.name)).toBeVisible();

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => requestedPaths.includes('POST /v1/case_data_collection_links/batch')).toBe(true);
    expect(requestedPaths).toContain('POST /v1/retrieve/case_rights');
    expect(requestedPaths.indexOf('POST /v1/case_set_members/batch')).toBeLessThan(requestedPaths.indexOf('POST /v1/case_data_collection_links/batch'));
  });

  it('does not share the cases when sharing is set to No', async () => {
    caseSetDataCollectionLinks = [{ case_set_id: OTHER_CASE_SET.id, data_collection_id: DATA_COLLECTION_ONE.id }];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByRole('combobox', { name: SHARING_LABEL }).click();
    await screen.getByRole('option', { name: 'No' }).click();
    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => caseSetMembers.length).toBe(2);
    expect(requestedPaths).not.toContain('POST /v1/retrieve/case_rights');
    expect(requestedPaths).not.toContain('POST /v1/case_data_collection_links/batch');
  });

  it('reports that all cases are already part of the selected event and disables confirm', async () => {
    caseSetMembers = [
      { case_id: CASE_ONE.id, case_set_id: OTHER_CASE_SET.id },
      { case_id: CASE_TWO.id, case_set_id: OTHER_CASE_SET.id },
    ];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('All selected case(s) are already part of the selected event.')).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeDisabled();
  });

  it('only adds the cases that are not yet part of the selected event', async () => {
    caseSetMembers = [{ case_id: CASE_ONE.id, case_set_id: OTHER_CASE_SET.id }];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('1 selected case(s) are already part of the selected event.')).toBeVisible();

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => caseSetMembers.length).toBe(2);
    expect(caseSetMembers).toEqual([
      { case_id: CASE_ONE.id, case_set_id: OTHER_CASE_SET.id },
      { case_id: CASE_TWO.id, case_set_id: OTHER_CASE_SET.id },
    ]);
  });

  it('warns about cases that are already part of other events', async () => {
    caseSetMembers = [{ case_id: CASE_TWO.id, case_set_id: CURRENT_CASE_SET.id }];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('are already part of other event(s):', { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('link', { exact: false, name: CURRENT_CASE_SET.name })).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeEnabled();
  });

  it('shows that no events of the same case type are available', async () => {
    caseSets = [CURRENT_CASE_SET, OTHER_TYPE_CASE_SET];
    store = createStore();
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('No events of the same case type available')).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeDisabled();
  });

  it('asks the user to select an event when several eligible events exist', async () => {
    caseSets = [CURRENT_CASE_SET, OTHER_CASE_SET, SECOND_OTHER_CASE_SET];
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByText('Add 2 selected case(s) to an existing event')).toBeVisible();
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { name: SELECT_EVENT_LABEL })).toBeVisible();
  });

  it('includes the current event and preselects it when rows are similar cases', async () => {
    store.setState({
      findSimilarCasesResults: [
        {
          colId: 'col-1',
          distance: 0,
          key: 'key-1',
          originalCaseIds: ['case-x'],
          similarCaseIds: [CASE_ONE.id],
        },
      ],
    });
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await expect.element(screen.getByRole('combobox', { name: SELECT_EVENT_LABEL })).toHaveValue(
      `${CaseDbDataUtil.getCaseSetName(CURRENT_CASE_SET)} (currently shown event)`,
    );
    await expect.element(screen.getByTestId(CONFIRM_BUTTON_TEST_ID)).toBeEnabled();
  });

  it('shows an error notification when adding the cases fails', async () => {
    mockApiRequest('POST', '/v1/case_set_members/batch', () => Response.json({}, { status: 500 }));
    const screen = await renderDialog([CASE_ONE, CASE_TWO]);

    await screen.getByTestId(CONFIRM_BUTTON_TEST_ID).click();

    await expect.poll(() => getNotifications().some(notification => notification.severity === 'error')).toBe(true);
    expect(requestedPaths).not.toContain('POST /v1/case_data_collection_links/batch');
  });
});
