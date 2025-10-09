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
import {
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { MenuItemData } from '../../../models/nestedMenu';

import { nestedMenuItemsFromObject } from './nestedMenuItemsFromObject';

interface NestedDropdownProps {
  readonly children?: ReactNode;
  readonly menuItemsData?: MenuItemData;
  readonly onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ButtonProps?: Partial<ButtonProps>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly MenuProps?: Partial<MenuProps>;
  readonly showTopLevelTooltip?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

export const NestedDropdown = ({ ref, ...props }: NestedDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const [t] = useTranslation();
  const theme = useTheme();

  const { menuItemsData: data, onClick, ButtonProps, MenuProps, showTopLevelTooltip, ...rest } = props;

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
      sx={{
        ...(ButtonProps.sx ?? {}),
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        display: 'inline-block',
        width: '100%',
        height: '24px',
        lineHeight: '16px',
        position: 'relative',
        paddingRight: '24px',
        '& .MuiButton-endIcon': {
          display: 'inline-block',
          position: 'absolute',
          right: '8px',
          top: '2px',
        },
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
      {...rest}
    >
      {(ButtonProps.disabled || !showTopLevelTooltip) && buttonElement}
      {(!ButtonProps.disabled && showTopLevelTooltip) && (
        <Tooltip
          arrow
          slotProps={{
            tooltip: {
              sx: {
                marginLeft: `${theme.spacing(0)} !important`,
              },
            },
          }}
          placement={'right'}
          title={data?.tooltip ?? data?.label ?? t`Menu`}
        >
          {buttonElement}
        </Tooltip>
      )}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onMenuClose}
        {...MenuProps}
      >
        {menuItems}
      </Menu>
    </Box>
  );
};
