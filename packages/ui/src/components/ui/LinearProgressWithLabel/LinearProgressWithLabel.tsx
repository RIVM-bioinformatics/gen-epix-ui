import type { LinearProgressProps } from '@mui/material';
import {
  Box,
  LinearProgress,
  Typography,
} from '@mui/material';

export type LinearProgressWithLabelProps = {
  readonly value: number;
} & LinearProgressProps;

export const LinearProgressWithLabel = (props: LinearProgressWithLabelProps) => {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex' }}>
      <Box sx={{ mr: 1, width: '100%' }}>
        <LinearProgress
          variant={'determinate'}
          {...props}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          sx={{ color: 'text.secondary' }}
          variant={'body2'}
        >
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};
