// @vitest-environment jsdom

import { KeyboardShortcutService } from './KeyboardShortcutService';

const MODIFIER_KEYS = [
  'Accel',
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'FnLock',
  'Hyper',
  'Meta',
  'NumLock',
  'OS',
  'ScrollLock',
  'Shift',
  'Super',
  'Symbol',
  'SymbolLock',
] as const;

const createKeyboardEvent = (activeModifier?: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key: 'f' });
  Object.defineProperty(event, 'getModifierState', {
    value: (modifier: string) => modifier === activeModifier,
  });
  return event;
};

describe('KeyboardShortcutService', () => {
  let keyboardShortcutService: KeyboardShortcutService;

  beforeEach(() => {
    KeyboardShortcutService['__instance'] = undefined;
    keyboardShortcutService = KeyboardShortcutService.getInstance();
  });

  it.each(MODIFIER_KEYS)('recognizes %s as a modifier', (modifier) => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifier: [modifier] });

    window.dispatchEvent(createKeyboardEvent(modifier));

    expect(callback).toHaveBeenCalledOnce();
  });

  it.each(MODIFIER_KEYS)('does not allow %s on a plain shortcut', (modifier) => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f' });

    window.dispatchEvent(createKeyboardEvent(modifier));

    expect(callback).not.toHaveBeenCalled();
  });

  it('recognizes a shortcut when one of multiple modifiers is active', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifier: ['Control', 'Meta'] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(callback).toHaveBeenCalledOnce();
  });

  it('allows an undefined modifier for a plain shortcut', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifier: undefined });

    window.dispatchEvent(createKeyboardEvent());

    expect(callback).toHaveBeenCalledOnce();
  });

  it('checks later shortcuts when an explicit modifier does not match', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: firstCallback, key: 'f', modifier: ['Control'] });
    keyboardShortcutService.registerShortcut({ callback: secondCallback, key: 'f', modifier: ['Meta'] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });

  it('checks later shortcuts when a plain shortcut has an active modifier', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: firstCallback, key: 'f' });
    keyboardShortcutService.registerShortcut({ callback: secondCallback, key: 'f', modifier: ['Meta'] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });
});
