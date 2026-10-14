import {
  Box,
  useTheme,
} from '@mui/material';
import type { PropsWithChildren } from 'react';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { useConfig } from '../../../hooks/useConfig';

export type SidebarMenuProps = PropsWithChildren;

export const SidebarMenu = ({ children }: SidebarMenuProps) => {
  const theme = useTheme();
  const config = useConfig();

  return (
    <Box
      {...TestIdUtil.createAttributes('SidebarMenu')}
      sx={{
        borderRight: '1px solid #C8DDFB',
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        left: 0,
        position: 'absolute',
        top: 0,
        width: theme.spacing(config.layout.SIDEBAR_MENU_WIDTH),
        zIndex: 2,
      }}
    >
      {children}
    </Box>
  );
};
