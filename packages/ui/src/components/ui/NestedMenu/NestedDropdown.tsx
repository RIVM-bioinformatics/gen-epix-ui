import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import type { MenuProps } from '@mui/material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Menu from '@mui/material/Menu';
import type {
  MouseEvent,
  ReactNode,
  Ref,
} from 'react';
import {
  useCallback,
  useState,
} from 'react';
import type { BoxProps } from '@mui/material';
import {
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { MenuItemData } from '../../../models/nestedMenu';

import { nestedMenuItemsFromObject } from './nestedMenuItemsFromObject';

interface NestedDropdownProps {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ButtonProps?: Partial<ButtonProps>;
  readonly children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ContainerProps?: Partial<BoxProps>;
  readonly menuItemsData?: MenuItemData;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly MenuProps?: Partial<MenuProps>;
  readonly onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  readonly ref?: Ref<HTMLDivElement>;
  readonly showTopLevelTooltip?: boolean;
}

export const NestedDropdown = ({ ref, ...props }: NestedDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();
  const theme = useTheme();

  const { ButtonProps, ContainerProps, menuItemsData: data, MenuProps, onClick, showTopLevelTooltip, ...rest } = props;

  const onButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (onClick) {
      onClick(event);
    }
  }, [onClick]);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  const onMenuClose = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const menuItems = nestedMenuItemsFromObject({
    handleClose,
    isOpen: open,
    menuItemsData: data?.items ?? [],
  });

  const buttonElement = (
    <Button
      endIcon={<ExpandMoreIcon />}
      onClick={onButtonClick}
      {...ButtonProps}
      aria-expanded={open ? 'true' : 'false'}
      sx={{
        ...(ButtonProps.sx ?? {}),
        '& .MuiButton-endIcon': {
          display: 'inline-block',
          position: 'absolute',
          right: '8px',
          top: '2px',
        },
        display: 'inline-block',
        height: '24px',
        lineHeight: '16px',
        overflow: 'hidden',
        paddingRight: '24px',
        position: 'relative',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
      }}
    >
      {data?.label ?? t`Menu`}
    </Button>
  );

  return (
    <Box
      ref={ref}
      sx={{
        maxWidth: '100%',
      }}
      {...ContainerProps}
      {...rest}
    >
      {(ButtonProps.disabled || !showTopLevelTooltip) && buttonElement}
      {(!ButtonProps.disabled && showTopLevelTooltip) && (
        <Tooltip
          arrow
          placement={'right'}
          slotProps={{
            tooltip: {
              sx: {
                marginLeft: `${theme.spacing(0)} !important`,
              },
            },
          }}
          title={data?.tooltip ?? data?.label ?? t`Menu`}
        >
          {buttonElement}
        </Tooltip>
      )}
      <Menu
        anchorEl={anchorEl}
        onClose={onMenuClose}
        open={open}
        {...MenuProps}
      >
        {menuItems}
      </Menu>
    </Box>
  );
};
