import {
  Box,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  type PropsWithChildren,
  type ReactElement,
  useEffect,
  useState,
} from 'react';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import type { PropsWithTestIdAttributes } from '../../../models/testId';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export type SidebarItemProps = PropsWithTestIdAttributes<PropsWithChildren<{
  readonly closeIcon: ReactElement;
  readonly closeIconTooltipText: string;
  readonly title: string;
  readonly width: number;
} & SidebarItemSharedProps>>;

export type SidebarItemSharedProps = {
  readonly onClose: () => void;
  readonly open: boolean;
};

export const SidebarItem = ({ children, closeIcon, closeIconTooltipText, onClose, open, testIdAttributes, title, width }: SidebarItemProps) => {
  const theme = useTheme();
  const [mainContentDOMRect, setMainContentDOMRect] = useState<DOMRect>(null);

  useEffect(() => {
    const mainContentElement = document.getElementById(ConfigManager.getInstance().config.layout.MAIN_CONTENT_ID);

    setMainContentDOMRect(mainContentElement.getBoundingClientRect());

    const observer = new ResizeObserver(() => {
      setMainContentDOMRect(mainContentElement.getBoundingClientRect());
    });
    observer.observe(mainContentElement, {
      box: 'content-box',
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
    };
  }, []);

  const { height, top } = mainContentDOMRect ?? {};

  return (
    <Drawer
      anchor={'left'}
      onClose={onClose}
      open={open}
      slotProps={{
        backdrop: {
          sx: {
            height,
            top,
          },
        },
        paper: {
          sx: {
            height,
            top,
          },
        },
        root: {
          ...TestIdUtil.createAttributes('SidebarItem', testIdAttributes),
          sx: {
            height,
            top,
          },
        },
      }}
    >
      {!open && (
        <Box
          sx={{
            width: theme.spacing(width),
          }}
        />
      )}
      {open && (
        <>
          <Box
            sx={{
              alignItems: 'center',
              background: theme.palette.grey[100],
              display: 'flex',
              height: theme.spacing(6),
              justifyContent: 'space-between',
              maxWidth: '100vw',
              width: theme.spacing(width),
            }}
          >
            <Typography
              component={'h3'}
              style={{ paddingLeft: theme.spacing(1) }}
              variant={'h5'}
            >
              {title}
            </Typography>
            <Tooltip
              arrow
              title={closeIconTooltipText}
            >
              <IconButton
                color={'primary'}
                onClick={onClose}
                {...TestIdUtil.createAttributes('SidebarItem-CloseButton')}
              >
                {closeIcon}
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              paddingX: 1,
            }}
          >
            <Box
              sx={{
                height: `calc(100% - ${theme.spacing(6)})`,
                position: 'absolute',
                top: theme.spacing(6),
                width: theme.spacing(width - 1),
              }}
            >
              {children}
            </Box>
          </Box>
        </>
      )}
    </Drawer>

  );
};
