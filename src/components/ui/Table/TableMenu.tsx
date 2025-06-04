import { UseColumnsMenu } from '../../../hooks/useColumnsMenu';
import { NestedDropdown } from '../NestedMenu';

export const TableMenu = () => {
  const columnsMenu = UseColumnsMenu({});

  return (
    <NestedDropdown
      ButtonProps={{
        variant: 'text',
        size: 'small',
        color: 'primary',
      }}
      MenuProps={{ elevation: 3 }}
      menuItemsData={columnsMenu}
    />
  );
};
