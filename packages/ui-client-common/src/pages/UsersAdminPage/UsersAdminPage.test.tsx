import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { NotificationService } from '../../classes/services/NotificationService';
import { createUser } from '../../test/fixtures/users';
import {
  mockApiRequest,
  mockCrudApi,
  mockOrganizations,
  renderRoutedPage,
} from '../../test/lib';
import type { MockCrudApiCall } from '../../test/requests/mockCrudApi';

import { UsersAdminPage } from './UsersAdminPage';

type UserFixture = { readonly id: string } & CommonDbUser;

const USERS_PATH = '/v1/users';
const UPDATE_USER_PATH = '/v1/update_user';
const INVITE_USER_CONSTRAINTS_PATH = '/v1/invite_user/constraints';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const LOGGED_IN_USER_EMAIL = 'admin@example.test';

const USER_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.UpdateUserCommand, permission_type: CommonDbPermissionType.EXECUTE },
  { command_name: CommonDbCommandName.UserCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const ANONYMIZE_PERMISSIONS: CommonDbApiPermission[] = [
  ...USER_PERMISSIONS,
  { command_name: CommonDbCommandName.AnonymizeUserCommand, permission_type: CommonDbPermissionType.EXECUTE },
];

const CONSTRAINTS_PERMISSIONS: CommonDbApiPermission[] = [
  ...USER_PERMISSIONS,
  { command_name: CommonDbCommandName.RetrieveInviteUserConstraintsCommand, permission_type: CommonDbPermissionType.EXECUTE },
];

const aliceFixture: UserFixture = createUser({
  email: 'alice@example.test',
  id: 'user-1',
  is_active: true,
  key: 'alice',
  name: 'Alice',
  roles: ['USER'],
});

const bobFixture: UserFixture = createUser({
  email: 'bob@example.test',
  id: 'user-2',
  is_active: false,
  key: 'bob',
  name: 'Bob',
  roles: ['ADMIN'],
});

const ownUserFixture: UserFixture = createUser({
  email: LOGGED_IN_USER_EMAIL,
  id: 'user-admin',
  key: 'admin',
  name: 'Zed',
  roles: ['ADMIN'],
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const setLoggedInUser = (roles: string[] = ['ADMIN']) => {
  container.resolve(AuthorizationService).user = createUser({
    email: LOGGED_IN_USER_EMAIL,
    id: 'user-admin',
    key: 'admin',
    name: 'Admin',
    roles,
  });
};

const mockInviteUserConstraints = (roles = ['ADMIN', 'CURATOR', 'USER']) => {
  mockApiRequest('GET', INVITE_USER_CONSTRAINTS_PATH, () => Response.json({ organization_ids: [ORGANIZATION_ID], roles }));
};

const mockUpdateUserEndpoints = (mock: { calls: MockCrudApiCall[]; items: UserFixture[] }, users: UserFixture[]) => {
  users.forEach(({ id }) => {
    const updatePath = `${UPDATE_USER_PATH}/${id}`;
    mockApiRequest('PUT', updatePath, async (request) => {
      const body = await request.json() as Partial<UserFixture>;
      mock.calls.push({ body, method: 'PUT', pathname: updatePath });
      const index = mock.items.findIndex((item) => item.id === id);
      const updated = { ...mock.items[index], ...body, id } as UserFixture;
      mock.items[index] = updated;
      return Response.json(updated);
    });
  });
};

const renderPage = async ({
  initialUsers = [aliceFixture, bobFixture],
  loggedInUserRoles = ['ADMIN'],
  permissions = USER_PERMISSIONS,
}: {
  initialUsers?: UserFixture[];
  loggedInUserRoles?: string[];
  permissions?: CommonDbApiPermission[];
} = {}) => {
  setLoggedInUser(loggedInUserRoles);
  mockOrganizations();
  mockInviteUserConstraints();
  const mock = mockCrudApi(USERS_PATH, initialUsers);
  mockUpdateUserEndpoints(mock, initialUsers);
  const screen = await renderRoutedPage(
    <UsersAdminPage />, { permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForFirstRow = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
};

describe('UsersAdminPage', () => {
  it('lists the users with their email, key, name and roles', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('alice@example.test', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('alice', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('bob@example.test', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Bob', { exact: true })).toBeInTheDocument();
  });

  it('edits a user and saves the active flag and roles', async () => {
    const { mock, screen } = await renderPage();

    await openEditDialogForFirstRow(screen);
    await expect.element(screen.getByText('Edit item: alice@example.test', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Is active' }).click();
    await screen.getByRole('option', { exact: true, name: 'No' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${UPDATE_USER_PATH}/user-1`);
    expect(putCall?.body).toEqual({
      is_active: false,
      organization_id: ORGANIZATION_ID,
      roles: ['USER'],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a user and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${USERS_PATH}/user-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the delete action without DELETE permission', async () => {
    const { screen } = await renderPage({ permissions: [] });

    await expect.element(screen.getByText('alice@example.test', { exact: true })).toBeInTheDocument();
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('hides the anonymize action without AnonymizeUserCommand permission', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: /Anonymize user$/ })).not.toBeInTheDocument();
  });

  it('anonymizes a user after confirmation and reports success', async () => {
    const anonymizedPaths: string[] = [];
    mockApiRequest('POST', '/v1/user/user-1/anonymize', () => {
      anonymizedPaths.push('/v1/user/user-1/anonymize');
      return new Response(null, { status: 204 });
    });
    const { screen } = await renderPage({ permissions: ANONYMIZE_PERMISSIONS });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Anonymize user$/ }).click();
    await expect.element(screen.getByText('Are you sure you want to anonymize this user?', { exact: true })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Anonymize' }).click();

    await expect.poll(() => anonymizedPaths).toEqual(['/v1/user/user-1/anonymize']);
    await expect.poll(getNotificationMessages).toEqual(['User anonymized successfully: alice@example.test']);
  });

  it('reports an error when anonymizing a user fails', async () => {
    mockApiRequest('POST', '/v1/user/user-1/anonymize', () => new Response(null, { status: 500 }));
    const { screen } = await renderPage({ permissions: ANONYMIZE_PERMISSIONS });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Anonymize user$/ }).click();
    await screen.getByRole('button', { exact: true, name: 'Anonymize' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Error anonymizing user: alice@example.test']));
  });

  it('uses the key as the user name when anonymizing a user without an email', async () => {
    const keyOnlyUserFixture: UserFixture = createUser({ email: null, id: 'user-3', key: 'carol', name: 'Carol' });
    mockApiRequest('POST', '/v1/user/user-3/anonymize', () => new Response(null, { status: 204 }));
    const { screen } = await renderPage({ initialUsers: [keyOnlyUserFixture], permissions: ANONYMIZE_PERMISSIONS });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Anonymize user$/ }).click();
    await screen.getByRole('button', { exact: true, name: 'Anonymize' }).click();

    await expect.poll(getNotificationMessages).toEqual(['User anonymized successfully: carol']);
  });

  it('disables saving the logged-in user own record', async () => {
    const { screen } = await renderPage({ initialUsers: [aliceFixture, ownUserFixture] });

    await screen.getByRole('button', { name: 'Row actions' }).last().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('keeps saving enabled for user records other than the logged-in user', async () => {
    const { screen } = await renderPage({ initialUsers: [aliceFixture, ownUserFixture] });

    await openEditDialogForFirstRow(screen);
    await expect.element(screen.getByText('Edit item: alice@example.test', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('offers the invite user constraint roles when the user may retrieve them', async () => {
    const { screen } = await renderPage({ permissions: CONSTRAINTS_PERMISSIONS });

    await openEditDialogForFirstRow(screen);
    await screen.getByRole('combobox', { name: 'Roles' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: 'CURATOR' })).toBeInTheDocument();
  });

  it('offers only the table roles when the user may not retrieve the invite user constraints', async () => {
    const { screen } = await renderPage();

    await openEditDialogForFirstRow(screen);
    await screen.getByRole('combobox', { name: 'Roles' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: 'ADMIN' })).toBeInTheDocument();
    await expect.element(screen.getByRole('option', { exact: true, name: 'USER' })).toBeInTheDocument();
    expect(screen.getByRole('option', { exact: true, name: 'CURATOR' }).query()).toBeNull();
  });

  it('keeps the logged-in user own roles as disabled options when they are not offered', async () => {
    const { screen } = await renderPage({ loggedInUserRoles: ['LEGACY'], permissions: CONSTRAINTS_PERMISSIONS });

    await openEditDialogForFirstRow(screen);
    await screen.getByRole('combobox', { name: 'Roles' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: 'LEGACY' })).toHaveAttribute('aria-disabled', 'true');
  });
});
