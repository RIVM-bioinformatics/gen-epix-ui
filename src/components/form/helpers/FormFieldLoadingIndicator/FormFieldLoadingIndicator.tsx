import {
  LinearProgress,
  useTheme,
} from '@mui/material';

export type FormFieldLoadingIndicatorProps = {
  readonly inline?: boolean;
};

export const FormFieldLoadingIndicator = ({ inline }: FormFieldLoadingIndicatorProps) => {
  const theme = useTheme();
  return (
    <LinearProgress
      sx={{
        height: '1px',
        position: inline ? undefined : 'absolute',
        top: inline ? theme.spacing(1) : '47px',
        width: '100%',
      }}
    />
  );
};
