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

type KeyboardShortcutConfig = {
  callback: (event: KeyboardEvent) => void;
  code?: string;
  key?: string;
  modifier?: string;
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
    if (!code && !key) {
      throw new Error('Either code or key must be specified for a keyboard shortcut.');
    }
    const config: KeyboardShortcutConfig = { callback, code, key, modifier };
    this.configs.push(config);

    return () => {
      this.configs.splice(this.configs.indexOf(config), 1);
    };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    for (const config of this.configs) {
      const { callback, code, key, modifier } = config;
      if (event.key !== key && event.code !== code) {
        continue;
      }
      if (modifier && !event.getModifierState(modifier)) {
        return;
      }
      if (!modifier && (event.getModifierState('Control') || event.getModifierState('Alt') || event.getModifierState('Meta'))) {
        return;
      }

      if (KeyboardShortcutService.shouldIgnoreShortcut()) {
        return;
      }
      callback(event);
      return; // only one callback per shortcut
    }
  }
}
