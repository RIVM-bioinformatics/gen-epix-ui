import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';
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
  createOrganization,
  mockApiRequest,
  mockOrganizations,
  renderComponent,
} from '../../../test/lib';

import { UserOwnOrganizationMenuItem } from './UserOwnOrganizationMenuItem';

const ADMIN_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.RetrieveOrganizationAdminNameEmailsCommand,
  permission_type: CommonDbPermissionType.EXECUTE,
};

const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000002';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  key: 'example.user',
  name: 'Example user',
  organization_id: ORGANIZATION_ID,
  roles: [],
};

describe('UserOwnOrganizationMenuItem', () => {
  it('renders nothing without the organization admin permission', async () => {
    container.resolve(AuthorizationService).user = USER;
    mockOrganizations([createOrganization({ id: ORGANIZATION_ID, name: 'Example organization' })]);
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    expect(screen.getByText('My organization', { exact: true }).query()).toBeNull();
  });

  it('shows a loading state while the organizations are requested', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    container.resolve(AuthorizationService).user = USER;
    let releaseResponse: (organizations: unknown[]) => void = () => undefined;
    const responseGate = new Promise<unknown[]>((resolve) => {
      releaseResponse = resolve;
    });
    mockApiRequest('GET', '/v1/organizations', async () => Response.json(await responseGate));
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    await expect.element(screen.getByText('My organization', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Loading...')).toBeVisible();

    releaseResponse([]);
    await expect.poll(() => screen.getByText('Loading...').query()).toBeNull();
  });

  it('shows an error when the organizations cannot be loaded', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    container.resolve(AuthorizationService).user = USER;
    mockApiRequest('GET', '/v1/organizations', () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    await expect.element(screen.getByText('Error', { exact: true })).toBeVisible();
  });

  it('renders the name of the own organization of the current user', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    container.resolve(AuthorizationService).user = USER;
    mockOrganizations([
      createOrganization({ id: OTHER_ORGANIZATION_ID, name: 'Other organization' }),
      createOrganization({ id: ORGANIZATION_ID, name: 'Example organization' }),
    ]);
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    await expect.element(screen.getByText('My organization', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Example organization', { exact: true })).toBeVisible();
  });

  it('shows Unknown when the organization of the current user is not listed', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    container.resolve(AuthorizationService).user = USER;
    mockOrganizations([createOrganization({ id: OTHER_ORGANIZATION_ID, name: 'Other organization' })]);
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    await expect.element(screen.getByText('Unknown', { exact: true })).toBeVisible();
  });

  it('shows Unknown when no user is known', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    container.resolve(AuthorizationService).user = undefined;
    mockOrganizations([createOrganization({ id: ORGANIZATION_ID, name: 'Example organization' })]);
    const screen = await renderComponent(
      <UserOwnOrganizationMenuItem />,
    );

    await expect.element(screen.getByText('Unknown', { exact: true })).toBeVisible();
  });
});
