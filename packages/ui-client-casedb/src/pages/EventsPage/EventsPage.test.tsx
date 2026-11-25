import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetRights,
  CaseDbCaseSetStatus,
  CaseDbCaseStats,
  CaseDbCaseType,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../models/config.models';
import {
  CASE_SET_FIXTURE_ID,
  CASE_SET_FIXTURE_NAME,
  createCaseSet,
} from '../../test/fixtures/caseSet';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
} from '../../test/fixtures/completeCaseType';

import { EventsPage } from './EventsPage';

const ROUTE_PATH = '/events';
const URL = '/events';
const CASE_SETS_PATH = '/v1/case_sets';
const CASE_SET_STATS_PATH = '/v1/retrieve/case_set_stats';
const CASE_TYPES_PATH = '/v1/case_types';
const CATEGORIES_PATH = '/v1/case_set_categories';
const STATUSES_PATH = '/v1/case_set_statuses';
const CASE_SET_DETAIL_PATH = `/events/case-set-fixture/${CASE_SET_FIXTURE_ID}`;

const SECOND_CASE_SET_ID = 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f70';
const SECOND_CASE_SET_NAME = 'Second event';
const CATEGORY_ID = '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c';
const STATUS_ID = '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b';
const DATA_COLLECTION_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';

const PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const CASE_TYPE: CaseDbCaseType = { id: COMPLETE_CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME };
const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: CATEGORY_ID, name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: STATUS_ID, name: 'Open', rank: 1 };

const caseSetFixture: CaseDbCaseSet = createCaseSet({
  case_set_category_id: CATEGORY_ID,
  case_set_status_id: STATUS_ID,
  created_in_data_collection_id: DATA_COLLECTION_ID,
});

const secondCaseSetFixture: CaseDbCaseSet = createCaseSet({
  case_set_category_id: CATEGORY_ID,
  case_set_status_id: STATUS_ID,
  created_in_data_collection_id: DATA_COLLECTION_ID,
  id: SECOND_CASE_SET_ID,
  name: SECOND_CASE_SET_NAME,
});

const statsFixture: CaseDbCaseStats = {
  case_set_id: CASE_SET_FIXTURE_ID,
  case_type_id: COMPLETE_CASE_TYPE_ID,
  n_cases: 5,
  n_own_cases: 3,
};

const createRights = (overrides: Partial<CaseDbCaseSetRights> = {}): CaseDbCaseSetRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_set_id: CASE_SET_FIXTURE_ID,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    data_collection_ids: [DATA_COLLECTION_ID],
    is_full_access: true,
    read_case_set: true,
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_ID],
    write_case_set: false,
    ...overrides,
  };
};

/**
 * Registers the endpoints used by CaseSetInfoDialog and CreateEventDialog, which are rendered by the page.
 */
const registerDialogHandlers = () => {
  mockApiRequest('GET', `/v1/case_sets/${CASE_SET_FIXTURE_ID}`, () => Response.json(caseSetFixture));
  mockApiRequest('POST', '/v1/retrieve/case_set_rights', () => Response.json([createRights()]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_set_data_collection_links/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_sets/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/retrieve/case_rights', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_data_collection_links/batch', () => Response.json([]));
  mockApiRequest('GET', '/v1/complete_case_types', () => Response.json([]));
};

const renderPage = async ({
  caseSets = [caseSetFixture, secondCaseSetFixture],
  stats = [statsFixture],
}: {
  caseSets?: CaseDbCaseSet[];
  stats?: CaseDbCaseStats[];
} = {}) => {
  mockApiRequest('GET', CASE_SETS_PATH, () => Response.json(caseSets));
  mockApiRequest('POST', CASE_SET_STATS_PATH, () => Response.json(stats));
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([CASE_TYPE]));
  mockApiRequest('GET', CATEGORIES_PATH, () => Response.json([CATEGORY]));
  mockApiRequest('GET', STATUSES_PATH, () => Response.json([STATUS]));
  registerDialogHandlers();
  const screen = await renderRoutedPage(
    <EventsPage />,
    {
      path: ROUTE_PATH,
      permissions: PERMISSIONS as CommonDbApiPermission[],
      url: URL,
    },
  );
  return screen;
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('EventsPage', () => {
  it('navigates to the event detail page when a row is clicked with page events enabled', async () => {
    const screen = await renderPage();
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const originalEnablePageEvents = config.enablePageEvents;
    config.enablePageEvents = true;

    try {
      await screen.getByRole('cell', { exact: true, name: CASE_SET_FIXTURE_NAME }).click();

      await expect.poll(() => window.location.pathname).toBe(CASE_SET_DETAIL_PATH);
    } finally {
      config.enablePageEvents = originalEnablePageEvents;
    }
  });

  it('shows the empty state when there are no events', async () => {
    const screen = await renderPage({ caseSets: [], stats: [] });

    await expect.element(screen.getByText('No events found', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Create event' })).toBeEnabled();
  });

  it('lists the events with their case type, category and status names', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: CASE_SET_FIXTURE_NAME })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: SECOND_CASE_SET_NAME })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: COMPLETE_CASE_TYPE_NAME }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outbreak' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Open' }).first()).toBeInTheDocument();
  });

  it('renders events without stats when the stats response has no entry for them', async () => {
    const screen = await renderPage({ stats: [] });

    await expect.element(screen.getByRole('cell', { exact: true, name: SECOND_CASE_SET_NAME })).toBeInTheDocument();
  });

  it('navigates to the event detail page when a row is clicked', async () => {
    const screen = await renderPage();

    await screen.getByRole('cell', { exact: true, name: CASE_SET_FIXTURE_NAME }).click();

    await expect.poll(() => window.location.pathname).toBe(CASE_SET_DETAIL_PATH);
  });

  it('navigates to the event detail page via the Go to event action', async () => {
    const screen = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Go to event' }).click();

    await expect.poll(() => window.location.pathname).toBe(CASE_SET_DETAIL_PATH);
  });

  it('opens the event information dialog when the readable index is clicked', async () => {
    const screen = await renderPage();

    await screen.getByRole('button', { name: `Open event information for ${CASE_SET_FIXTURE_NAME}` }).click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent(CASE_SET_FIXTURE_NAME);
  });

  it('opens the event information dialog via the Show event information action', async () => {
    const screen = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Show event information' }).click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent(CASE_SET_FIXTURE_NAME);
  });

  it('opens the create event dialog via the Create event button', async () => {
    const screen = await renderPage();

    await screen.getByRole('button', { name: 'Create event' }).click();

    await expect.element(screen.getByTestId('CreateEventDialog-title')).toHaveTextContent('Create event');
  });
});
