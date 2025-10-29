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
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant={'determinate'}
          {...props}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant={'body2'}
          sx={{ color: 'text.secondary' }}
        >
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};
