import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export type WidgetUnavailableProps = {
  readonly reason?: ReactElement | string;
  readonly widgetLabel: string;
};

export const WidgetUnavailable = ({ reason, widgetLabel }: WidgetUnavailableProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      <Alert
        severity={'info'}
        sx={{
          left: '50%',
          minWidth: '75%',
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <AlertTitle
          sx={{
            width: '100%',
          }}
        >
          {t('The {{widgetLabel}} cannot be shown.', { widgetLabel })}
        </AlertTitle>
        {reason}
      </Alert>
    </Box>
  );
};
