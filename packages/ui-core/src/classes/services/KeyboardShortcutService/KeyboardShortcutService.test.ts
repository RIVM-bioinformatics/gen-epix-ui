// @vitest-environment jsdom

import { KeyboardShortcutService } from './KeyboardShortcutService';

const MODIFIER_KEYS = [
  'Alt',
  'AltGraph',
  'Control',
  'Meta',
  'Shift',
] as const;

const IGNORED_STATE_KEYS = ['Accel', 'CapsLock', 'Fn', 'FnLock', 'Hyper', 'NumLock', 'OS', 'ScrollLock', 'Super', 'Symbol', 'SymbolLock'] as const;

const createKeyboardEventForKey = (key: string, ...activeModifiers: string[]): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key });
  Object.defineProperty(event, 'getModifierState', {
    value: (modifier: string) => activeModifiers.includes(modifier),
  });
  return event;
};

const createKeyboardEvent = (...activeModifiers: string[]): KeyboardEvent => {
  return createKeyboardEventForKey('f', ...activeModifiers);
};

describe('KeyboardShortcutService', () => {
  let keyboardShortcutService: KeyboardShortcutService;

  beforeEach(() => {
    KeyboardShortcutService['__instance'] = undefined;
    keyboardShortcutService = KeyboardShortcutService.getInstance();
  });

  it.each(MODIFIER_KEYS)('recognizes %s as a modifier', (modifier) => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: [[modifier]] });

    window.dispatchEvent(createKeyboardEvent(modifier));

    expect(callback).toHaveBeenCalledOnce();
  });

  it.each(MODIFIER_KEYS)('does not allow %s on a plain shortcut', (modifier) => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f' });

    window.dispatchEvent(createKeyboardEvent(modifier));

    expect(callback).not.toHaveBeenCalled();
  });

  it.each(IGNORED_STATE_KEYS)('ignores %s state for shortcuts', (stateKey) => {
    const plainCallback = vi.fn();
    const metaCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: plainCallback, key: 'f' });
    keyboardShortcutService.registerShortcut({ callback: metaCallback, key: 'g', modifiers: [['Meta']] });

    window.dispatchEvent(createKeyboardEvent(stateKey));
    window.dispatchEvent(createKeyboardEventForKey('g', 'Meta', stateKey));

    expect(plainCallback).toHaveBeenCalledOnce();
    expect(metaCallback).toHaveBeenCalledOnce();
  });

  it('does not match Meta or Control groups when Shift is also active', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: [['Meta'], ['Control']] });

    window.dispatchEvent(createKeyboardEvent('Meta', 'Shift'));
    window.dispatchEvent(createKeyboardEvent('Control', 'Shift'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('recognizes a shortcut when one of multiple modifiers is active', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: [['Control'], ['Meta']] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(callback).toHaveBeenCalledOnce();
  });

  it('requires every modifier in a modifier group', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: [['Control', 'Meta']] });

    window.dispatchEvent(createKeyboardEvent('Control'));
    expect(callback).not.toHaveBeenCalled();

    window.dispatchEvent(createKeyboardEvent('Control', 'Meta'));
    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not allow extra modifiers in a modifier group', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: [['Control']] });

    window.dispatchEvent(createKeyboardEvent('Control', 'Meta'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps shifted and unshifted z shortcuts separate', () => {
    const undoCallback = vi.fn();
    const redoCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: undoCallback, key: 'z', modifiers: [['Meta'], ['Control']] });
    keyboardShortcutService.registerShortcut({ callback: redoCallback, key: 'z', modifiers: [['Meta', 'Shift'], ['Control', 'Shift']] });

    window.dispatchEvent(createKeyboardEventForKey('z', 'Meta'));
    expect(undoCallback).toHaveBeenCalledOnce();
    expect(redoCallback).not.toHaveBeenCalled();

    window.dispatchEvent(createKeyboardEventForKey('z', 'Meta', 'Shift'));
    expect(undoCallback).toHaveBeenCalledOnce();
    expect(redoCallback).toHaveBeenCalledOnce();

    window.dispatchEvent(createKeyboardEventForKey('z', 'Control'));
    expect(undoCallback).toHaveBeenCalledTimes(2);
    expect(redoCallback).toHaveBeenCalledOnce();

    window.dispatchEvent(createKeyboardEventForKey('z', 'Control', 'Shift'));
    expect(undoCallback).toHaveBeenCalledTimes(2);
    expect(redoCallback).toHaveBeenCalledTimes(2);
  });

  it('allows an undefined modifier for a plain shortcut', () => {
    const callback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback, key: 'f', modifiers: undefined });

    window.dispatchEvent(createKeyboardEvent());

    expect(callback).toHaveBeenCalledOnce();
  });

  it('handles shortcuts on a registered element', () => {
    const callback = vi.fn();
    const element = document.createElement('div');
    keyboardShortcutService.registerShortcut({ callback, element, key: 'f' });

    element.dispatchEvent(createKeyboardEvent());

    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not handle an element shortcut from the window', () => {
    const callback = vi.fn();
    const element = document.createElement('div');
    keyboardShortcutService.registerShortcut({ callback, element, key: 'f' });

    window.dispatchEvent(createKeyboardEvent());

    expect(callback).not.toHaveBeenCalled();
  });

  it('handles an element shortcut when focus is in a form descendant', () => {
    const callback = vi.fn();
    const element = document.createElement('div');
    const input = document.createElement('input');
    element.append(input);
    document.body.append(element);
    keyboardShortcutService.registerShortcut({ callback, element, key: 'f' });
    input.focus();

    element.dispatchEvent(createKeyboardEvent());

    expect(callback).toHaveBeenCalledOnce();
    input.blur();
    element.remove();
  });

  it('checks later shortcuts when an explicit modifier does not match', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: firstCallback, key: 'f', modifiers: [['Control']] });
    keyboardShortcutService.registerShortcut({ callback: secondCallback, key: 'f', modifiers: [['Meta']] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });

  it('checks later shortcuts when a plain shortcut has an active modifier', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    keyboardShortcutService.registerShortcut({ callback: firstCallback, key: 'f' });
    keyboardShortcutService.registerShortcut({ callback: secondCallback, key: 'f', modifiers: [['Meta']] });

    window.dispatchEvent(createKeyboardEvent('Meta'));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });
});
