import { Box } from '@mui/material';
import type { TypographyProps } from '@mui/material';

import { TableMenu } from './TableMenu';
import { TableCaption } from './TableCaption';


export type TableHeaderProps = {
  readonly headerComponent?: TypographyProps['component'];
  readonly headerVariant?: TypographyProps['variant'];
  readonly header?: string;
  readonly showTableMenu?: boolean;
};

export const TableHeader = ({ header, headerComponent = 'h3', headerVariant = 'h5', showTableMenu = true }: TableHeaderProps) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: header ? 'space-between' : 'flex-end',
      alignItems: 'center',
    }}
    >
      {header && (
        <Box>
          <TableCaption
            caption={header}
            component={headerComponent}
            variant={headerVariant}
          />
        </Box>
      )}
      {showTableMenu && (
        <Box>
          <TableMenu />
        </Box>
      )}
    </Box>
  );
};
