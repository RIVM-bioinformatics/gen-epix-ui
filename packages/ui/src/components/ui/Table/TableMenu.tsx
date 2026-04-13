import type { BoxProps } from '@mui/material';

import { UseColumnsMenu } from '../../../hooks/useColumnsMenu';
import { NestedDropdown } from '../NestedMenu';

export type TableMenuProps = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ContainerProps?: Partial<BoxProps>;
};

export const TableMenu = ({ ContainerProps }: TableMenuProps) => {
  const columnsMenu = UseColumnsMenu({});

  return (
    <NestedDropdown
      ButtonProps={{
        color: 'primary',
        size: 'small',
        variant: 'text',
      }}
      ContainerProps={ContainerProps}
      menuItemsData={columnsMenu}
      MenuProps={{ elevation: 3 }}
    />
  );
};
