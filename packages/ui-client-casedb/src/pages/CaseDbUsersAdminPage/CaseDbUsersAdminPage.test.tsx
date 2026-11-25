import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import {
  mockApiRequest,
  mockCrudApi,
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { container } from 'tsyringe';

import { CaseDbUsersAdminPage } from './CaseDbUsersAdminPage';

const USERS_PATH = '/v1/users';
const INVITE_USER_CONSTRAINTS_PATH = '/v1/invite_user/constraints';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';

const createUser = (overrides: Partial<CommonDbUser> = {}): { id: string } & CommonDbUser => ({
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: ORGANIZATION_ID,
  roles: [],
  ...overrides,
});

const EFFECTIVE_RIGHTS_READ_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.UserShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const USER_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.UpdateUserCommand, permission_type: CommonDbPermissionType.EXECUTE },
  { command_name: CommonDbCommandName.UserCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const USER_FIXTURE = createUser({
  email: 'alice@example.test',
  id: 'user-1',
  is_active: true,
  key: 'alice',
  name: 'Alice',
  roles: ['USER'],
});

const TEST_PAGE_LABEL = 'Test effective rights';
const VIEW_PAGE_LABEL = 'View effective rights';

const renderPage = async (permissions: (CaseDbApiPermission | CommonDbApiPermission)[]) => {
  container.resolve(AuthorizationService).user = createUser({
    email: 'admin@example.test',
    id: 'user-admin',
    key: 'admin',
    name: 'Admin',
    roles: ['ADMIN'],
  });
  mockOrganizations();
  mockApiRequest('GET', INVITE_USER_CONSTRAINTS_PATH, () => Response.json({ organization_ids: [ORGANIZATION_ID], roles: ['ADMIN', 'USER'] }));
  mockCrudApi(USERS_PATH, [USER_FIXTURE]);
  return await renderRoutedPage(
    <CaseDbUsersAdminPage />, { permissions: permissions as CommonDbApiPermission[] },
  );
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('CaseDbUsersAdminPage', () => {
  it('shows the effective rights sub-pages when the user has all READ permissions', async () => {
    const screen = await renderPage([...USER_PERMISSIONS, ...EFFECTIVE_RIGHTS_READ_PERMISSIONS]);
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: TEST_PAGE_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: VIEW_PAGE_LABEL })).toBeVisible();
  });

  it('navigates to the effective rights page of the user when that sub-page is clicked', async () => {
    const screen = await renderPage([...USER_PERMISSIONS, ...EFFECTIVE_RIGHTS_READ_PERMISSIONS]);
    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: VIEW_PAGE_LABEL }).click();
    await expect.poll(() => window.location.pathname).toBe(`/management/users/${USER_FIXTURE.id}/effective-rights`);
  });

  it('navigates to the effective rights tester page of the user when that sub-page is clicked', async () => {
    const screen = await renderPage([...USER_PERMISSIONS, ...EFFECTIVE_RIGHTS_READ_PERMISSIONS]);
    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: TEST_PAGE_LABEL }).click();
    await expect.poll(() => window.location.pathname).toBe(`/management/users/${USER_FIXTURE.id}/effective-rights-tester`);
  });

  it('hides the effective rights sub-pages when the user lacks the READ permissions', async () => {
    const screen = await renderPage(USER_PERMISSIONS);
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.poll(() => screen.getByRole('menuitem', { name: TEST_PAGE_LABEL }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('menuitem', { name: VIEW_PAGE_LABEL }).query()).toBeNull();
  });

  it('hides the effective rights sub-pages when one of the READ permissions is missing', async () => {
    const screen = await renderPage([...USER_PERMISSIONS, ...EFFECTIVE_RIGHTS_READ_PERMISSIONS.slice(1)]);
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.poll(() => screen.getByRole('menuitem', { name: TEST_PAGE_LABEL }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('menuitem', { name: VIEW_PAGE_LABEL }).query()).toBeNull();
  });
});
