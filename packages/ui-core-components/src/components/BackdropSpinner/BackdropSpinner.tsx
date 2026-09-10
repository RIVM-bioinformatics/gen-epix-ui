import {
  Backdrop,
  useTheme,
} from '@mui/material';

import type { SpinnerProps } from '../Spinner';
import { Spinner } from '../Spinner';

export type BackdropSpinnerProps = {
  readonly backgroundColor?: string;
  readonly open: boolean;
} & Omit<SpinnerProps, 'inline'>;

export const BackdropSpinner = ({ backgroundColor, open, ...spinnerProps }: BackdropSpinnerProps) => {
  const theme = useTheme();
  return (
    <Backdrop
      open={open}
      sx={{
        backdropFilter: 'blur(3px)',
        backgroundColor: backgroundColor ?? (theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      {open && (
        <Spinner
          {...spinnerProps}
        />
      )}
    </Backdrop>
  );
};
