import type { CircularProgressProps } from '@mui/material';
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { ConfigManager } from '../../../classes/managers/ConfigManager';


export type SpinnerProps = {
  readonly color?: 'inherit' | 'primary' | 'secondary';
  readonly inline?: boolean;
  readonly label?: string;
  readonly size?: CircularProgressProps['size'];
  readonly takingLongerLabel?: string;
  readonly takingLongerTimeoutMs?: number;
};

export const Spinner = ({ color = 'primary', inline, label, size, takingLongerLabel, takingLongerTimeoutMs }: SpinnerProps): ReactElement => {
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsTakingLonger(true);
    }, takingLongerTimeoutMs ?? ConfigManager.getInstance().config.spinner.DEFAULT_TAKING_LONGER_TIMEOUT_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [takingLongerTimeoutMs]);

  return (
    <Box
      aria-busy={'true'}
      role={'status'}
      sx={{
        alignItems: 'center',
        bottom: inline ? 'auto' : 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        left: inline ? 'auto' : 0,
        position: inline ? 'relative' : 'absolute',
        right: inline ? 'auto' : 0,
        top: inline ? 'auto' : 0,
        width: inline ? '100%' : 'auto',
      }}
    >
      <Box
        sx={{
          margin: 1,
        }}
      >
        <CircularProgress
          color={color}
          size={size ?? ConfigManager.getInstance().config.spinner.DEFAULT_CIRCULAR_PROGRESS_SIZE}
        />
      </Box>
      <Box
        sx={{
          ...(!label ? visuallyHidden : undefined),
          margin: 1,
        }}
      >
        <Typography
          aria-live={'polite'}
        >
          {label ?? t`Loading`}
        </Typography>
      </Box>
      {isTakingLonger && (
        <Box
          sx={{
            margin: 1,
          }}
        >
          <Typography
            aria-live={'polite'}
          >
            {takingLongerLabel || t`This is taking longer than expected. We are still trying.`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
