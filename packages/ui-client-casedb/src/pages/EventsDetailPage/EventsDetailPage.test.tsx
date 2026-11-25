import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { BreadcrumbService } from '@gen-epix/ui-client-common/classes/services/BreadcrumbService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { container } from 'tsyringe';

import { createUserProfileStore } from '../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../stores/userProfileStore/userProfileStoreContext';
import {
  CASE_SET_FIXTURE_ID,
  CASE_SET_FIXTURE_NAME,
  createCaseSet,
} from '../../test/fixtures/caseSet';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
} from '../../test/fixtures/completeCaseType';
import {
  clearDashboardStorage,
  mockDashboardApi,
} from '../../test/fixtures/dashboard';
import type { CaseDbConfig } from '../../models/config.models';

import { EventsDetailPage } from './EventsDetailPage';

const ROUTE_PATH = '/events/:slug/:caseSetId';
const URL = `/events/case-set-fixture/${CASE_SET_FIXTURE_ID}`;
const CASE_SET_PATH = `/v1/case_sets/${CASE_SET_FIXTURE_ID}`;
const CASE_TYPES_PATH = '/v1/case_types';
const EVENT_BREADCRUMB_POSITION = 'Event';
const LOADING_CASE_TYPE_NAME = '⌛';

const PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const caseTypeFixture = { id: COMPLETE_CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME } as CaseDbCaseType;

/**
 * Provides the user profile store and the main content element that the real app provides around the dashboard.
 */
const EventsDetailPageWrapper = ({ children }: PropsWithChildren) => {
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

const renderEventsDetailPage = async () => {
  return renderRoutedPage(
    <EventsDetailPageWrapper>
      <EventsDetailPage />
    </EventsDetailPageWrapper>,
    {
      path: ROUTE_PATH,
      permissions: PERMISSIONS as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
};

const getApplicationName = () => DependencyContainerUtil.resolveConfig<CaseDbConfig>().applicationName;

describe('EventsDetailPage', () => {
  beforeEach(() => {
    mockDashboardApi();
    mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([caseTypeFixture]));
  });

  afterEach(() => {
    clearDashboardStorage();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('renders the generic title while the case set is loading', async () => {
    mockApiRequest('GET', CASE_SET_PATH, async () => new Promise<Response>(() => undefined));

    await renderEventsDetailPage();

    await expect.poll(() => document.title).toBe(`${getApplicationName()} - ${EVENT_BREADCRUMB_POSITION}`);
  });

  it('renders the case set name with its case type name and updates the breadcrumb', async () => {
    mockApiRequest('GET', CASE_SET_PATH, () => Response.json(createCaseSet()));

    const screen = await renderEventsDetailPage();

    await expect.poll(() => document.title).toBe(`${getApplicationName()} - ${CASE_SET_FIXTURE_NAME} (${COMPLETE_CASE_TYPE_NAME})`);
    await expect.element(screen.getByTestId('EventsDetailPage')).toBeVisible();
    expect(container.resolve(BreadcrumbService).data[EVENT_BREADCRUMB_POSITION]).toBe(`${CASE_SET_FIXTURE_NAME} (${COMPLETE_CASE_TYPE_NAME})`);
  });

  it('renders a loading placeholder for the case type name when the case type is not in the case type list', async () => {
    mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([]));
    mockApiRequest('GET', CASE_SET_PATH, () => Response.json(createCaseSet()));

    await renderEventsDetailPage();

    await expect.poll(() => document.title).toBe(`${getApplicationName()} - ${CASE_SET_FIXTURE_NAME} (${LOADING_CASE_TYPE_NAME})`);
  });
});
