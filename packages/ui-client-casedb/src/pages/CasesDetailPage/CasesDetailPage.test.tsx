import { container } from 'tsyringe';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCaseType } from '@gen-epix/api-casedb';
import { BreadcrumbService } from '@gen-epix/ui-client-common/classes/services/BreadcrumbService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../models/config.models';
import { createUserProfileStore } from '../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../stores/userProfileStore/userProfileStoreContext';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
} from '../../test/fixtures/completeCaseType';
import {
  clearDashboardStorage,
  mockDashboardApi,
} from '../../test/fixtures/dashboard';

import { CasesDetailPage } from './CasesDetailPage';

const ROUTE_PATH = '/cases/:slug/:caseTypeId';
const ROUTE_URL = `/cases/case-type-one/${COMPLETE_CASE_TYPE_ID}`;
const CASE_TYPE_PATH = `/v1/case_types/${COMPLETE_CASE_TYPE_ID}`;
const BREADCRUMB_POSITION = 'Case type';

/**
 * Provides the user profile store that the real app provides in CaseDbApp, and the main content element that sidebars measure.
 */
const PageWrapper = ({ children }: PropsWithChildren) => {
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

const createCaseType = (overrides: Partial<CaseDbCaseType> = {}): CaseDbCaseType => ({
  id: COMPLETE_CASE_TYPE_ID,
  name: COMPLETE_CASE_TYPE_NAME,
  ...overrides,
});

const mockCaseTypeApi = (caseType: CaseDbCaseType) => {
  mockApiRequest('GET', CASE_TYPE_PATH, () => Response.json(caseType));
};

const renderPage = async () => {
  return renderRoutedPage(
    <PageWrapper>
      <CasesDetailPage />
    </PageWrapper>,
    { path: ROUTE_PATH, url: ROUTE_URL },
  );
};

describe('CasesDetailPage', () => {
  beforeEach(() => {
    mockDashboardApi();
    mockCaseTypeApi(createCaseType());
  });

  afterEach(() => {
    clearDashboardStorage();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    container.resolve(BreadcrumbService).remove(BREADCRUMB_POSITION);
  });

  it('shows the case type name as the document title and breadcrumb', async () => {
    await renderPage();

    await expect.poll(() => document.title).toMatch(new RegExp(`- ${COMPLETE_CASE_TYPE_NAME}$`));
    await expect.poll(() => container.resolve(BreadcrumbService).data[BREADCRUMB_POSITION]).toBe(COMPLETE_CASE_TYPE_NAME);
  });

  it('renders the dashboard once the case type is loaded', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
  });

  it('falls back to the generic case title when the case type has no name', async () => {
    mockCaseTypeApi(createCaseType({ name: '' }));
    await renderPage();

    await expect.poll(() => document.title).toMatch(/ - Case$/);
    await expect.poll(() => container.resolve(BreadcrumbService).data[BREADCRUMB_POSITION]).toBe('Case');
  });

  it('shows the generic error and no dashboard when loading the case type fails', async () => {
    mockApiRequest('GET', CASE_TYPE_PATH, () => Response.json({ message: 'failure' }, { status: 500 }));
    const screen = await renderPage();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeVisible();
    await expect.poll(() => screen.getByRole('button', { name: 'Open filters' }).query()).toBeNull();
  });
});
