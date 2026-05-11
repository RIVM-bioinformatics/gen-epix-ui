import {
  Box,
  useTheme,
} from '@mui/material';
import type { PropsWithChildren } from 'react';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export type SidebarMenuProps = PropsWithChildren;

export const SidebarMenu = ({ children }: SidebarMenuProps) => {
  const theme = useTheme();

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
        width: theme.spacing(ConfigManager.getInstance().config.layout.SIDEBAR_MENU_WIDTH),
        zIndex: 2,
      }}
    >
      {children}
    </Box>
  );
};
