import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { MenuItemData } from '@gen-epix/ui';
import {
  MenuDataUtil,
  NestedDropdown,
} from '@gen-epix/ui';

import { WidgetHeaderIconButton } from '../EpiWidgetHeaderIconButton';

export type EpiWidgetMenuProps = {
  readonly menu: MenuItemData[] | ReactNode;
};

export const EpiWidgetMenu = ({
  menu,
}: EpiWidgetMenuProps) => {
  if (isValidElement(menu)) {
    return menu;
  }
  if (!MenuDataUtil.isMenuItemDataArray(menu)) {
    return null;
  }

  return (
    <>
      {menu?.map(menuItemsData => {
        if (menuItemsData.items) {
          return (
            <NestedDropdown
              ButtonProps={{
                color: 'primary',
                disabled: menuItemsData.disabled,
                size: 'small',
                variant: 'text',
              }}
              key={menuItemsData.label}
              menuItemsData={menuItemsData}
              MenuProps={{ elevation: 3 }}
            />
          );
        }
        return (
          <WidgetHeaderIconButton
            disabled={menuItemsData.disabled}
            key={menuItemsData.label}
            label={menuItemsData.label}
            // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
            onClick={() => menuItemsData.callback()}
            size={'small'}
          >
            {menuItemsData.leftIcon || menuItemsData.rightIcon}
          </WidgetHeaderIconButton>
        );
      })}
    </>
  );
};
