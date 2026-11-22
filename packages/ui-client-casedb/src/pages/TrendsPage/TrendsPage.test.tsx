import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { TrendsPage } from './TrendsPage';

describe('TrendsPage', () => {
  it('renders the statistics title and content', async () => {
    const screen = await renderComponent(
      <TrendsPage />,
    );

    await expect.element(screen.getByTestId('TrendsPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Statistics', { exact: true }).first()).toBeVisible();
  });
});
