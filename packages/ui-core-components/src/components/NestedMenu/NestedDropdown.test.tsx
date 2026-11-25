import { createRef } from 'react';
import {
  expect,
  it,
  vi,
} from 'vitest';

import type { MenuItemData } from '../../models/nested-menu.models';
import { renderComponent } from '../../test/lib';

import { NestedDropdown } from './NestedDropdown';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('opens its menu, invokes callbacks, closes after selection, and forwards the container ref', async () => {
  const onClick = vi.fn();
  const onItemClick = vi.fn();
  const ref = createRef<HTMLDivElement>();
  const menuItemsData: MenuItemData = {
    items: [{ callback: onItemClick, label: 'Refresh' }],
    label: 'Actions',
  };
  const screen = await renderComponent(
    <NestedDropdown
      ContainerProps={{ className: 'nested-dropdown-container' }}
      menuItemsData={menuItemsData}
      onClick={onClick}
      ref={ref}
    />,
  );
  const button = screen.getByRole('button', { name: 'Actions' });
  const buttonElement = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');
  const container = getRequiredElement<HTMLDivElement>(screen.baseElement, '.nested-dropdown-container');

  expect(buttonElement.getAttribute('aria-expanded')).toBe('false');
  expect(ref.current).toBe(container);

  await button.click();
  await expect.poll(() => buttonElement.getAttribute('aria-expanded')).toBe('true');
  await expect.element(screen.getByRole('menuitem', { name: 'Refresh' })).toBeVisible();
  expect(onClick).toHaveBeenCalledOnce();

  await screen.getByRole('menuitem', { name: 'Refresh' }).click();
  await expect.poll(() => buttonElement.getAttribute('aria-expanded')).toBe('false');
  expect(onItemClick).toHaveBeenCalledOnce();
});

it('uses the default label when menu data is omitted and closes on Escape', async () => {
  const screen = await renderComponent(
    <NestedDropdown />,
  );
  const button = screen.getByRole('button', { name: 'Menu' });
  const buttonElement = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');

  expect(buttonElement.getAttribute('aria-expanded')).toBe('false');
  await button.click();
  await expect.poll(() => buttonElement.getAttribute('aria-expanded')).toBe('true');

  const menu = getRequiredElement<HTMLElement>(screen.baseElement, '[role="menu"]');
  menu.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  }));
  await expect.poll(() => buttonElement.getAttribute('aria-expanded')).toBe('false');
});

it('shows a tooltip and applies custom button styles when requested', async () => {
  const menuItemsData: MenuItemData = {
    label: 'Reports',
    tooltip: 'Open reports',
  };
  const screen = await renderComponent(
    <NestedDropdown
      ButtonProps={{ sx: { backgroundColor: 'rgb(1, 2, 3)' } }}
      menuItemsData={menuItemsData}
      showTopLevelTooltip
    />,
  );
  const buttonElement = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');

  expect(getComputedStyle(buttonElement).backgroundColor).toBe('rgb(1, 2, 3)');
  buttonElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Open reports');
});

it('uses the menu label as the tooltip when no explicit tooltip is provided', async () => {
  const menuItemsData: MenuItemData = { label: 'Exports' };
  const screen = await renderComponent(
    <NestedDropdown
      menuItemsData={menuItemsData}
      showTopLevelTooltip
    />,
  );
  const button = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');

  button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Exports');
});

it('uses the default menu label as the tooltip when menu data is omitted', async () => {
  const screen = await renderComponent(
    <NestedDropdown showTopLevelTooltip />,
  );
  const button = screen.getByRole('button', { name: 'Menu' });

  await button.hover();
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Menu');
});

it('does not show a tooltip or open the menu for a disabled button', async () => {
  const screen = await renderComponent(
    <NestedDropdown
      ButtonProps={{ disabled: true }}
      menuItemsData={{ label: 'Disabled menu' }}
      showTopLevelTooltip
    />,
  );
  const button = screen.getByRole('button', { name: 'Disabled menu' });
  await expect.element(button).toBeDisabled();
  await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument();
  await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument();
  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
});

it('closes the menu when clicking outside the dropdown', async () => {
  const screen = await renderComponent(
    <>
      <NestedDropdown menuItemsData={{ label: 'Actions' }} />
      <button className={'outside-button'}>
        {'Outside'}
      </button>
    </>,
  );
  const dropdownButton = screen.getByRole('button', { name: 'Actions' });
  const dropdownButtonElement = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');
  const outsideButton = getRequiredElement<HTMLButtonElement>(screen.baseElement, '.outside-button');

  await dropdownButton.click();
  await expect.poll(() => dropdownButtonElement.getAttribute('aria-expanded')).toBe('true');
  outsideButton.click();
  await expect.poll(() => dropdownButtonElement.getAttribute('aria-expanded')).toBe('false');
});
