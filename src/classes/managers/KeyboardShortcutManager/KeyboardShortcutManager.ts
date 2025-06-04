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
  key: string;
  modifier?: string;
  callback: () => void;
};

export class KeyboardShortcutManager {
  private static __instance: KeyboardShortcutManager;
  private readonly configs: KeyboardShortcutConfig[] = [];

  public static get instance(): KeyboardShortcutManager {
    KeyboardShortcutManager.__instance = KeyboardShortcutManager.__instance || new KeyboardShortcutManager();
    return KeyboardShortcutManager.__instance;
  }

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    for (let config of this.configs) {
      const { key, modifier, callback } = config;
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

  public registerShortcut({ key, modifier, callback }: KeyboardShortcutConfig): () => void {
    const config: KeyboardShortcutConfig = { key, modifier, callback };
    this.configs.push(config);

    return () => {
      this.configs.splice(this.configs.indexOf(config), 1);
    };
  }
}
