import type {
  CommonDbOrganization,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import { createRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { NotificationService } from '../../../classes/services/NotificationService';
import {
  createOrganization,
  mockApiRequest,
  mockOrganizations,
  registerWindowServiceReloadSpy,
  renderComponent,
} from '../../../test/lib';

import { OrganizationSwitcherDialog } from './OrganizationSwitcherDialog';
import type { OrganizationSwitcherDialogRefMethods } from './OrganizationSwitcherDialog';

const DIALOG_TITLE = 'Switch organization';
const UPDATE_PATH = '/v1/update_user_own_organization';

const CURRENT_ORGANIZATION: CommonDbOrganization = createOrganization();
const OTHER_ORGANIZATION: CommonDbOrganization = createOrganization({
  code: 'other',
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Other organization',
});

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Example user',
  organization_id: CURRENT_ORGANIZATION.id,
  roles: [],
};

const renderDialog = async () => {
  const ref = createRef<OrganizationSwitcherDialogRefMethods>();
  const screen = await renderComponent(
    <OrganizationSwitcherDialog ref={ref} />,
  );
  ref.current?.open();
  return screen;
};

const selectOrganization = async (screen: Awaited<ReturnType<typeof renderDialog>>, organizationName: string) => {
  await screen.getByRole('combobox', { name: 'Organization' }).click();
  await screen.getByRole('option', { name: organizationName }).click();
};

const getNotifications = () => {
  return container.resolve(NotificationService).data.map((notification) => {
    return { message: notification.message, severity: notification.severity };
  });
};

describe('OrganizationSwitcherDialog', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).user = USER;
    mockOrganizations([CURRENT_ORGANIZATION, OTHER_ORGANIZATION]);
  });

  afterEach(() => {
    container.resolve(NotificationService).clearNotifications();
  });

  it('shows the title, description and the current organization preselected', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByText(DIALOG_TITLE)).toBeVisible();
    await expect.element(screen.getByText('For demo purposes, it is possible to switch your organization.', { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Organization' })).toHaveValue(CURRENT_ORGANIZATION.name);
    await expect.element(screen.getByTestId('OrganizationSwitcherDialog-close')).toBeVisible();
    await expect.element(screen.getByTestId('OrganizationSwitcherDialog-submit')).toBeVisible();
  });

  it('closes without changing the organization when cancel is clicked', async () => {
    const updateRequests: unknown[] = [];
    mockApiRequest('PUT', UPDATE_PATH, async (request) => {
      updateRequests.push(await request.json());
      return Response.json(USER);
    });
    const screen = await renderDialog();

    await screen.getByTestId('OrganizationSwitcherDialog-close').click();

    await expect.poll(() => screen.getByText(DIALOG_TITLE).query()).toBeNull();
    expect(updateRequests).toHaveLength(0);
  });

  it('changes the organization and shows a success message with the new organization name', async () => {
    const updateRequests: unknown[] = [];
    mockApiRequest('PUT', UPDATE_PATH, async (request) => {
      updateRequests.push(await request.json());
      return Response.json({ ...USER, organization_id: OTHER_ORGANIZATION.id });
    });
    const screen = await renderDialog();

    await selectOrganization(screen, OTHER_ORGANIZATION.name);
    await screen.getByTestId('OrganizationSwitcherDialog-submit').click();

    await expect.element(screen.getByText(`You are now a member of "${OTHER_ORGANIZATION.name}"`, { exact: false })).toBeVisible();
    await expect.element(screen.getByTestId('OrganizationSwitcherDialog-refresh')).toBeVisible();
    expect(updateRequests).toEqual([{ organization_id: OTHER_ORGANIZATION.id }]);
    expect(getNotifications()).toContainEqual(expect.objectContaining({ message: 'Successfully changed organization.', severity: 'success' }));
  });

  it('reloads the window when the refresh page button is clicked after a successful change', async () => {
    const reload = registerWindowServiceReloadSpy();
    mockApiRequest('PUT', UPDATE_PATH, () => Response.json({ ...USER, organization_id: OTHER_ORGANIZATION.id }));
    const screen = await renderDialog();

    await selectOrganization(screen, OTHER_ORGANIZATION.name);
    await screen.getByTestId('OrganizationSwitcherDialog-submit').click();
    await screen.getByTestId('OrganizationSwitcherDialog-refresh').click();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog when submitting the current organization', async () => {
    const updateRequests: unknown[] = [];
    mockApiRequest('PUT', UPDATE_PATH, async (request) => {
      updateRequests.push(await request.json());
      return Response.json(USER);
    });
    const screen = await renderDialog();

    await screen.getByTestId('OrganizationSwitcherDialog-submit').click();

    await expect.poll(() => screen.getByText(DIALOG_TITLE).query()).toBeNull();
    expect(updateRequests).toHaveLength(0);
  });

  it('shows an error notification and closes the dialog when the change fails', async () => {
    mockApiRequest('PUT', UPDATE_PATH, () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const screen = await renderDialog();

    await selectOrganization(screen, OTHER_ORGANIZATION.name);
    await screen.getByTestId('OrganizationSwitcherDialog-submit').click();

    await expect.poll(() => screen.getByText(DIALOG_TITLE).query()).toBeNull();
    expect(getNotifications()).toContainEqual(expect.objectContaining({ message: 'Could not change organization.', severity: 'error' }));
  });

  it('hides the actions while the change is pending', async () => {
    let releaseResponse: () => void = () => undefined;
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    mockApiRequest('PUT', UPDATE_PATH, async () => {
      await responseReleased;
      return Response.json({ ...USER, organization_id: OTHER_ORGANIZATION.id });
    });
    const screen = await renderDialog();

    await selectOrganization(screen, OTHER_ORGANIZATION.name);
    await screen.getByTestId('OrganizationSwitcherDialog-submit').click();

    await expect.poll(() => screen.getByTestId('OrganizationSwitcherDialog-submit').query()).toBeNull();
    await expect.poll(() => screen.getByTestId('OrganizationSwitcherDialog-close').query()).toBeNull();
    expect(getNotifications()).toContainEqual(expect.objectContaining({ message: 'Changing organization...', severity: 'info' }));

    releaseResponse();

    await expect.element(screen.getByText('You are now a member of', { exact: false })).toBeVisible();
  });
});
