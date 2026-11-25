import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { createRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { NestedMenuItem } from './NestedMenuItem';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('renders the parent item, forwards its ref and container events, and invokes its callback', async () => {
  const callback = vi.fn();
  const onBlur = vi.fn();
  const onFocus = vi.fn();
  const onKeyDown = vi.fn();
  const onMouseEnter = vi.fn();
  const onMouseLeave = vi.fn();
  const ref = createRef<HTMLLIElement>();
  const screen = await renderComponent(
    <MenuList>
      <NestedMenuItem
        callback={callback}
        ContainerProps={{
          className: 'nested-menu-container',
          onBlur,
          onFocus,
          onKeyDown,
          onMouseEnter,
          onMouseLeave,
        }}
        label={'More actions'}
        parentMenuOpen={false}
        ref={ref}
        tabIndex={0}
      >
        <MenuItem>
          {'Child action'}
        </MenuItem>
      </NestedMenuItem>
      <MenuItem>
        {'Sibling item'}
      </MenuItem>
    </MenuList>,
  );
  const menuItem = screen.getByRole('menuitem', { name: 'More actions' });
  const menuItemElement = getRequiredElement<HTMLLIElement>(screen.baseElement, 'li[role="menuitem"]');
  const container = getRequiredElement<HTMLDivElement>(screen.baseElement, '.nested-menu-container');

  await expect.element(menuItem).toBeVisible();
  expect(container.tabIndex).toBe(0);
  expect(ref.current).toBe(menuItemElement);

  await menuItem.click();
  expect(callback).toHaveBeenCalledOnce();

  await menuItem.hover();
  expect(onMouseEnter).toHaveBeenCalledOnce();

  await screen.getByRole('menuitem', { name: 'Sibling item' }).hover();
  expect(onMouseLeave).toHaveBeenCalledOnce();

  onFocus.mockClear();
  container.focus();
  expect(onFocus).toHaveBeenCalledOnce();

  const enterEvent = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' });
  container.dispatchEvent(enterEvent);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(onKeyDown).toHaveBeenCalledOnce();

  const escapeEvent = new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' });
  container.dispatchEvent(escapeEvent);
  expect(onKeyDown).toHaveBeenCalledTimes(2);

  onBlur.mockClear();
  container.blur();
  expect(onBlur).toHaveBeenCalledOnce();
});

it('opens the submenu on focus and supports keyboard navigation within it', async () => {
  const originalBodyWidth = document.body.style.width;
  document.body.style.width = `${window.innerWidth * 2}px`;
  const propagationStates: boolean[] = [];
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    propagationStates.push(event.isPropagationStopped());
  };
  const screen = await renderComponent(
    <MenuList>
      <NestedMenuItem
        ContainerProps={{
          className: 'keyboard-menu-container',
          onKeyDown,
          style: {
            left: '8px',
            position: 'fixed',
            top: '8px',
          },
        }}
        label={'More actions'}
        parentMenuOpen
      >
        <button>
          {'First child'}
        </button>
      </NestedMenuItem>
    </MenuList>,
  );
  const container = getRequiredElement<HTMLDivElement>(screen.baseElement, '.keyboard-menu-container');

  container.focus();
  const child = screen.getByRole('button', { name: 'First child' });
  await expect.element(child).toBeVisible();
  const menuPaper = getRequiredElement<HTMLElement>(screen.baseElement, '.MuiPopover-paper');
  const menuItem = getRequiredElement<HTMLLIElement>(container, 'li');
  const menuContainer = getRequiredElement<HTMLElement>(menuPaper, 'div');
  const rightEdge = menuItem.getBoundingClientRect().right + menuContainer.clientWidth;
  expect(rightEdge).toBeLessThanOrEqual(document.body.clientWidth);

  container.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'ArrowRight',
  }));
  const childElement = getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button');
  expect(document.activeElement).toBe(childElement);
  expect(propagationStates[0]).toBe(false);
  await new Promise(resolve => setTimeout(resolve, 0));
  await expect.element(child).toBeVisible();

  childElement.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'ArrowLeft',
  }));
  expect(document.activeElement).toBe(container);
  expect(propagationStates[1]).toBe(true);
  document.body.style.width = originalBodyWidth;
});

