import {
  LinearProgress,
  styled,
} from '@mui/material';

export const LoadingIndicator = styled(LinearProgress)(() => ({
  position: 'absolute',
  left: 0,
  right: 0,
  zIndex: 1,
})) as typeof LinearProgress;
