import type { E2ETreeContract } from '../../models/e2e';
import { WindowManager } from '../../classes/managers/WindowManager';

export class E2EHookUtil {
  private static readonly treeHookSessionStorageKey = '__GEN_EPIX_E2E_TREE__';

  public static isTreeE2EHookEnabled(): boolean {
    try {
      const window = WindowManager.instance.window;
      return window.navigator.webdriver === true && window.sessionStorage.getItem(E2EHookUtil.treeHookSessionStorageKey) === '1';
    } catch {
      return false;
    }
  }

  public static setTreeContract(contract: E2ETreeContract): void {
    try {
      const window = WindowManager.instance.window;
      window.__GEN_EPIX_E2E__ = window.__GEN_EPIX_E2E__ || {
        version: 1,
        widgets: {},
      };
      window.__GEN_EPIX_E2E__.widgets.TREE = contract;
    } catch {
      // Ignore errors so the hook can never break runtime behavior.
    }
  }

  public static clearTreeContract(): void {
    try {
      const window = WindowManager.instance.window;
      if (window.__GEN_EPIX_E2E__) {
        delete window.__GEN_EPIX_E2E__.widgets.TREE;
      }
    } catch {
      // Ignore errors so the hook can never break runtime behavior.
    }
  }
}
