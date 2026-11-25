import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { CustomTabPanel } from './CustomTabPanel';

const PANEL_CONTENT = 'Panel content';

describe('CustomTabPanel', () => {
  it('renders the children when its index matches the value', async () => {
    const screen = await renderComponent(
      <CustomTabPanel
        index={1}
        value={1}
      >
        {PANEL_CONTENT}
      </CustomTabPanel>,
    );

    const panel = screen.getByRole('tabpanel');
    await expect.element(panel).toBeVisible();
    await expect.element(panel).toHaveAttribute('id', 'simple-tabpanel-1');
    await expect.element(panel).toHaveAttribute('aria-labelledby', 'simple-tab-1');
    await expect.element(screen.getByText(PANEL_CONTENT)).toBeVisible();
  });

  it('hides the panel and does not render the children when its index does not match the value', async () => {
    const screen = await renderComponent(
      <CustomTabPanel
        index={2}
        value={1}
      >
        {PANEL_CONTENT}
      </CustomTabPanel>,
    );

    const panel = screen.getByRole('tabpanel', { includeHidden: true });
    await expect.element(panel).toHaveAttribute('hidden');
    await expect.element(panel).toHaveAttribute('id', 'simple-tabpanel-2');
    await expect.element(screen.getByText(PANEL_CONTENT)).not.toBeInTheDocument();
  });
});
