import { Box } from '@mui/material';
import type { TypographyProps } from '@mui/material';

import { TableMenu } from './TableMenu';
import { TableCaption } from './TableCaption';


export type TableHeaderProps = {
  readonly header?: string;
  readonly headerComponent?: TypographyProps['component'];
  readonly headerVariant?: TypographyProps['variant'];
  readonly showTableMenu?: boolean;
};

export const TableHeader = ({ header, headerComponent = 'h3', headerVariant = 'h5', showTableMenu = true }: TableHeaderProps) => {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: header ? 'space-between' : 'flex-end',
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
