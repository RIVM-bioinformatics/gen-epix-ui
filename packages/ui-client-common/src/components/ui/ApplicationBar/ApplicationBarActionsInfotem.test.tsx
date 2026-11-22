import {
  describe,
  expect,
  it,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { renderComponent } from '../../../test/lib';

import { ApplicationBarActionsInfoItem } from './ApplicationBarActionsInfotem';

describe('ApplicationBarActionsInfoItem', () => {
  it('renders the code information button', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsInfoItem />,
    );

    await expect.element(screen.getByTitle('Code information')).toBeVisible();
  });

  it('does not render the info menu before the button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsInfoItem />,
    );

    expect(screen.getByTestId('InfoMenu').query()).toBeNull();
  });

  it('opens the info menu when the code information button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsInfoItem />,
    );

    await screen.getByTitle('Code information').click();

    await expect.element(screen.getByTestId('InfoMenu')).toBeVisible();
    await expect.element(screen.getByText('Frontend version')).toBeVisible();
    await expect.element(screen.getByText('Backend version')).toBeVisible();
  });

  it('closes the info menu when Escape is pressed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsInfoItem />,
    );

    await screen.getByTitle('Code information').click();
    await expect.element(screen.getByTestId('InfoMenu')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.poll(() => screen.getByTestId('InfoMenu').query()).toBeNull();
  });

  it('reopens the info menu after it was closed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsInfoItem />,
    );

    await screen.getByTitle('Code information').click();
    await expect.element(screen.getByTestId('InfoMenu')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => screen.getByTestId('InfoMenu').query()).toBeNull();

    await screen.getByTitle('Code information').click();

    await expect.element(screen.getByTestId('InfoMenu')).toBeVisible();
  });
});
