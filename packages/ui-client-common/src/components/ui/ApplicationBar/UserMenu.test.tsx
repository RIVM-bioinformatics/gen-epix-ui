import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type {
  MouseEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useState,
} from 'react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthContext } from 'react-oidc-context';
import type { AuthContextProps } from 'react-oidc-context';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import {
  createOrganization,
  mockApiRequest,
  mockOrganizations,
  renderComponent,
} from '../../../test/lib';

import { UserMenu } from './UserMenu';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  key: 'example.user',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: ['reader', 'curator'],
};

const ADMIN_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.RetrieveOrganizationAdminNameEmailsCommand,
  permission_type: CommonDbPermissionType.EXECUTE,
};

const createAuth = (overrides: Record<string, unknown> = {}): AuthContextProps => ({
  isAuthenticated: true,
  signoutRedirect: vi.fn(async () => Promise.resolve()),
  user: undefined,
  ...overrides,
}) as unknown as AuthContextProps;

const UserMenuHarness = ({ onClose }: { readonly onClose: () => void }): ReactElement => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const onOpenButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  }, []);

  const onUserMenuClose = useCallback(() => {
    setAnchorElement(null);
    onClose();
  }, [onClose]);

  return (
    <>
      <button
        onClick={onOpenButtonClick}
        type={'button'}
      >
        {'Open user menu'}
      </button>
      <UserMenu
        anchorElement={anchorElement}
        onClose={onUserMenuClose}
      />
    </>
  );
};

const renderUserMenu = async (auth: AuthContextProps = createAuth(), onClose = vi.fn()) => renderComponent(
  <AuthContext value={auth}>
    <UserMenuHarness onClose={onClose} />
  </AuthContext>,
);

describe('UserMenu', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).user = USER;
  });

  it('renders nothing while no anchor element is provided', async () => {
    const screen = await renderComponent(
      <AuthContext value={createAuth()}>
        <UserMenu
          anchorElement={null}
          onClose={vi.fn()}
        />
      </AuthContext>,
    );

    expect(screen.getByTestId('UserMenu').query()).toBeNull();
  });

  it('renders the current user name and key', async () => {
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByTestId('UserMenu')).toBeVisible();
    await expect.element(screen.getByText('Example user (example.user)')).toBeVisible();
  });

  it('renders a fallback user name when no user is known', async () => {
    container.resolve(AuthorizationService).user = undefined;
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('Unknown user')).toBeVisible();
  });

  it('renders the roles of the current user', async () => {
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('My roles')).toBeVisible();
    await expect.element(screen.getByText('reader', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('curator', { exact: true })).toBeVisible();
  });

  it('renders no roles when the user has none', async () => {
    container.resolve(AuthorizationService).user = { ...USER, roles: [] };
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('My roles')).toBeVisible();
    expect(screen.getByText('reader', { exact: true }).query()).toBeNull();
  });

  it('renders the own organization of the current user', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    mockOrganizations([createOrganization({ name: 'Example organization' })]);
    mockApiRequest('GET', '/v1/retrieve_organization_admin_name_emails', () => Response.json([]));
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('My organization', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Example organization')).toBeVisible();
  });

  it('hides the organization items without the admin permission', async () => {
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('Example user (example.user)')).toBeVisible();
    expect(screen.getByText('My organization', { exact: true }).query()).toBeNull();
    expect(screen.getByText('My organizations admins').query()).toBeNull();
  });

  it('renders the organization admins with the admin permission', async () => {
    container.resolve(AuthorizationService).apiPermissions = [ADMIN_PERMISSION];
    mockOrganizations();
    mockApiRequest('GET', '/v1/retrieve_organization_admin_name_emails', () => Response.json([
      { email: 'ada@example.com', id: '00000000-0000-4000-8000-000000000020', name: 'Ada Admin' },
    ]));
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();

    await expect.element(screen.getByText('My organizations admins')).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Ada Admin' })).toBeVisible();
  });

  it('opens the API permissions dialog when My API permissions is clicked', async () => {
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();
    await screen.getByText('My API permissions').click();

    await expect.element(screen.getByText('My Permissions', { exact: true })).toBeVisible();
  });

  it('asks for confirmation when Logout is clicked', async () => {
    mockOrganizations();
    const screen = await renderUserMenu();

    await screen.getByText('Open user menu').click();
    await screen.getByText('Logout', { exact: true }).click();

    await expect.element(screen.getByText('Are you sure you want to logout?')).toBeVisible();
  });

  it('does not log out when the logout confirmation is cancelled', async () => {
    mockOrganizations();
    const auth = createAuth();
    const screen = await renderUserMenu(auth);

    await screen.getByText('Open user menu').click();
    await screen.getByText('Logout', { exact: true }).click();
    await expect.element(screen.getByText('Are you sure you want to logout?')).toBeVisible();
    await screen.getByText('Cancel', { exact: true }).click();

    await expect.poll(() => screen.getByText('Are you sure you want to logout?').query()).toBeNull();
    expect(auth.signoutRedirect).not.toHaveBeenCalled();
  });

  it('signs out when the logout confirmation is confirmed', async () => {
    mockOrganizations();
    const auth = createAuth();
    const screen = await renderUserMenu(auth);

    await screen.getByText('Open user menu').click();
    await screen.getByText('Logout', { exact: true }).click();
    await expect.element(screen.getByText('Are you sure you want to logout?')).toBeVisible();
    await screen.getByText('Logout', { exact: true }).last().click();

    await expect.poll(() => vi.mocked(auth.signoutRedirect).mock.calls.length).toBe(1);
  });
});
