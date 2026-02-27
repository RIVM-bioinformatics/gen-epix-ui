import type { ReactNode } from 'react';
import { isValidElement } from 'react';

import type { MenuItemData } from '../../../models/nestedMenu';
import { NestedDropdown } from '../../ui/NestedMenu';
import { MenuDataUtil } from '../../../utils/MenuDataUtil';
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
              key={menuItemsData.label}
              ButtonProps={{
                variant: 'text',
                size: 'small',
                color: 'primary',
                disabled: menuItemsData.disabled,
              }}
              MenuProps={{ elevation: 3 }}
              menuItemsData={menuItemsData}
            />
          );
        }
        return (
          <WidgetHeaderIconButton
            key={menuItemsData.label}
            disabled={menuItemsData.disabled}
            size={'small'}
            label={menuItemsData.label}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => menuItemsData.callback()}
          >
            {menuItemsData.leftIcon || menuItemsData.rightIcon}
          </WidgetHeaderIconButton>
        );
      })}
    </>
  );
};
