import type { CircularProgressProps } from '@mui/material';
import {
  Box,
  CircularProgress,
  Typography,
  useThemeProps,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';


const DEFAULT_TAKING_LONGER_TIMEOUT_MS = 5000;
const DEFAULT_CIRCULAR_PROGRESS_SIZE = 40;

export type SpinnerProps = {
  readonly color?: 'inherit' | 'primary' | 'secondary';
  readonly inline?: boolean;
  readonly label?: string;
  readonly size?: CircularProgressProps['size'];
  readonly takingLongerLabel?: string;
  readonly takingLongerTimeoutMs?: number;
  readonly textColor?: string;
};

export const Spinner = (inProps: SpinnerProps): ReactElement => {
  const {
    color = 'primary',
    inline,
    label,
    size = DEFAULT_CIRCULAR_PROGRESS_SIZE,
    takingLongerLabel,
    takingLongerTimeoutMs = DEFAULT_TAKING_LONGER_TIMEOUT_MS,
    textColor,
  } = useThemeProps({ name: 'spinner', props: inProps });
  console.log({ takingLongerLabel });

  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsTakingLonger(true);
    }, takingLongerTimeoutMs);
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
          size={size}
        />
      </Box>
      <Box
        sx={{
          ...(!label ? visuallyHidden : undefined),
          color: textColor ?? 'inherit',
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
            color: textColor ?? 'inherit',
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
