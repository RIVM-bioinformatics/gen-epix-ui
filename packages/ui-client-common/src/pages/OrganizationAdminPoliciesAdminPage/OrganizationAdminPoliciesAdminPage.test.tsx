import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbOrganizationAdminPolicy,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { NotificationService } from '../../classes/services/NotificationService';
import {
  createOrganization,
  mockOrganizations,
} from '../../test/fixtures/organizations';
import {
  createUser,
  mockUsers,
} from '../../test/fixtures/users';
import {
  mockCrudApi,
  renderRoutedPage,
} from '../../test/lib';

import { OrganizationAdminPoliciesAdminPage } from './OrganizationAdminPoliciesAdminPage';

type PolicyFixture = { readonly id: string } & CommonDbOrganizationAdminPolicy;

const POLICIES_PATH = '/v1/organization_admin_policies';

const ORGANIZATION_ONE_ID = '00000000-0000-4000-8000-000000000001';
const ORGANIZATION_TWO_ID = '00000000-0000-4000-8000-000000000002';
const USER_ONE_ID = '00000000-0000-4000-8000-000000000101';
const USER_TWO_ID = '00000000-0000-4000-8000-000000000102';

const ORGANIZATION_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.OrganizationAdminPolicyCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.OrganizationAdminPolicyCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.OrganizationAdminPolicyCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const organizationOneFixture = createOrganization({ code: 'ORG-A', id: ORGANIZATION_ONE_ID, name: 'Organization A' });
const organizationTwoFixture = createOrganization({ code: 'ORG-B', id: ORGANIZATION_TWO_ID, name: 'Organization B' });
const userOneFixture = createUser({ id: USER_ONE_ID, key: 'user-one', name: 'User One' });
const userTwoFixture = createUser({ id: USER_TWO_ID, key: 'user-two', name: 'User Two' });

const policyOneFixture: PolicyFixture = {
  id: 'policy-1',
  is_active: true,
  organization_id: ORGANIZATION_ONE_ID,
  user_id: USER_ONE_ID,
};

const policyTwoFixture: PolicyFixture = {
  id: 'policy-2',
  is_active: false,
  organization_id: ORGANIZATION_TWO_ID,
  user_id: USER_TWO_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: PolicyFixture[] = [policyOneFixture, policyTwoFixture], permissions = ORGANIZATION_PERMISSIONS) => {
  mockOrganizations([organizationOneFixture, organizationTwoFixture]);
  mockUsers([userOneFixture, userTwoFixture]);
  const mock = mockCrudApi(POLICIES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <OrganizationAdminPoliciesAdminPage />, { permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('OrganizationAdminPoliciesAdminPage', () => {
  it('lists the policies with their organization and user names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('Organization A', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Organization B', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('User One (user-one)', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('User Two (user-two)', { exact: true })).toBeInTheDocument();
  });

  it('creates a policy with the selected organization, user and active flag', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new organization admin policy', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Organization' }).click();
    await screen.getByRole('option', { name: 'Organization B' }).click();
    await screen.getByRole('combobox', { name: 'User' }).click();
    await screen.getByRole('option', { name: 'User One (user-one)' }).click();
    await screen.getByRole('combobox', { name: 'Active' }).click();
    await screen.getByRole('option', { name: 'Yes' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({
      is_active: true,
      organization_id: ORGANIZATION_TWO_ID,
      user_id: USER_ONE_ID,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a policy and saves the changed user', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Organization A -> User One (user-one)', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'User' }).click();
    await screen.getByRole('option', { name: 'User Two (user-two)' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${POLICIES_PATH}/policy-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ is_active: true, organization_id: ORGANIZATION_ONE_ID, user_id: USER_TWO_ID }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a policy and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${POLICIES_PATH}/policy-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([policyOneFixture], []);

    await expect.element(screen.getByText('Organization A', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
  });
});
