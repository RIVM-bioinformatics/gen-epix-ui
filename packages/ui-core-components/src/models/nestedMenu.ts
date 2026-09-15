import type { SxProps } from '@mui/material';
import type {
  ReactElement,
  ReactNode,
} from 'react';

export interface MenuItemData {
  active?: boolean;
  autoCloseDisabled?: boolean;
  callback?: () => void;
  checked?: 'false' | 'mixed' | 'true';
  disabled?: boolean;
  divider?: boolean;
  items?: MenuItemData[];
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  sx?: SxProps;
  tooltip?: ReactElement | string;
  uid?: string;
}
