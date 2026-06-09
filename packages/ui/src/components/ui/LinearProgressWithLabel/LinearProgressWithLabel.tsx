import type { LinearProgressProps } from '@mui/material';
import {
  Box,
  LinearProgress,
  Typography,
} from '@mui/material';

export type LinearProgressWithLabelProps = {
  readonly value: number;
} & LinearProgressProps;

export const LinearProgressWithLabel = ({ value, ...props }: LinearProgressWithLabelProps) => {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex' }}>
      <Box sx={{ mr: 1, width: '100%' }}>
        <LinearProgress
          variant={value > 1 ? 'determinate' : 'indeterminate'}
          {...props}
        />
      </Box>
      {value > 1 && (
        <Box sx={{ minWidth: 35 }}>
          <Typography
            sx={{ color: 'text.secondary' }}
            variant={'body2'}
          >
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
