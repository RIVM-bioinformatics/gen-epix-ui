import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbUserInvitation,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { NotificationService } from '../../classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '../../test/lib';
import { mockOrganizations } from '../../test/fixtures/organizations';
import { mockUsers } from '../../test/fixtures/users';

import { UserInvitationsAdminPage } from './UserInvitationsAdminPage';

type UserInvitationFixture = { readonly id: string } & CommonDbUserInvitation;

const USER_INVITATIONS_PATH = '/v1/user_invitations';
const INVITE_USER_PATH = '/v1/invite_user';
const INVITE_USER_CONSTRAINTS_PATH = '/v1/invite_user/constraints';
const ORGANIZATION_ADMIN_POLICIES_PATH = '/v1/organization_admin_policies';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const INVITER_USER_ID = '00000000-0000-4000-8000-000000000101';

const USER_INVITATION_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.UserInvitationCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.UserInvitationCrudCommand, permission_type: CommonDbPermissionType.DELETE },
  { command_name: CommonDbCommandName.RetrieveInviteUserConstraintsCommand, permission_type: CommonDbPermissionType.EXECUTE },
];

const invitationOneFixture: UserInvitationFixture = {
  description: 'First invitation description',
  expires_at: '2030-01-15T00:00:00Z',
  id: 'invitation-1',
  invited_by_user_id: INVITER_USER_ID,
  key: 'invitee-one',
  organization_id: ORGANIZATION_ID,
  roles: ['USER'],
  token: 'token-one',
};

const invitationTwoFixture: UserInvitationFixture = {
  description: 'Second invitation description',
  expires_at: '2030-02-20T00:00:00Z',
  id: 'invitation-2',
  invited_by_user_id: INVITER_USER_ID,
  key: 'invitee-two',
  organization_id: ORGANIZATION_ID,
  roles: ['CURATOR'],
  token: 'token-two',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockInviteUserConstraints = (roles = ['ADMIN', 'CURATOR', 'USER']) => {
  mockApiRequest('GET', INVITE_USER_CONSTRAINTS_PATH, () => Response.json({
    organization_ids: [ORGANIZATION_ID],
    roles,
  }));
};

const renderPage = async (
  initialInvitations: UserInvitationFixture[] = [invitationOneFixture, invitationTwoFixture],
  permissions = USER_INVITATION_PERMISSIONS,
) => {
  const mock = mockCrudApi(USER_INVITATIONS_PATH, initialInvitations);
  mockOrganizations();
  mockUsers();
  mockApiRequest('GET', ORGANIZATION_ADMIN_POLICIES_PATH, () => Response.json([]));
  mockInviteUserConstraints();
  const screen = await renderRoutedPage(
    <UserInvitationsAdminPage />, { permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('UserInvitationsAdminPage', () => {
  it('lists the invitations with their key and description', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('invitee-one', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('First invitation description', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('invitee-two', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Second invitation description', { exact: true })).toBeInTheDocument();
  });

  it('invites a user and opens the share dialog for the created invitation', async () => {
    mockApiRequest('POST', INVITE_USER_PATH, async (request) => {
      const body = await request.json() as Omit<UserInvitationFixture, 'expires_at' | 'id' | 'invited_by_user_id' | 'token'>;
      return Response.json({
        ...body,
        expires_at: '2030-03-01T00:00:00Z',
        id: 'invitation-3',
        invited_by_user_id: INVITER_USER_ID,
        token: 'token-three',
      } satisfies UserInvitationFixture, { status: 201 });
    });
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Invite user' }).click();
    await expect.element(screen.getByText('Create new user invitation', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Key' }).fill('invitee-three');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Third invitation description');
    await screen.getByRole('combobox', { name: 'Organization' }).click();
    await screen.getByRole('option', { name: 'Example organization' }).click();
    await screen.getByRole('combobox', { name: 'Roles' }).click();
    await screen.getByRole('option', { name: 'USER' }).click();
    await screen.getByText('Create new user invitation', { exact: true }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Invitation details for invitee-three', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('The invitation for invitee-three will expire on', { exact: false })).toBeVisible();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('invitee-three')]));
  });

  it('omits an empty key from the invitation request', async () => {
    const requestBodies: Record<string, unknown>[] = [];
    mockApiRequest('POST', INVITE_USER_PATH, async (request) => {
      const body = await request.json() as Record<string, unknown>;
      requestBodies.push(body);
      return Response.json({
        ...body,
        expires_at: '2030-03-01T00:00:00Z',
        id: 'invitation-4',
        invited_by_user_id: INVITER_USER_ID,
        token: 'token-four',
      }, { status: 201 });
    });
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Invite user' }).click();
    await screen.getByRole('textbox', { name: 'Key' }).fill('temporary-key');
    await screen.getByRole('textbox', { name: 'Key' }).fill('');
    await screen.getByRole('combobox', { name: 'Organization' }).click();
    await screen.getByRole('option', { name: 'Example organization' }).click();
    await screen.getByRole('combobox', { name: 'Roles' }).click();
    await screen.getByRole('option', { name: 'USER' }).click();
    await screen.getByText('Create new user invitation', { exact: true }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => requestBodies.length).toBe(1);
    expect(requestBodies[0]).not.toHaveProperty('key');
    expect(requestBodies[0]?.organization_id).toBe(ORGANIZATION_ID);
    expect(requestBodies[0]?.roles).toEqual(['USER']);
    await expect.element(screen.getByText('Invitation details', { exact: true })).toBeVisible();
  });

  it('opens the share dialog from the "Send invitation" row action', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Send invitation' }).click();

    await expect.element(screen.getByText('Invitation details for invitee-one', { exact: true })).toBeVisible();
  });

  it('opens the share dialog when a row is clicked', async () => {
    const { screen } = await renderPage();

    await screen.getByText('invitee-two', { exact: true }).click();

    await expect.element(screen.getByText('Invitation details for invitee-two', { exact: true })).toBeVisible();
  });

  it('opens the consume dialog from the "Consume invitation (advanced)" row action', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Consume invitation \(advanced\)/ }).click();

    await expect.element(screen.getByText('Consume invitation with bearer token', { exact: true })).toBeVisible();
  });

  it('deletes an invitation', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${USER_INVITATIONS_PATH}/invitation-1`);
  });
});
