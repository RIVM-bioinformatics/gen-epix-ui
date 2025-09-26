import type { ContainerOwnProps } from '@mui/material';
import {
  Box,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export type EpiUploadNavigationProps = {
  readonly onProceedButtonClick?: () => void;
  readonly onGoBackButtonClick?: () => void;
  readonly containerProps?: ContainerOwnProps;
  readonly proceedLabel?: string;
  readonly backLabel?: string;
  readonly proceedDisabled?: boolean;
};

export const EpiUploadNavigation = ({ onProceedButtonClick: onProceedButtonClick, onGoBackButtonClick: onGoBack, proceedLabel, backLabel, proceedDisabled }: EpiUploadNavigationProps) => {
  const [t] = useTranslation();

  return (
    <Box
      sx={{
        marginTop: 1,
        paddingTop: 1,
        display: 'flex',
        gap: 2,
        justifyContent: 'flex-end',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {onGoBack && (
        <Button
          variant={'outlined'}
          onClick={onGoBack}
        >
          {t(backLabel ?? 'Go back')}
        </Button>
      )}
      {onProceedButtonClick && (
        <Button
          variant={'contained'}
          disabled={proceedDisabled}
          onClick={onProceedButtonClick}
        >
          {t(proceedLabel ?? 'Save & Continue')}
        </Button>
      )}
    </Box>
  );

};
