import {
  describe,
  expect,
  it,
} from 'vitest';

import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { SidebarMenu } from './SidebarMenu';

const SPACING_PX = 8;
const CONFIGURED_MENU_WIDTH = 6;
const MENU_ITEM_TEXT = 'Menu item';

describe('SidebarMenu', () => {
  it('renders its children inside the menu root', async () => {
    const screen = await renderComponent(
      <SidebarMenu>
        <span>
          {MENU_ITEM_TEXT}
        </span>
      </SidebarMenu>,
    );

    await expect.element(screen.getByTestId('SidebarMenu')).toBeVisible();
    await expect.element(screen.getByTestId('SidebarMenu').getByText(MENU_ITEM_TEXT)).toBeVisible();
  });

  it('applies the width from the configured sidebar menu width', async () => {
    const screen = await renderComponent(
      <SidebarMenu>
        <span>
          {MENU_ITEM_TEXT}
        </span>
      </SidebarMenu>,
      {
        configure: (config: ConfigBase) => {
          config.layout.SIDEBAR_MENU_WIDTH = CONFIGURED_MENU_WIDTH;
        },
      },
    );

    await expect.element(screen.getByTestId('SidebarMenu')).toHaveStyle({
      width: `${CONFIGURED_MENU_WIDTH * SPACING_PX}px`,
    });
  });

  it('is positioned along the full height of the left edge above the content', async () => {
    const screen = await renderComponent(
      <SidebarMenu>
        <span>
          {MENU_ITEM_TEXT}
        </span>
      </SidebarMenu>,
    );

    await expect.element(screen.getByTestId('SidebarMenu')).toHaveStyle({
      bottom: '0px',
      display: 'flex',
      flexDirection: 'column',
      left: '0px',
      position: 'absolute',
      top: '0px',
      zIndex: '2',
    });
  });
});
