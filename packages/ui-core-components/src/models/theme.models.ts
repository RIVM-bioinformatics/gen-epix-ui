import type {
  CircularProgressProps,
  Theme,
} from '@mui/material';

export interface GenEpixCoreComponentsTheme {
  components: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiCoreComponentsSpinner: {
      defaultProps: {
        color?: 'inherit' | 'primary' | 'secondary';
        inline?: boolean;
        label?: string;
        size?: CircularProgressProps['size'];
        takingLongerLabel?: string;
        takingLongerTimeoutMs?: number;
        textColor?: string;
      };
    };
  } & Theme['components'];
}
