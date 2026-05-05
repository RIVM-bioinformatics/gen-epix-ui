import type { ContainerOwnProps } from '@mui/material';
import {
  Box,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export type EpiUploadNavigationProps = {
  readonly backLabel?: string;
  readonly containerProps?: ContainerOwnProps;
  readonly onGoBackButtonClick?: () => void;
  readonly onProceedButtonClick?: () => void;
  readonly proceedDisabled?: boolean;
  readonly proceedLabel?: string;
};

export const EpiUploadNavigation = ({ backLabel, onGoBackButtonClick: onGoBack, onProceedButtonClick: onProceedButtonClick, proceedDisabled, proceedLabel }: EpiUploadNavigationProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        gap: 2,
        justifyContent: 'flex-end',
        marginTop: 1,
        paddingTop: 1,
      }}
    >
      {onGoBack && (
        <Button
          onClick={onGoBack}
          variant={'outlined'}
        >
          {backLabel ?? t`Go back`}
        </Button>
      )}
      {onProceedButtonClick && (
        <Button
          color={'secondary'}
          disabled={proceedDisabled}
          onClick={onProceedButtonClick}
          variant={'contained'}
        >
          {proceedLabel ?? t`Next`}
        </Button>
      )}
    </Box>
  );

};
