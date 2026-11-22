import { container } from 'tsyringe';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type {
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetRights,
  CaseDbCaseSetStatus,
  CaseDbCaseType,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { EventBusService } from '../../../classes/services/EventBusService';
import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { renderComponent } from '../../../test/lib';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
} from '../../../test/fixtures/completeCaseType';
import {
  clearDashboardStorage,
  createDashboardCase,
  createDashboardCompleteCaseType,
  INJECTED_DASHBOARD_COMPONENT_TEXT,
  InjectedDashboardComponent,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';

import { Dashboard } from './Dashboard';

const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CATEGORY_ID = '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c';
const STATUS_ID = '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b';
const DATA_COLLECTION_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const CASE_SET_NAME = 'Event one';

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: CATEGORY_ID, name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: STATUS_ID, name: 'Open', rank: 1 };
const CASE_TYPE: CaseDbCaseType = { id: COMPLETE_CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME };
const DATA_COLLECTION: CaseDbDataCollection = { id: DATA_COLLECTION_ID, name: 'Data collection one' };

const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY_ID,
    case_set_status_id: STATUS_ID,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    code: 'event-code',
    created_in_data_collection_id: DATA_COLLECTION_ID,
    description: 'Event description',
    id: CASE_SET_ID,
    name: CASE_SET_NAME,
    ...overrides,
  };
};

const createRights = (): CaseDbCaseSetRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_set_id: CASE_SET_ID,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    data_collection_ids: [DATA_COLLECTION_ID],
    is_full_access: true,
    read_case_set: true,
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_ID],
    write_case_set: false,
  };
};

/**
 * Registers the endpoints the case set info dialog loads when the event information button opens it.
 */
const mockCaseSetInfoDialogApi = () => {
  mockApiRequest('GET', `/v1/case_sets/${CASE_SET_ID}`, () => Response.json(createCaseSet()));
  mockApiRequest('POST', '/v1/retrieve/case_set_rights', () => Response.json([createRights()]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION]));
  mockApiRequest('POST', '/v1/case_set_data_collection_links/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json([]));
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([CASE_TYPE]));
};

/**
 * Provides the user profile store that the real app provides in CaseDbApp, and the main content element that sidebars measure.
 */
const DashboardWrapper = ({ children }: PropsWithChildren) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = useMemo(() => createUserProfileStore(config), [config]);
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <div id={config.layout.MAIN_CONTENT_ID}>
        {children}
      </div>
    </UserProfileStoreContext>
  );
};

/**
 * Clicking a sidebar button leaves it focused, and KeyboardShortcutService ignores shortcuts while a button is focused.
 * Blur the focused element first so the shortcut reaches the dashboard.
 */
const pressShortcutKey = async (key: string) => {
  (document.activeElement as HTMLElement).blur();
  await userEvent.keyboard(key);
};

const renderDashboardContent = async ({
  caseSet,
  configure,
}: {
  caseSet?: CaseDbCaseSet;
  configure?: (config: CaseDbConfig) => void;
} = {}) => {
  return renderComponent(
    <Dashboard
      caseSet={caseSet}
      caseTypeId={COMPLETE_CASE_TYPE_ID}
    />,
    { configure, wrapper: DashboardWrapper },
  );
};

