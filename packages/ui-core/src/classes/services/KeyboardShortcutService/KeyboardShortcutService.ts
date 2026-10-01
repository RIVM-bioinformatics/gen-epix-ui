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

type KeyboardModifier = typeof MODIFIER_KEYS[number];

type KeyboardShortcutConfig = {
  callback: (event: KeyboardEvent) => void;
  code?: string;
  key?: string;
  modifier?: KeyboardModifier[];
};

export class KeyboardShortcutService {
  private static __instance: KeyboardShortcutService;

  private readonly configs: KeyboardShortcutConfig[] = [];

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  public static getInstance(): KeyboardShortcutService {
    KeyboardShortcutService.__instance = HmrUtil.getHmrSingleton('keyboardShortcutService', KeyboardShortcutService.__instance, () => new KeyboardShortcutService());
    return KeyboardShortcutService.__instance;
  }

  private static shouldIgnoreShortcut(): boolean {
    let activeElement = document.activeElement as HTMLElement;
    while (activeElement) {
      if (FORM_ELEMENT_TAG_NAMES.includes(activeElement.tagName.toLowerCase())) {
        return true; // ignore all shortcuts when typing in form elements
      }
      activeElement = activeElement.parentElement;
    }
    return false;
  }

  public registerShortcut({ callback, code, key, modifier }: KeyboardShortcutConfig): () => void {
    const config: KeyboardShortcutConfig = { callback, code, key, modifier };
    this.configs.push(config);

    return () => {
      this.configs.splice(this.configs.indexOf(config), 1);
    };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    for (const config of this.configs) {
      const { callback, code, key, modifier } = config;
      if ((key && event.key !== key) || (code && event.code !== code)) {
        continue;
      }
      if (modifier?.length && !modifier.some((modifierKey) => event.getModifierState(modifierKey))) {
        continue;
      }
      if (!modifier?.length && MODIFIER_KEYS.some((modifierKey) => event.getModifierState(modifierKey))) {
        continue;
      }

      if (KeyboardShortcutService.shouldIgnoreShortcut()) {
        return;
      }
      callback(event);
      return; // only one callback per shortcut
    }
  }
}
