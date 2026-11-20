import type { ReactElement } from 'react';
import MenuList from '@mui/material/MenuList';
import {
  expect,
  it,
  vi,
} from 'vitest';

import type { MenuItemData } from '../../models/nested-menu.models';
import { renderComponent } from '../../test/lib';

import { nestedMenuItemsFromObject } from './nestedMenuItemsFromObject';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('renders no items for an empty menu', async () => {
  const screen = await renderComponent(
    <MenuList>
      {nestedMenuItemsFromObject({
        handleClose: vi.fn(),
        isOpen: false,
        menuItemsData: [],
      })}
    </MenuList>,
  );

  expect(screen.baseElement.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
});

it('renders leaf items, applies tooltips, preserves unique uids, and handles selection', async () => {
  const handleClose = vi.fn();
  const onDownload = vi.fn();
  const onStayOpen = vi.fn();
  const onDisabled = vi.fn();
  const menuItemsData: MenuItemData[] = [
    {
      active: true,
      callback: onDownload,
      divider: true,
      label: 'Download',
      leftIcon: (
        <span>
          {'Left icon'}
        </span>
      ),
      rightIcon: (
        <span>
          {'Right icon'}
        </span>
      ),
      sx: { color: 'rgb(1, 2, 3)' },
      tooltip: 'Download report',
      uid: 'download',
    },
    {
      autoCloseDisabled: true,
      callback: onStayOpen,
      label: 'Keep open',
      uid: 'keep-open',
    },
    { label: 'Plain' },
    { items: [], label: 'Empty group' },
    {
      callback: onDisabled,
      disabled: true,
      items: [{ label: 'Hidden child' }],
      label: 'Unavailable',
      uid: 'unavailable',
    },
    { label: 'Duplicate', uid: 'duplicate-first' },
    { label: 'Duplicate', uid: 'duplicate-second' },
  ];
  const elements = nestedMenuItemsFromObject({
    handleClose,
    isOpen: true,
    menuItemsData,
  });

  expect(elements.map(element => element.key)).toEqual([
    'download',
    'keep-open',
    'Plain',
    'Empty group',
    'unavailable',
    'duplicate-first',
    'duplicate-second',
  ]);

  const screen = await renderComponent(
    <MenuList>
      {elements}
    </MenuList>,
  );
  const download = screen.getByRole('menuitem', { name: 'Download report' });

  await expect.element(download).toHaveClass('MuiMenuItem-divider');
  await expect.element(screen.getByText('Left icon')).toBeVisible();
  await expect.element(screen.getByText('Right icon')).toBeVisible();
  expect(getComputedStyle(screen.baseElement.querySelector('li[role="menuitem"] p'))
    .fontWeight).toBe('700');
  expect(getComputedStyle(screen.baseElement.querySelector('li[role="menuitem"]'))
    .color).toBe('rgb(1, 2, 3)');

  await download.hover();
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Download report');
  await download.click();
  expect(handleClose).toHaveBeenCalledOnce();
  expect(onDownload).toHaveBeenCalledOnce();

  const keepOpen = screen.getByRole('menuitem', { name: 'Keep open' });
  await keepOpen.click();
  expect(handleClose).toHaveBeenCalledOnce();
  expect(onStayOpen).toHaveBeenCalledOnce();

  const plain = screen.getByRole('menuitem', { name: 'Plain' });
  await plain.hover();
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Plain');
  await plain.click();
  expect(handleClose).toHaveBeenCalledTimes(2);

  await screen.getByRole('menuitem', { name: 'Empty group' }).click();
  expect(handleClose).toHaveBeenCalledTimes(3);

  const unavailable = screen.getByRole('menuitem', { name: 'Unavailable' });
  await expect.element(unavailable).toBeDisabled();
  expect(screen.baseElement.textContent).not.toContain('Hidden child');
  expect(onDisabled).not.toHaveBeenCalled();
  const duplicateItems = Array.from(screen.baseElement.querySelectorAll('li[role="menuitem"]'))
    .filter(element => element.textContent?.trim() === 'Duplicate');
  expect(duplicateItems).toHaveLength(2);
});

it('recursively renders nested menus and forwards callbacks', async () => {
  const handleClose = vi.fn();
  const onParentClick = vi.fn();
  const onLeafClick = vi.fn();
  const menuItemsData: MenuItemData[] = [
    {
      active: true,
      callback: onParentClick,
      items: [
        {
          active: false,
          items: [{ callback: onLeafClick, label: 'Nested leaf' }],
          label: 'Inner group',
        },
      ],
      label: 'Parent group',
      sx: { color: 'rgb(1, 2, 3)' },
      uid: 'parent-group',
    },
  ];
  const elements = nestedMenuItemsFromObject({
    handleClose,
    isOpen: true,
    menuItemsData,
  });
  type NestedMenuItemElement = ReactElement<{ children: ReactElement[] }>;
  type MenuItemTooltipElement = ReactElement<{ children: NestedMenuItemElement }>;
  const parentMenuItem = (elements[0] as MenuItemTooltipElement).props.children;
  const nestedElements = parentMenuItem.props.children;

  expect(elements.map(element => element.key)).toEqual(['parent-group']);
  expect(parentMenuItem.key).toBe('parent-group');
  expect(nestedElements.map(element => element.key)).toEqual(['Inner group']);

  const screen = await renderComponent(
    <MenuList>
      {elements}
    </MenuList>,
  );
  const parent = screen.getByRole('menuitem', { name: 'Parent group' });
  const parentElement = getRequiredElement<HTMLLIElement>(
    screen.baseElement,
    'li[role="menuitem"]',
  );

  await expect.element(parent).toBeVisible();
  expect(getComputedStyle(screen.baseElement.querySelector('li[role="menuitem"]'))
    .color).toBe('rgb(1, 2, 3)');
  await parent.hover();
  parentElement.click();
  expect(onParentClick).toHaveBeenCalledOnce();

  await expect.element(screen.getByRole('menuitem', { name: 'Inner group' })).toBeVisible();
  await screen.getByRole('menuitem', { name: 'Inner group' }).hover();
  await expect.element(screen.getByRole('menuitem', { name: 'Nested leaf' })).toBeVisible();

  await screen.getByRole('menuitem', { name: 'Nested leaf' }).click();
  expect(handleClose).toHaveBeenCalledOnce();
  expect(onLeafClick).toHaveBeenCalledOnce();
});
