import {
  describe,
  expect,
  it,
} from 'vitest';

import type { MenuItemData } from '../../models/nestedMenu';

import { MenuDataUtil } from './MenuDataUtil';

describe('MenuDataUtil', () => {
  describe('isMenuItemData', () => {
    it('should return false for null', () => {
      expect(MenuDataUtil.isMenuItemData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(MenuDataUtil.isMenuItemData(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(MenuDataUtil.isMenuItemData(42)).toBe(false);
      expect(MenuDataUtil.isMenuItemData('string')).toBe(false);
      expect(MenuDataUtil.isMenuItemData(true)).toBe(false);
      expect(MenuDataUtil.isMenuItemData(false)).toBe(false);
    });

    it('should return false for functions', () => {
      expect(MenuDataUtil.isMenuItemData((): void => undefined)).toBe(false);
    });

    it('should return true for empty array (no properties to fail validation)', () => {
      expect(MenuDataUtil.isMenuItemData([])).toBe(true);
    });

    it('should return true for array (arrays are objects with no uid, so pass validation)', () => {
      expect(MenuDataUtil.isMenuItemData([])).toBe(true);
    });

    it('should return true for array with numeric elements (no uid property to fail)', () => {
      expect(MenuDataUtil.isMenuItemData([123] as unknown)).toBe(true);
      expect(MenuDataUtil.isMenuItemData([null] as unknown)).toBe(true);
    });

    it('should return true for a minimal valid MenuItemData with only label', () => {
      const item: MenuItemData = { label: 'Test' };
      expect(MenuDataUtil.isMenuItemData(item)).toBe(true);
    });

    it('should return true for a fully populated valid MenuItemData', () => {
      const callback = (): void => undefined;
      const item: MenuItemData = {
        active: true,
        autoCloseDisabled: true,
        callback,
        checked: 'false',
        disabled: false,
        divider: false,
        items: [],
        label: 'Test',
        uid: 'test-uid',
      };
      expect(MenuDataUtil.isMenuItemData(item)).toBe(true);
    });

    it('should return true for an empty object (no required fields)', () => {
      expect(MenuDataUtil.isMenuItemData({})).toBe(true);
    });

    // uid checks
    it('should return false when uid is not a string', () => {
      expect(MenuDataUtil.isMenuItemData({ uid: 123 })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ uid: true })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ uid: null })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ uid: {} })).toBe(false);
    });

    it('should return true when uid is a valid string', () => {
      expect(MenuDataUtil.isMenuItemData({ uid: '' })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ uid: 'abc' })).toBe(true);
    });

    // label checks
    it('should return false when label is not a string', () => {
      expect(MenuDataUtil.isMenuItemData({ label: 123 })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ label: true })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ label: null })).toBe(false);
    });

    it('should return true when label is a valid string', () => {
      expect(MenuDataUtil.isMenuItemData({ label: '' })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ label: 'Test Label' })).toBe(true);
    });

    // callback checks
    it('should return false when callback is not a function', () => {
      expect(MenuDataUtil.isMenuItemData({ callback: 'fn' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ callback: 123 })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ callback: null })).toBe(false);
    });

    it('should return true when callback is a valid function', () => {
      expect(MenuDataUtil.isMenuItemData({ callback: (): void => undefined })).toBe(true);
    });

    // items checks
    it('should return false when items is not an array', () => {
      expect(MenuDataUtil.isMenuItemData({ items: {} })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ items: 'arr' })).toBe(false);
    });

    it('should return false when items array contains invalid MenuItemData', () => {
      expect(MenuDataUtil.isMenuItemData({ items: [null] })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ items: [123] })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ items: ['string'] })).toBe(false);
    });

    it('should return true when items is an empty array', () => {
      expect(MenuDataUtil.isMenuItemData({ items: [] })).toBe(true);
    });

    it('should return true when items is a valid array of MenuItemData', () => {
      const item: MenuItemData = {
        items: [
          { label: 'Child 1' },
          { label: 'Child 2', uid: 'child-2' },
        ],
        label: 'Parent',
      };
      expect(MenuDataUtil.isMenuItemData(item)).toBe(true);
    });

    it('should return true for deeply nested valid MenuItemData', () => {
      const item: MenuItemData = {
        items: [
          {
            items: [
              { label: 'Level 3' },
            ],
            label: 'Level 2',
          },
        ],
        label: 'Level 1',
      };
      expect(MenuDataUtil.isMenuItemData(item)).toBe(true);
    });

    // disabled checks
    it('should return false when disabled is not a boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ disabled: 'true' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ disabled: 1 })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ disabled: null })).toBe(false);
    });

    it('should return true when disabled is a valid boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ disabled: true })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ disabled: false })).toBe(true);
    });

    // divider checks
    it('should return false when divider is not a boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ divider: 'true' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ divider: 1 })).toBe(false);
    });

    it('should return true when divider is a valid boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ divider: true })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ divider: false })).toBe(true);
    });

    // autoCloseDisabled checks
    it('should return false when autoCloseDisabled is not a boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ autoCloseDisabled: 'true' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ autoCloseDisabled: 1 })).toBe(false);
    });

    it('should return true when autoCloseDisabled is a valid boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ autoCloseDisabled: true })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ autoCloseDisabled: false })).toBe(true);
    });

    // active checks
    it('should return false when active is not a boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ active: 'true' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ active: 1 })).toBe(false);
    });

    it('should return true when active is a valid boolean', () => {
      expect(MenuDataUtil.isMenuItemData({ active: true })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ active: false })).toBe(true);
    });

    // checked checks
    it('should return false when checked is not a valid string', () => {
      expect(MenuDataUtil.isMenuItemData({ checked: 'invalid' })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ checked: 1 })).toBe(false);
      expect(MenuDataUtil.isMenuItemData({ checked: null })).toBe(false);
    });

    it('should return true when checked is a valid string', () => {
      expect(MenuDataUtil.isMenuItemData({ checked: 'false' })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ checked: 'mixed' })).toBe(true);
      expect(MenuDataUtil.isMenuItemData({ checked: 'true' })).toBe(true);
    });

    it('should return true for MenuItemData with all optional fields set', () => {
      const item: MenuItemData = {
        active: false,
        autoCloseDisabled: false,
        callback: () => undefined,
        checked: 'mixed',
        disabled: true,
        divider: true,
        items: [{ label: 'Nested' }],
        label: 'Full Item',
        uid: 'full-uid',
      };
      expect(MenuDataUtil.isMenuItemData(item)).toBe(true);
    });

    it('should return true for MenuItemData with no optional fields (only label)', () => {
      expect(MenuDataUtil.isMenuItemData({ label: 'Just Label' })).toBe(true);
    });
  });

  describe('isMenuItemDataArray', () => {
    it('should return false for null', () => {
      expect(MenuDataUtil.isMenuItemDataArray(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(MenuDataUtil.isMenuItemDataArray(undefined)).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(MenuDataUtil.isMenuItemDataArray({})).toBe(false);
      expect(MenuDataUtil.isMenuItemDataArray('string')).toBe(false);
      expect(MenuDataUtil.isMenuItemDataArray(42)).toBe(false);
    });

    it('should return true for an empty array', () => {
      expect(MenuDataUtil.isMenuItemDataArray([])).toBe(true);
    });

    it('should return true for a valid array of MenuItemData', () => {
      const items: MenuItemData[] = [
        { label: 'Item 1' },
        { label: 'Item 2', uid: 'uid-2' },
        { items: [{ label: 'Nested' }], label: 'Item 3' },
      ];
      expect(MenuDataUtil.isMenuItemDataArray(items)).toBe(true);
    });

    it('should return false when array contains invalid MenuItemData', () => {
      expect(MenuDataUtil.isMenuItemDataArray([null] as unknown)).toBe(false);
      expect(MenuDataUtil.isMenuItemDataArray([123] as unknown)).toBe(false);
      expect(MenuDataUtil.isMenuItemDataArray(['string'] as unknown)).toBe(false);
    });

    it('should return false when array contains mixed valid and invalid items', () => {
      const items = [{ label: 'Valid' }, null] as unknown as MenuItemData[];
      expect(MenuDataUtil.isMenuItemDataArray(items)).toBe(false);
    });

    it('should return true for deeply nested MenuItemData in array', () => {
      const items: MenuItemData[] = [
        {
          items: [
            {
              items: [{ label: 'Grandchild' }],
              label: 'Child',
            },
          ],
          label: 'Parent',
        },
      ];
      expect(MenuDataUtil.isMenuItemDataArray(items)).toBe(true);
    });

    it('should return true for array with fully populated MenuItemData items', () => {
      const callback = (): void => undefined;
      const items: MenuItemData[] = [
        {
          active: true,
          autoCloseDisabled: false,
          callback,
          checked: 'true',
          disabled: false,
          divider: true,
          label: 'Full 1',
          uid: 'uid-1',
        },
        {
          active: false,
          autoCloseDisabled: true,
          callback,
          checked: 'false',
          disabled: true,
          divider: false,
          items: [{ label: 'Nested' }],
          label: 'Full 2',
          uid: 'uid-2',
        },
      ];
      expect(MenuDataUtil.isMenuItemDataArray(items)).toBe(true);
    });
  });
});
