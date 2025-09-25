import type { ContainerOwnProps } from '@mui/material';
import {
  Box,
  Button,
  Container,
} from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type EpiUploadNavigationProps = {
  readonly onProceedButtonClick?: () => void;
  readonly onGoBackButtonClick?: () => void;
  readonly containerProps?: ContainerOwnProps;
  readonly proceedLabel?: string;
  readonly backLabel?: string;
  readonly container?: boolean;
};

export const EpiUploadNavigation = ({ onProceedButtonClick: onProceedButtonClick, onGoBackButtonClick: onGoBack, containerProps, proceedLabel, backLabel, container }: EpiUploadNavigationProps) => {
  const [t] = useTranslation();

  const content = useMemo(() => (
    <Box
      sx={{
        marginTop: 2,
        display: 'flex',
        gap: 2,
        justifyContent: 'flex-end',
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
          onClick={onProceedButtonClick}
        >
          {t(proceedLabel ?? 'Next')}
        </Button>
      )}
    </Box>
  ), [backLabel, onGoBack, onProceedButtonClick, proceedLabel, t]);

  if (!container) {
    return content;
  }

  return (
    <Container
      {...containerProps}
      maxWidth={containerProps?.maxWidth ?? 'xl'}
    >
      {content}
    </Container>
  );
};
