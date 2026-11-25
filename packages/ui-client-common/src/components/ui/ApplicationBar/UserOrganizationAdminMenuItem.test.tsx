import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { UserOrganizationAdminMenuItem } from './UserOrganizationAdminMenuItem';

const ADMIN_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.RetrieveOrganizationAdminNameEmailsCommand,
  permission_type: CommonDbPermissionType.EXECUTE,
};

const ADMINS_PATH = '/v1/retrieve_organization_admin_name_emails';

describe('UserOrganizationAdminMenuItem', () => {
  it('renders nothing without the organization admin permission', async () => {
    const screen = await renderComponent(
      <UserOrganizationAdminMenuItem />,
    );

    expect(screen.getByText('My organizations admins').query()).toBeNull();
  });

  it('shows a loading state while the organization admins are requested', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    let releaseResponse: (admins: unknown[]) => void = () => undefined;
    const responseGate = new Promise<unknown[]>((resolve) => {
      releaseResponse = resolve;
    });
    mockApiRequest('GET', ADMINS_PATH, async () => Response.json(await responseGate));
    const screen = await renderComponent(
      <UserOrganizationAdminMenuItem />,
    );

    await expect.element(screen.getByText('My organizations admins')).toBeVisible();
    await expect.element(screen.getByText('Loading...')).toBeVisible();

    releaseResponse([]);
    await expect.poll(() => screen.getByText('Loading...').query()).toBeNull();
  });

  it('shows an error when the organization admins cannot be loaded', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    mockApiRequest('GET', ADMINS_PATH, () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const screen = await renderComponent(
      <UserOrganizationAdminMenuItem />,
    );

    await expect.element(screen.getByText('Error loading organization admins')).toBeVisible();
  });

  it('renders each organization admin as a mailto link labelled by name', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    mockApiRequest('GET', ADMINS_PATH, () => Response.json([
      { email: 'ada@example.com', id: '00000000-0000-4000-8000-000000000020', name: 'Ada Admin' },
    ]));
    const screen = await renderComponent(
      <UserOrganizationAdminMenuItem />,
    );

    await expect.element(screen.getByRole('link', { name: 'Ada Admin' })).toHaveAttribute('href', 'mailto:ada@example.com');
  });

  it('falls back to the email address when an organization admin has no name', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    mockApiRequest('GET', ADMINS_PATH, () => Response.json([
      { email: 'grace@example.com', id: '00000000-0000-4000-8000-000000000021' },
    ]));
    const screen = await renderComponent(
      <UserOrganizationAdminMenuItem />,
    );

    await expect.element(screen.getByRole('link', { name: 'grace@example.com' })).toHaveAttribute('href', 'mailto:grace@example.com');
  });
});
