import {
  Backdrop,
  useTheme,
} from '@mui/material';

import type { SpinnerProps } from '../Spinner';
import { Spinner } from '../Spinner';

export type BackdropSpinnerProps = {
  readonly open: boolean;
} & Omit<SpinnerProps, 'inline'>;

export const BackdropSpinner = ({ open, ...spinnerProps }: BackdropSpinnerProps) => {
  const theme = useTheme();
  return (
    <Backdrop
      open={open}
      sx={{
        backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
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
