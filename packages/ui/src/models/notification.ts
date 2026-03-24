import type { AlertColor } from '@mui/material';
import type { ReactElement } from 'react';

export interface Notification {
  isLoading?: boolean;
  message: string | ReactElement;
  severity: AlertColor;
  key: string;
  autoHideAfterMs?: number;
  visible?: boolean;
  timestamp: number;
}
