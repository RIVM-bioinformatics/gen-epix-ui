import {
  Alert,
  AlertTitle,
  styled,
} from '@mui/material';

const StyledAlert = styled(Alert)(({ theme }) => ({
  padding: `0 ${theme.spacing(1)}`,
  '& .MuiAlert-message': {
    padding: '4px 0',
    lineHeight: '16px !important',
  },
  '& .MuiTypography-root': {
    lineHeight: '16px !important',
    display: 'inline-block',
    height: '16px',
  },
  '& .MuiAlert-icon': {
    fontSize: '18px',
    padding: 0,
    lineHeight: '18px',
    display: 'inline-flex',
    alignItems: 'center',
  },
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
