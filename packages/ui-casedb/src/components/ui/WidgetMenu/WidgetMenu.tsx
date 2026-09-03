import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { MenuItemData } from '@gen-epix/ui-core-components/models/nestedMenu';
import { MenuDataUtil } from '@gen-epix/ui/utils/MenuDataUtil';
import { NestedDropdown } from '@gen-epix/ui-core-components/components/NestedMenu';

import { WidgetHeaderIconButton } from '../WidgetHeaderIconButton';

export type WidgetMenuProps = {
  readonly menu: MenuItemData[] | ReactNode;
};

export const WidgetMenu = ({
  menu,
}: WidgetMenuProps) => {
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
