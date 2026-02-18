import type { CircularProgressProps } from '@mui/material';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useState,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { ConfigManager } from '../../../classes/managers/ConfigManager';


export type SpinnerProps = {
  readonly label?: string;
  readonly takingLongerLabel?: string;
  readonly takingLongerTimeoutMs?: number;
  readonly inline?: boolean;
  readonly color?: 'secondary' | 'primary' | 'inherit';
  readonly size?: CircularProgressProps['size'];
};

export const Spinner = ({ label, inline, color = 'primary', takingLongerLabel, takingLongerTimeoutMs, size }: SpinnerProps): ReactElement => {
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsTakingLonger(true);
    }, takingLongerTimeoutMs ?? ConfigManager.instance.config.spinner.DEFAULT_TAKING_LONGER_TIMEOUT_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [takingLongerTimeoutMs]);

  return (
    <Box
      sx={{
        width: inline ? '100%' : 'auto',
        top: inline ? 'auto' : 0,
        bottom: inline ? 'auto' : 0,
        left: inline ? 'auto' : 0,
        right: inline ? 'auto' : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: inline ? 'relative' : 'absolute',
      }}
      role={'status'}
      aria-busy={'true'}
    >
      <Box margin={1}>
        <CircularProgress
          color={color}
          size={size ?? ConfigManager.instance.config.spinner.DEFAULT_CIRCULAR_PROGRESS_SIZE}
        />
      </Box>
      <Box
        margin={1}
        sx={!label ? visuallyHidden : undefined}
      >
        <Typography>
          {label ?? t`Loading`}
        </Typography>
      </Box>
      {isTakingLonger && (
        <Box margin={1}>
          <Typography>
            {takingLongerLabel || t`This is taking longer than expected. We are still trying.`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
