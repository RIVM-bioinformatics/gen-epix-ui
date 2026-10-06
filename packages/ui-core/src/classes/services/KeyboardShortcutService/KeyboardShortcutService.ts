import { HmrUtil } from '../../../utils/HmrUtil';

const FORM_ELEMENT_TAG_NAMES = [
  'form',
  'input',
  'label',
  'select',
  'textarea',
  'button',
  'fieldset',
  'legend',
  'datalist',
  'output',
  'option',
  'optgroup',
];

// Lock keys (CapsLock, NumLock, ...) and browser-specific aliases (Accel, OS, ...) are excluded: they are reported as active in states that are not part of the shortcut.
const MODIFIER_KEYS = [
  'Alt',
  'AltGraph',
  'Control',
  'Meta',
  'Shift',
] as const;

type KeyboardModifier = typeof MODIFIER_KEYS[number];

type KeyboardShortcutConfig = {
  callback: (event: KeyboardEvent) => void;
  code?: string;
  element?: HTMLElement;
  key?: string;
  modifiers?: KeyboardModifier[][];
};

export class KeyboardShortcutService {
  private static __instance: KeyboardShortcutService;

  private readonly configs: KeyboardShortcutConfig[] = [];

  private constructor() {
    window.addEventListener('keydown', this.handleWindowKeyDown);
  }

  public static getInstance(): KeyboardShortcutService {
    KeyboardShortcutService.__instance = HmrUtil.getHmrSingleton('keyboardShortcutService', KeyboardShortcutService.__instance, () => new KeyboardShortcutService());
    return KeyboardShortcutService.__instance;
  }

  private static shouldIgnoreShortcut(element?: HTMLElement): boolean {
    const activeElement = document.activeElement as HTMLElement;
    if (element?.contains(activeElement)) {
      return false;
    }

    let elementToCheck: HTMLElement | null = activeElement;
    while (elementToCheck) {
      if (FORM_ELEMENT_TAG_NAMES.includes(elementToCheck.tagName.toLowerCase())) {
        return true; // ignore all shortcuts when typing in form elements
      }
      elementToCheck = elementToCheck.parentElement;
    }
    return false;
  }

  public registerShortcut({ callback, code, element, key, modifiers }: KeyboardShortcutConfig): () => void {
    const config: KeyboardShortcutConfig = { callback, code, element, key, modifiers };
    this.configs.push(config);
    (element ?? window).addEventListener('keydown', element ? this.handleElementKeyDown : this.handleWindowKeyDown);

    return () => {
      const configIndex = this.configs.indexOf(config);
      if (configIndex === -1) {
        return;
      }
      this.configs.splice(configIndex, 1);
      if (!this.configs.some((registeredConfig) => registeredConfig.element === element)) {
        (element ?? window).removeEventListener('keydown', element ? this.handleElementKeyDown : this.handleWindowKeyDown);
      }
    };
  }

  private readonly handleElementKeyDown = (event: Event): void => {
    this.handleKeyDown(event as KeyboardEvent, event.currentTarget as HTMLElement);
  };

  private readonly handleKeyDown = (event: KeyboardEvent, element: HTMLElement | undefined): void => {
    for (const config of this.configs) {
      const { callback, code, key, modifiers } = config;
      if (element !== config.element) {
        continue;
      }
      if ((key && event.key !== key) || (code && event.code !== code)) {
        continue;
      }
      // Groups are OR-ed; within a group the active modifiers must match exactly. No modifiers means no modifier may be active.
      const modifierGroups = modifiers?.length ? modifiers : [[]];
      const hasMatchingModifierGroup = modifierGroups.some((modifierGroup) => MODIFIER_KEYS.every((modifierKey) => modifierGroup.includes(modifierKey) === event.getModifierState(modifierKey)));
      if (!hasMatchingModifierGroup) {
        continue;
      }

      if (KeyboardShortcutService.shouldIgnoreShortcut(element)) {
        return;
      }
      callback(event);
      return; // only one callback per shortcut
    }
  };

  private readonly handleWindowKeyDown = (event: Event): void => {
    this.handleKeyDown(event as KeyboardEvent, undefined);
  };
}
