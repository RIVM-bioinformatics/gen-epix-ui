import type { CircularProgressProps } from '@mui/material';

export interface GenEpixCoreComponentsTheme {
  'gen-epix-ui-core-components': {
    spinner: {
      color?: 'inherit' | 'primary' | 'secondary';
      inline?: boolean;
      label?: string;
      size?: number;
      takingLongerLabel?: CircularProgressProps['size'];
      takingLongerTimeoutMs?: number;
      textColor?: string;
    };
  };
}
