import {
  Alert,
  AlertTitle,
  styled,
} from '@mui/material';

const StyledAlert = styled(Alert)(({ theme }) => ({
  '& .MuiAlert-icon': {
    alignItems: 'center',
    display: 'inline-flex',
    fontSize: '18px',
    lineHeight: '18px',
    padding: 0,
  },
  '& .MuiAlert-message': {
    lineHeight: '16px !important',
    padding: '4px 0',
  },
  '& .MuiTypography-root': {
    display: 'inline-block',
    height: '16px',
    lineHeight: '16px !important',
  },
  padding: `0 ${theme.spacing(1)}`,
}));

export type EpiWarningProps = {
  readonly warningMessage: string;
};

export const EpiWarning = ({ warningMessage }: EpiWarningProps) => {
  return (
    <StyledAlert severity={'warning'}>
      <AlertTitle>
        {warningMessage}
      </AlertTitle>
    </StyledAlert>
  );
};
