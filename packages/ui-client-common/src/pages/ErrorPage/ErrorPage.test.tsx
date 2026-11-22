import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { ErrorPage } from './ErrorPage';

describe('ErrorPage', () => {
  it('renders the page title and the message of the error', async () => {
    const screen = await renderComponent(
      <ErrorPage error={new Error('Page failed to load')} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: Page failed to load/)).toBeVisible();
  });

  it('renders the generic message without an error', async () => {
    const screen = await renderComponent(
      <ErrorPage />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: Unknown/)).toBeVisible();
  });
});
