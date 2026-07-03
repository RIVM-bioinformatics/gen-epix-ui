import type { ContainerOwnProps } from '@mui/material';
import {
  Box,
  Button,
} from '@mui/material';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import { UploadStoreContext } from '../../../stores/uploadStore';

export type UploadNavigationProps = {
  readonly backLabel?: string;
  readonly containerProps?: ContainerOwnProps;
  readonly onGoBackButtonClick?: () => void;
  readonly onProceedButtonClick?: () => void;
  readonly proceedDisabled?: boolean;
  readonly proceedLabel?: string;
};

export const UploadNavigation = ({
  backLabel,
  onGoBackButtonClick: onGoBack,
  onProceedButtonClick: onProceedButtonClick,
  proceedDisabled,
  proceedLabel,
}: UploadNavigationProps) => {
  const { t } = useTranslation();
  const store = use(UploadStoreContext);
  const stepOrder = useStore(store, (state) => state.stepOrder);
  const activeStep = useStore(store, (state) => state.activeStep);
  const goBackFromFirstStepCallback = useStore(store, (state) => state.goBackFromFirstStepCallback);
  const goBackFromFirstStepLabel = useStore(store, (state) => state.goBackFromFirstStepLabel);

  const isFirstStep = activeStep === stepOrder[0];
  const onClickGoBack = isFirstStep ? (goBackFromFirstStepCallback ?? onGoBack) : onGoBack;
  const effectiveBackLabel = isFirstStep ? (goBackFromFirstStepLabel ?? backLabel) : backLabel;

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
      {onClickGoBack && (
        <Button
          onClick={onClickGoBack}
          variant={'outlined'}
        >
          {effectiveBackLabel ?? t`Go back`}
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
