import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createDialogPopperClickGuard,
  hasOpenDialogPopper,
} from './createDialogPopperClickGuard';

describe('hasOpenDialogPopper', () => {
  it('returns false when the dialog content is unavailable', () => {
    expect(hasOpenDialogPopper(null)).toBe(false);
    expect(hasOpenDialogPopper(undefined)).toBe(false);
  });

  it('returns false when the controlled element is not inside a Popper', () => {
    const dialogContent = document.createElement('div');
    const trigger = document.createElement('input');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', 'dropdown-options');
    dialogContent.append(trigger);

    const listbox = document.createElement('ul');
    listbox.id = 'dropdown-options';
    document.body.append(listbox);

    expect(hasOpenDialogPopper(dialogContent)).toBe(false);

    listbox.remove();
  });

  it('returns true when an expanded dialog control points to a Popper', () => {
    const dialogContent = document.createElement('div');
    const trigger = document.createElement('input');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', 'dropdown-options');
    dialogContent.append(trigger);

    const popper = document.createElement('div');
    popper.className = 'MuiPopper-root';
    const listbox = document.createElement('ul');
    listbox.id = 'dropdown-options';
    popper.append(listbox);
    document.body.append(popper);

    expect(hasOpenDialogPopper(dialogContent)).toBe(true);

    popper.remove();
  });

  it('remembers an open Popper when it is removed before the click event', () => {
    const dialogContent = document.createElement('div');
    const trigger = document.createElement('input');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', 'dropdown-options');
    dialogContent.append(trigger);

    const popper = document.createElement('div');
    popper.className = 'MuiPopper-root';
    const listbox = document.createElement('ul');
    listbox.id = 'dropdown-options';
    popper.append(listbox);
    document.body.append(popper);

    const clickGuard = createDialogPopperClickGuard();
    clickGuard.onPointerDownCapture(dialogContent);

    trigger.setAttribute('aria-expanded', 'false');
    popper.remove();
    const clickEvent = new MouseEvent('click', { detail: 1 });
    clickGuard.onClickCapture(clickEvent, clickEvent.detail, dialogContent);

    expect(clickGuard.shouldIgnoreBackdropClick(clickEvent)).toBe(true);
    expect(clickGuard.shouldIgnoreBackdropClick(clickEvent)).toBe(false);
  });
});
