import type { SxProps } from '@mui/material';
import type {
  ReactElement,
  ReactNode,
} from 'react';

export interface MenuItemData {
  uid?: string;
  label?: string;
  tooltip?: string | ReactElement;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  callback?: () => void;
  items?: MenuItemData[];
  disabled?: boolean;
  divider?: boolean;
  autoCloseDisabled?: boolean;
  sx?: SxProps;
  active?: boolean;
}
