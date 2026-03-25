import type { MenuItemData } from '../../models/nestedMenu';

export class MenuDataUtil {

  public static isMenuItemData(value: unknown): value is MenuItemData {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const item = value as Record<string, unknown>;

    if (item.uid !== undefined && typeof item.uid !== 'string') {
      return false;
    }

    if (item.label !== undefined && typeof item.label !== 'string') {
      return false;
    }

    if (item.callback !== undefined && typeof item.callback !== 'function') {
      return false;
    }

    if (item.items !== undefined && (!Array.isArray(item.items) || !item.items.every(MenuDataUtil.isMenuItemData))) {
      return false;
    }

    if (item.disabled !== undefined && typeof item.disabled !== 'boolean') {
      return false;
    }

    if (item.divider !== undefined && typeof item.divider !== 'boolean') {
      return false;
    }

    if (item.autoCloseDisabled !== undefined && typeof item.autoCloseDisabled !== 'boolean') {
      return false;
    }

    if (item.active !== undefined && typeof item.active !== 'boolean') {
      return false;
    }

    if (item.checked !== undefined && !['true', 'false', 'mixed'].includes(item.checked as string)) {
      return false;
    }

    return true;
  }

  public static isMenuItemDataArray(value: unknown): value is MenuItemData[] {
    return Array.isArray(value) && value.every(MenuDataUtil.isMenuItemData);
  }
}
