import { Tooltip } from '@mui/material';

import type { MenuItemData } from '../../../models/nestedMenu';

import { IconMenuItem } from './IconMenuItem';
import { NestedMenuItem } from './NestedMenuItem';

export interface NestedMenuItemsFromObjectProps {
  menuItemsData: MenuItemData[];
  isOpen: boolean;
  handleClose: () => void;
}

/**
 * Create a JSX element with nested elements creating a nested menu.
 * Every menu item should have a uid provided
 */
export const nestedMenuItemsFromObject = ({
  menuItemsData: items,
  isOpen,
  handleClose,
}: NestedMenuItemsFromObjectProps) => {
  return items.map((item) => {
    const { leftIcon, rightIcon, label, tooltip, items: menuItemsData, callback, sx, disabled, active, divider, autoCloseDisabled } = item;
    if (!disabled && menuItemsData && menuItemsData.length > 0) {
      return (
        <Tooltip
          key={label}
          arrow
          placement={'right'}
          title={undefined}
        >
          <NestedMenuItem
            key={label}
            active={active}
            callback={callback}
            disabled={disabled}
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
        key={label}
        disabled={disabled}
        divider={divider}
        label={label}
        rightIcon={rightIcon}
        sx={{
          ...(sx || {}),
          '& p': {
            fontWeight: active ? 700 : undefined,
          },
        }}
        leftIcon={leftIcon}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          if (!autoCloseDisabled) {
            handleClose();
          }
          if (callback) {
            callback();
          }
        }}
      />
    );
    if (disabled) {
      return iconMenuItem;
    }

    // No children elements, return MenuItem
    return (
      <Tooltip
        key={label}
        arrow
        placement={'right'}
        title={tooltip ?? label}
      >
        {iconMenuItem}
      </Tooltip>
    );
  });
};
