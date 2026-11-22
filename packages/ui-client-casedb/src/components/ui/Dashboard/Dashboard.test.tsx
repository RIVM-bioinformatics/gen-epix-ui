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
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { EventBusService } from '../../../classes/services/EventBusService';
import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import { renderComponent } from '../../../test/lib';
import { COMPLETE_CASE_TYPE_ID } from '../../../test/fixtures/completeCaseType';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';

import { Dashboard } from './Dashboard';

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

const renderDashboard = async () => {
  return renderComponent(
    <Dashboard caseTypeId={COMPLETE_CASE_TYPE_ID} />, { wrapper: DashboardWrapper },
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    mockDashboardApi();
  });

  afterEach(() => {
    clearDashboardStorage();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('renders the dashboard content once the complete case type is loaded', async () => {
    const screen = await renderDashboard();

    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
  });

  it('renders the generic error message when loading the cases fails', async () => {
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ message: 'failure' }, { status: 500 }));
    const screen = await renderDashboard();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeVisible();
  });

  it('shows the edit cases view on an openEditCases event and returns to the dashboard when it is closed', async () => {
    const screen = await renderDashboard();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();

    container.resolve(EventBusService).emit('openEditCases', [createDashboardCase()]);

    await expect.element(screen.getByRole('button', { name: 'Back to line list' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Open filters' })).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Back to line list' }).click();

    await expect.element(screen.getByRole('button', { name: 'Open filters' })).toBeVisible();
  });
});
