import { createRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbUserInvitation } from '@gen-epix/api-commondb';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { renderComponent } from '../../test/lib';

import { UserInvitationShareDialog } from './UserInvitationShareDialog';
import type { UserInvitationShareDialogRefMethods } from './UserInvitationShareDialog';

const invitationFixture = {
  description: 'Invitation description',
  expires_at: '2030-01-15T00:00:00Z',
  id: 'invitation-1',
  invited_by_user_id: '00000000-0000-4000-8000-000000000101',
  key: 'invitee@example.test',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: ['USER'],
  token: 'token-one',
} satisfies { readonly id: string } & CommonDbUserInvitation;

const getExpectedInvitationLink = () => {
  const url = new URL(container.resolve(WindowService).window.location.href);
  url.search = '';
  url.hash = '';
  url.pathname = `/accept-invitation/${invitationFixture.token}`;
  return url.toString();
};

const renderDialog = async () => {
  const ref = createRef<UserInvitationShareDialogRefMethods>();
  const screen = await renderComponent(
    <UserInvitationShareDialog ref={ref} />,
  );
  ref.current?.open({ item: invitationFixture });
  return screen;
};

describe('UserInvitationShareDialog', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('renders the title with the invitee key', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Invitation details for invitee@example.test' })).toBeVisible();
  });

  it('renders the expiry date and the invitation link', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByText(/The invitation for invitee@example\.test will expire on/)).toBeVisible();
    await expect.element(screen.getByText(`Invitation link: ${getExpectedInvitationLink()}`, { exact: true })).toBeVisible();
  });

  it('renders a mailto link that contains the invitee and the invitation link', async () => {
    const screen = await renderDialog();

    const emailLink = screen.getByRole('link', { name: 'Email invitation link' });
    await expect.element(emailLink).toBeVisible();
    const href = emailLink.element().getAttribute('href') ?? '';

    expect(href).toMatch(/^mailto:\?subject=/);
    expect(href).toContain('to=invitee@example.test');
    expect(decodeURIComponent(href)).toContain(getExpectedInvitationLink());
  });

  it('copies the invitation link to the clipboard', async () => {
    const screen = await renderDialog();

    await screen.getByRole('button', { name: 'Copy invitation link to clipboard' }).click();

    expect(writeText).toHaveBeenCalledExactlyOnceWith(getExpectedInvitationLink());
  });
});
