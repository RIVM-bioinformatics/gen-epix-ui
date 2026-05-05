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
  callback: () => void;
  key: string;
  modifier?: string;
};

export class KeyboardShortcutManager {
  public static get instance(): KeyboardShortcutManager {
    KeyboardShortcutManager.__instance = HmrUtil.getHmrSingleton('keyboardShortcutManager', KeyboardShortcutManager.__instance, () => new KeyboardShortcutManager());
    return KeyboardShortcutManager.__instance;
  }

  private static __instance: KeyboardShortcutManager;

  private readonly configs: KeyboardShortcutConfig[] = [];

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
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

  public registerShortcut({ callback, key, modifier }: KeyboardShortcutConfig): () => void {
    const config: KeyboardShortcutConfig = { callback, key, modifier };
    this.configs.push(config);

    return () => {
      this.configs.splice(this.configs.indexOf(config), 1);
    };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    for (const config of this.configs) {
      const { callback, key, modifier } = config;
      if (event.key !== key) {
        continue;
      }
      if (modifier && !event.getModifierState(modifier)) {
        return;
      }
      if (!modifier && (event.getModifierState('Control') || event.getModifierState('Alt') || event.getModifierState('Meta'))) {
        return;
      }

      if (KeyboardShortcutManager.shouldIgnoreShortcut()) {
        return;
      }
      callback();
      return; // only one callback per shortcut
    }
  }
}
