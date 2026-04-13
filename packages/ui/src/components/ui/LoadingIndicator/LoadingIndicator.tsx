import {
  LinearProgress,
  styled,
} from '@mui/material';

export const LoadingIndicator = styled(LinearProgress)(() => ({
  left: 0,
  position: 'absolute',
  right: 0,
  zIndex: 1,
})) as typeof LinearProgress;