describe('DashboardContent', () => {
  beforeEach(() => {
    mockDashboardApi();
  });

  afterEach(() => {
    clearDashboardStorage();
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    delete config.dashboard.DASHBOARD_INJECTED_COMPONENT;
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('renders the sidebar buttons without the event button when there is no case set', async () => {
    const screen = await renderDashboardContent();

    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Change dashboard layout' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Show case type information' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Show event information' })).not.toBeInTheDocument();
  });

  it('opens and closes the filters sidebar with the sidebar button and the f shortcut', async () => {
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    await screen.getByRole('button', { name: 'Open filters' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close filters' })).toBeVisible();

    await screen.getByRole('button', { name: 'Close filters' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close filters' })).not.toBeInTheDocument();

    await pressShortcutKey('f');
    await expect.element(screen.getByRole('button', { name: 'Close filters' })).toBeVisible();

    await pressShortcutKey('f');
    await expect.element(screen.getByRole('button', { name: 'Close filters' })).not.toBeInTheDocument();
  });

  it('opens and closes the settings sidebar with the layout button and the s shortcut, and resets the layout', async () => {
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    await screen.getByRole('button', { name: 'Change dashboard layout' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close settings' })).toBeVisible();

    await screen.getByRole('button', { name: 'Reset dashboard layout' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close settings' })).toBeVisible();

    await pressShortcutKey('s');
    await expect.element(screen.getByRole('button', { name: 'Close settings' })).not.toBeInTheDocument();

    await pressShortcutKey('s');
    await expect.element(screen.getByRole('button', { name: 'Close settings' })).toBeVisible();

    await screen.getByRole('button', { name: 'Close settings' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close settings' })).not.toBeInTheDocument();
  });

  it('opens the case type information dialog with the sidebar button and the i shortcut', async () => {
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    await screen.getByRole('button', { name: 'Show case type information' }).click();
    await expect.element(screen.getByTestId('CaseTypeInfoDialog')).toBeVisible();

    await pressShortcutKey('i');
    await expect.element(screen.getByTestId('CaseTypeInfoDialog')).toBeVisible();
  });

  it('opens the download sidebar and shows the empty state', async () => {
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Download' })).toBeVisible();

    await screen.getByRole('button', { name: 'Download' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close download' })).toBeVisible();

    container.resolve(EventBusService).emit('onDownloadOptionsChanged', {
      disabled: true,
      items: [],
      zone: 'CASES',
      zoneLabel: 'Cases',
    });

    // Other dashboard components also register disabled download zones, so the empty state text appears more than once.
    await expect.element(screen.getByText('No data available for download.').first()).toBeVisible();

    await screen.getByRole('button', { name: 'Close download' }).click();
    await expect.element(screen.getByRole('button', { name: 'Close download' })).not.toBeInTheDocument();
  });

  it('opens the case set info dialog for the event with the event information button', async () => {
    mockCaseSetInfoDialogApi();
    const screen = await renderDashboardContent({ caseSet: createCaseSet() });
    await expect.element(screen.getByRole('button', { name: 'Show event information' })).toBeVisible();

    await screen.getByRole('button', { name: 'Show event information' }).click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent(CASE_SET_NAME);
  });

  it('shows the maximum results alert and hides it when it is closed', async () => {
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [], is_max_results_exceeded: true }));
    const screen = await renderDashboardContent();

    await expect.element(screen.getByText('Maximum number of results exceeded')).toBeVisible();
    await expect.element(screen.getByText(/has been exceeded/)).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Close' }).click();

    await expect.element(screen.getByText('Maximum number of results exceeded')).not.toBeInTheDocument();
  });

  it('refetches the cases when an event is created', async () => {
    const caseIdsByQueryResponder = vi.fn(() => Response.json({ case_ids: [], is_max_results_exceeded: false }));
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', caseIdsByQueryResponder);
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
    const requestCountBeforeEvent = caseIdsByQueryResponder.mock.calls.length;

    container.resolve(EventBusService).emit('onEventCreated');

    await vi.waitFor(() => {
      expect(caseIdsByQueryResponder.mock.calls.length).toBeGreaterThan(requestCountBeforeEvent);
    });
  });

  it('opens the filters sidebar on an openFiltersMenu event', async () => {
    const screen = await renderDashboardContent();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    container.resolve(EventBusService).emit('openFiltersMenu');

    await expect.element(screen.getByRole('button', { name: 'Close filters' })).toBeVisible();
  });

  it('keeps the dashboard rendered when dialogs are opened through the event bus', async () => {
    const completeCaseType = createDashboardCompleteCaseType();
    const caseSet = createCaseSet();
    const dashboardCase = createDashboardCase();
    const eventBus = container.resolve(EventBusService);
    const screen = await renderDashboardContent({ caseSet });
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    eventBus.emit('openCreateEventDialog', {});
    eventBus.emit('openSequenceDownloadDialog', { cases: [dashboardCase] });
    eventBus.emit('openContactDetailsDialog', { organizationId: 'organization-1', organizationName: 'Organization one' });
    eventBus.emit('openCaseInfoDialog', { caseId: dashboardCase.id, caseTypeId: COMPLETE_CASE_TYPE_ID });
    eventBus.emit('openFindSimilarCasesDialog', { allRows: [dashboardCase], completeCaseType, selectedRows: [dashboardCase] });
    eventBus.emit('openRemoveFindSimilarCasesResultDialog', { completeCaseType });
    eventBus.emit('openAddCasesToEventDialog', { currentCaseSet: caseSet, rows: [dashboardCase] });
    eventBus.emit('openRemoveCasesFromEventDialog', { caseSet, rows: [dashboardCase] });

    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
  });

  it('renders the injected dashboard component when it is configured', async () => {
    const screen = await renderDashboardContent({
      configure: (config) => {
        config.dashboard.DASHBOARD_INJECTED_COMPONENT = InjectedDashboardComponent;
      },
    });

    await expect.element(screen.getByText(INJECTED_DASHBOARD_COMPONENT_TEXT)).toBeVisible();
  });
});
