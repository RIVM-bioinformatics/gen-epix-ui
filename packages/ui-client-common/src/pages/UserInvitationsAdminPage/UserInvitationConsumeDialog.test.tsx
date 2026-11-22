import { createRef } from 'react';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbUserInvitation } from '@gen-epix/api-commondb';

import { AuthenticationService } from '../../classes/services/AuthenticationService';
import { NotificationService } from '../../classes/services/NotificationService';
import {
  mockApiRequest,
  renderComponent,
} from '../../test/lib';

import { UserInvitationConsumeDialog } from './UserInvitationConsumeDialog';
import type { UserInvitationConsumeDialogRefMethods } from './UserInvitationConsumeDialog';

const TOKEN = 'invitation-token-one';
const BEARER_TOKEN = 'bearer-token-one';
const REGISTRATION_PATH = `/v1/user_registrations/${TOKEN}`;

const invitationFixture = {
  expires_at: '2030-01-15T00:00:00Z',
  id: 'invitation-1',
  invited_by_user_id: '00000000-0000-4000-8000-000000000101',
  key: 'invitee@example.test',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: ['USER'],
  token: TOKEN,
} satisfies { readonly id: string } & CommonDbUserInvitation;

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderDialog = async () => {
  const ref = createRef<UserInvitationConsumeDialogRefMethods>();
  const screen = await renderComponent(
    <UserInvitationConsumeDialog ref={ref} />,
  );
  ref.current?.open({ item: invitationFixture });
  return screen;
};

describe('UserInvitationConsumeDialog', () => {
  afterEach(() => {
    delete container.resolve(AuthenticationService).temporaryToken;
  });

  it('renders the title and the bearer token field', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Consume invitation with bearer token' })).toBeVisible();
    await expect.element(screen.getByRole('textbox')).toBeVisible();
  });

  it('consumes the invitation with the entered bearer token, notifies and closes the dialog', async () => {
    const temporaryTokensDuringRequest: (string | undefined)[] = [];
    mockApiRequest('POST', REGISTRATION_PATH, () => {
      temporaryTokensDuringRequest.push(container.resolve(AuthenticationService).temporaryToken);
      return Response.json({ id: 'user-1' });
    });
    const screen = await renderDialog();

    await screen.getByRole('textbox').fill(BEARER_TOKEN);
    await screen.getByRole('button', { name: 'Submit' }).click();

    await expect.poll(() => getNotificationMessages()).toContain('Invitation has been consumed by bearer token');
    expect(temporaryTokensDuringRequest).toStrictEqual([BEARER_TOKEN]);
    expect(container.resolve(AuthenticationService).temporaryToken).toBeUndefined();
    await expect.element(screen.getByRole('heading', { name: 'Consume invitation with bearer token' })).not.toBeInTheDocument();
  });

  it('shows the error and disables submit when consuming the invitation fails', async () => {
    mockApiRequest('POST', REGISTRATION_PATH, () => Response.json({ detail: 'Invalid token' }, { status: 422 }));
    const screen = await renderDialog();

    await screen.getByRole('textbox').fill(BEARER_TOKEN);
    await screen.getByRole('button', { name: 'Submit' }).click();

    await expect.element(screen.getByText('Unprocessable Entity.')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(container.resolve(AuthenticationService).temporaryToken).toBeUndefined();
    expect(getNotificationMessages()).not.toContain('Invitation has been consumed by bearer token');
  });
});
