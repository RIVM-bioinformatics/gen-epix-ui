import { createRef } from 'react';
import {
  expect,
  it,
  vi,
} from 'vitest';
import MenuList from '@mui/material/MenuList';

import { renderComponent } from '../../test/lib';

import { IconMenuItem } from './IconMenuItem';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('renders its label and icons and forwards the ref, class, title, and click handler', async () => {
  const onClick = vi.fn();
  const ref = createRef<HTMLLIElement>();
  const screen = await renderComponent(
    <MenuList>
      <IconMenuItem
        className={'custom-menu-item'}
        label={'Home'}
        leftIcon={(
          <span aria-hidden={'true'}>
            {'Left icon'}
          </span>
        )}
        MenuItemProps={{ title: 'Menu item title' }}
        onClick={onClick}
        ref={ref}
        rightIcon={(
          <span aria-hidden={'true'}>
            {'Right icon'}
          </span>
        )}
      />
    </MenuList>,
  );
  const menuItem = screen.getByRole('menuitem', { name: 'Home' });
  const menuItemElement = getRequiredElement<HTMLLIElement>(screen.baseElement, 'li[role="menuitem"]');

  await expect.element(menuItem).toBeVisible();
  await expect.element(menuItem).toHaveClass('custom-menu-item');
  await expect.element(menuItem).toHaveAttribute('title', 'Menu item title');
  await expect.element(screen.getByText('Left icon')).toBeVisible();
  await expect.element(screen.getByText('Right icon')).toBeVisible();
  expect(ref.current).toBe(menuItemElement);

  await menuItem.click();
  expect(onClick).toHaveBeenCalledOnce();

  const itemStyle = getComputedStyle(menuItemElement);
  const labelStyle = getComputedStyle(getRequiredElement(menuItemElement, 'p'));
  expect(itemStyle.display).toBe('flex');
  expect(itemStyle.justifyContent).toBe('space-between');
  expect(itemStyle.paddingLeft).toBe('4px');
  expect(itemStyle.paddingRight).toBe('4px');
  expect(labelStyle.paddingLeft).toBe('8px');
  expect(labelStyle.paddingRight).toBe('8px');
  expect(labelStyle.textAlign).toBe('left');
});

it.each([
  { checked: 'false' as const, expected: 'false' },
  { checked: 'mixed' as const, expected: 'mixed' },
  { checked: 'true' as const, expected: 'true' },
])('renders checked state $checked as a menu item checkbox', async ({ checked, expected }) => {
  const screen = await renderComponent(
    <MenuList>
      <IconMenuItem
        checked={checked}
        label={'Choice'}
      />
    </MenuList>,
  );
  const menuItem = screen.getByRole('menuitemcheckbox', { name: 'Choice' });

  await expect.element(menuItem).toHaveAttribute('aria-checked', expected);
});

it('forwards direct menu item props over MenuItemProps', async () => {
  const onClick = vi.fn();
  const menuItemPropsOnClick = vi.fn();
  const screen = await renderComponent(
    <MenuList>
      <IconMenuItem
        className={'direct-class'}
        disabled
        divider
        label={'Settings'}
        MenuItemProps={{
          className: 'menu-item-props-class',
          disabled: false,
          onClick: menuItemPropsOnClick,
          title: 'Menu item title',
        }}
        onClick={onClick}
        sx={{ color: 'rgb(255, 0, 0)' }}
      />
    </MenuList>,
  );
  const menuItem = screen.getByRole('menuitem', { name: 'Settings' });

  await expect.element(menuItem).toHaveAttribute('aria-disabled', 'true');
  await expect.element(menuItem).toHaveAttribute('title', 'Menu item title');
  await expect.element(menuItem).toHaveClass('direct-class');
  await expect.element(menuItem).toHaveClass('MuiMenuItem-divider');
  expect(getComputedStyle(getRequiredElement(screen.baseElement, 'li[role="menuitem"]')).color)
    .toBe('rgb(255, 0, 0)');
});
