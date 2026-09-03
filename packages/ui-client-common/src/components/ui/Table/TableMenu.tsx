import type { BoxProps } from '@mui/material';
import { NestedDropdown } from '@gen-epix/ui-core-components/components/NestedMenu';

import { useColumnsMenu } from '../../../hooks/useColumnsMenu';

export type TableMenuProps = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ContainerProps?: Partial<BoxProps>;
};

export const TableMenu = ({ ContainerProps }: TableMenuProps) => {
  const columnsMenu = useColumnsMenu({});

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
