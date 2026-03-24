import {
  Box,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import type { PropsWithTestIdAttributes } from '../../../models/testId';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export type SidebarItemSharedProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

export type SidebarItemProps = PropsWithTestIdAttributes<PropsWithChildren<{
  readonly width: number;
  readonly title: string;
  readonly closeIconTooltipText: string;
  readonly closeIcon: ReactElement;
} & SidebarItemSharedProps>>;

export const SidebarItem = ({ open, onClose, children, width, title, closeIconTooltipText, closeIcon, testIdAttributes }: SidebarItemProps) => {
  const theme = useTheme();
  const [mainContentDOMRect, setMainContentDOMRect] = useState<DOMRect>(null);

  useEffect(() => {
    const mainContentElement = document.getElementById(ConfigManager.instance.config.layout.MAIN_CONTENT_ID);

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

  const { top, height } = mainContentDOMRect ?? {};

  return (
    <Drawer
      ModalProps={{
        ...TestIdUtil.createAttributes('SidebarItem', testIdAttributes),
        sx: {
          top,
          height,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        BackdropProps: {
          sx: {
            top,
            height,
          },
        },
      }}
      PaperProps={{
        sx: {
          top,
          height,
        },
      }}
      anchor={'left'}
      open={open}
      onClose={onClose}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: theme.spacing(6),
              width: theme.spacing(width),
              maxWidth: '100vw',
              background: theme.palette.grey[100],
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
          <Box paddingX={1}>
            <Box
              sx={{
                position: 'absolute',
                top: theme.spacing(6),
                height: `calc(100% - ${theme.spacing(6)})`,
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
