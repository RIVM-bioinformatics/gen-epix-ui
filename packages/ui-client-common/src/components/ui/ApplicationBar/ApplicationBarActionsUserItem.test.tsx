import { container } from 'tsyringe';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarActionsUserItem } from './ApplicationBarActionsUserItem';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  key: 'example.user',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

describe('ApplicationBarActionsUserItem', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).user = USER;
  });

  it('renders the account button', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsUserItem />,
    );

    await expect.element(screen.getByTitle('Account')).toBeVisible();
  });

  it('does not render the user menu before the button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsUserItem />,
    );

    expect(screen.getByTestId('UserMenu').query()).toBeNull();
  });

  it('opens the user menu with the current user when the account button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsUserItem />,
    );

    await screen.getByTitle('Account').click();

    await expect.element(screen.getByTestId('UserMenu')).toBeVisible();
    await expect.element(screen.getByText('Example user (example.user)')).toBeVisible();
  });

  it('closes the user menu when Escape is pressed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsUserItem />,
    );

    await screen.getByTitle('Account').click();
    await expect.element(screen.getByTestId('UserMenu')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.poll(() => screen.getByTestId('UserMenu').query()).toBeNull();
  });

  it('reopens the user menu after it was closed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsUserItem />,
    );

    await screen.getByTitle('Account').click();
    await expect.element(screen.getByTestId('UserMenu')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => screen.getByTestId('UserMenu').query()).toBeNull();

    await screen.getByTitle('Account').click();

    await expect.element(screen.getByTestId('UserMenu')).toBeVisible();
  });
});