it('closes the submenu on Escape', async () => {
  const screen = await renderComponent(
    <MenuList>
      <NestedMenuItem
        ContainerProps={{ className: 'escape-menu-container' }}
        label={'More actions'}
        parentMenuOpen
      >
        <button>
          {'First child'}
        </button>
      </NestedMenuItem>
    </MenuList>,
  );
  const container = getRequiredElement<HTMLDivElement>(screen.baseElement, '.escape-menu-container');

  container.focus();
  const child = screen.getByRole('button', { name: 'First child' });
  await expect.element(child).toBeVisible();
  getRequiredElement<HTMLButtonElement>(screen.baseElement, 'button').dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  }));
  await expect.element(child).not.toBeInTheDocument();
});

it('keeps the submenu closed when its parent is closed and omits tab focus for disabled items', async () => {
  const screen = await renderComponent(
    <MenuList>
      <NestedMenuItem
        ContainerProps={{ className: 'closed-menu-container' }}
        label={'Closed parent'}
        parentMenuOpen={false}
      >
        <MenuItem>
          {'Hidden child'}
        </MenuItem>
      </NestedMenuItem>
      <NestedMenuItem
        ContainerProps={{ className: 'disabled-menu-container' }}
        disabled
        label={'Disabled parent'}
        parentMenuOpen
      >
        <MenuItem>
          {'Disabled child'}
        </MenuItem>
      </NestedMenuItem>
      <NestedMenuItem
        label={'Kept mounted parent'}
        MenuProps={{
          keepMounted: true,
          slotProps: { transition: { unmountOnExit: true } },
        }}
        parentMenuOpen={false}
      >
        <MenuItem>
          {'Unmounted child'}
        </MenuItem>
      </NestedMenuItem>
    </MenuList>,
  );
  const closedContainer = getRequiredElement<HTMLDivElement>(screen.baseElement, '.closed-menu-container');
  const disabledContainer = getRequiredElement<HTMLDivElement>(screen.baseElement, '.disabled-menu-container');
  const closedMenuItem = getRequiredElement<HTMLLIElement>(closedContainer, 'li');
  const disabledMenuItem = getRequiredElement<HTMLLIElement>(disabledContainer, 'li');

  expect(closedContainer.tabIndex).toBe(-1);
  expect(disabledContainer.hasAttribute('tabindex')).toBe(false);
  closedMenuItem.focus();
  closedContainer.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  closedContainer.dispatchEvent(new MouseEvent('mouseout', {
    bubbles: true,
    relatedTarget: document.body,
  }));
  closedMenuItem.click();
  await expect.element(screen.getByRole('menuitem', { name: 'Hidden child' }))
    .not.toBeInTheDocument();
  expect(disabledMenuItem.getAttribute('aria-disabled')).toBe('true');
});

it('positions a submenu to the left when there is insufficient room on the right', async () => {
  const screen = await renderComponent(
    <MenuList>
      <NestedMenuItem
        ContainerProps={{
          className: 'right-edge-menu-container',
          style: {
            left: `${window.innerWidth - 2}px`,
            position: 'fixed',
            top: '8px',
          },
        }}
        label={'More actions'}
        parentMenuOpen
      >
        <button>
          {'First child'}
        </button>
      </NestedMenuItem>
    </MenuList>,
  );
  const container = getRequiredElement<HTMLDivElement>(screen.baseElement, '.right-edge-menu-container');

  container.focus();
  await expect.element(screen.getByRole('button', { name: 'First child' })).toBeVisible();
  const menuPaper = getRequiredElement<HTMLElement>(screen.baseElement, '.MuiPopover-paper');
  await expect.poll(() => Number.parseFloat(getComputedStyle(menuPaper).transformOrigin))
    .toBeGreaterThan(0);
});
