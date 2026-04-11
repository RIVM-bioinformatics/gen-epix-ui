import { Tooltip } from '@mui/material';

import type { MenuItemData } from '../../../models/nestedMenu';

import { IconMenuItem } from './IconMenuItem';
import { NestedMenuItem } from './NestedMenuItem';

export interface NestedMenuItemsFromObjectProps {
  handleClose: () => void;
  isOpen: boolean;
  menuItemsData: MenuItemData[];
}

/**
 * Create a JSX element with nested elements creating a nested menu.
 * Every menu item should have a uid provided
 */
export const nestedMenuItemsFromObject = ({
  handleClose,
  isOpen,
  menuItemsData: items,
}: NestedMenuItemsFromObjectProps) => {
  return items.map((item) => {
    const { active, autoCloseDisabled, callback, checked, disabled, divider, items: menuItemsData, label, leftIcon, rightIcon, sx, tooltip } = item;
    if (!disabled && menuItemsData && menuItemsData.length > 0) {
      return (
        <Tooltip
          arrow
          key={label}
          placement={'right'}
          title={undefined}
        >
          <NestedMenuItem
            active={active}
            callback={callback}
            checked={checked}
            disabled={disabled}
            key={label}
            label={label}
            leftIcon={leftIcon}
            parentMenuOpen={isOpen}
            rightIcon={rightIcon}
            sx={sx}
          >
            {/* Call this function to nest more items */}
            {nestedMenuItemsFromObject({
              handleClose,
              isOpen,
              menuItemsData,
            })}
          </NestedMenuItem>
        </Tooltip>
      );
    }

    const iconMenuItem = (
      <IconMenuItem
        checked={checked}
        disabled={disabled}
        divider={divider}
        key={label}
        label={label}
        leftIcon={leftIcon}
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={() => {
          if (!autoCloseDisabled) {
            handleClose();
          }
          if (callback) {
            callback();
          }
        }}
        rightIcon={rightIcon}
        sx={{
          ...(sx || {}),
          '& p': {
            fontWeight: active ? 700 : undefined,
          },
        }}
      />
    );
    if (disabled) {
      return iconMenuItem;
    }

    // No children elements, return MenuItem
    return (
      <Tooltip
        arrow
        key={label}
        placement={'right'}
        title={tooltip ?? label}
      >
        {iconMenuItem}
      </Tooltip>
    );
  });
};
