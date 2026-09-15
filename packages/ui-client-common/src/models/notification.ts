import type { AlertColor } from '@mui/material';
import type { ReactElement } from 'react';

export interface Notification {
  autoHideAfterMs?: number;
  isLoading?: boolean;
  key: string;
  message: ReactElement | string;
  severity: AlertColor;
  timestamp: number;
  visible?: boolean;
}
