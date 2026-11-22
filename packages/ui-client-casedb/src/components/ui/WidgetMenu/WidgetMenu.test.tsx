import type { MenuItemData } from '@gen-epix/ui-core-components/models/nested-menu.models';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';

import { WidgetMenu } from './WidgetMenu';

describe('WidgetMenu', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('should render a provided React element as is', async () => {
    const screen = await renderComponent(<WidgetMenu menu={<span>Custom menu</span>} />);

    await expect.element(screen.getByText('Custom menu')).toBeInTheDocument();
  });

  it('should render nothing for a value that is neither an element nor a menu', async () => {
    const screen = await renderComponent(<WidgetMenu menu={'not a menu'} />);

    await expect.poll(() => screen.getByRole('button').query()).toBeNull();
  });

  it('should render plain items as icon buttons that run their callback on click', async () => {
    const callback = vi.fn();
    const menu: MenuItemData[] = [
      {
        callback,
        label: 'Plain action',
        leftIcon: <span>left</span>,
        uid: 'plain-action',
      },
    ];
    const screen = await renderComponent(<WidgetMenu menu={menu} />);

    await screen.getByRole('button', { name: 'Plain action' }).click();

    await expect.poll(() => callback.mock.calls.length).toBe(1);
  });

  it('should render a disabled plain item as a disabled icon button', async () => {
    const menu: MenuItemData[] = [
      {
        callback: vi.fn(),
        disabled: true,
        label: 'Disabled action',
        rightIcon: <span>right</span>,
      },
    ];
    const screen = await renderComponent(<WidgetMenu menu={menu} />);

    await expect.element(screen.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
  });

  it('should render a plain item without an icon as an icon button with its label', async () => {
    const callback = vi.fn();
    const menu: MenuItemData[] = [
      {
        callback,
        label: 'No icon action',
      },
    ];
    const screen = await renderComponent(<WidgetMenu menu={menu} />);

    await screen.getByRole('button', { name: 'No icon action' }).click();

    await expect.poll(() => callback.mock.calls.length).toBe(1);
  });

  it('should render an item with children as a dropdown that lists its items', async () => {
    const callback = vi.fn();
    const menu: MenuItemData[] = [
      {
        items: [
          {
            callback,
            label: 'Nested action',
            uid: 'nested-action',
          },
        ],
        label: 'Nested menu',
      },
    ];
    const screen = await renderComponent(<WidgetMenu menu={menu} />);

    await screen.getByRole('button', { name: 'Nested menu' }).click();
    await screen.getByRole('menuitem', { name: 'Nested action' }).click();

    await expect.poll(() => callback.mock.calls.length).toBe(1);
  });

  it('should render a disabled dropdown when the item is disabled', async () => {
    const menu: MenuItemData[] = [
      {
        disabled: true,
        items: [
          {
            callback: vi.fn(),
            label: 'Hidden nested action',
          },
        ],
        label: 'Disabled nested menu',
      },
    ];
    const screen = await renderComponent(<WidgetMenu menu={menu} />);

    await expect.element(screen.getByRole('button', { name: 'Disabled nested menu' })).toBeDisabled();
  });
});
