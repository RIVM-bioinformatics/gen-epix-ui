import {
  Alert,
  AlertTitle,
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
    <Alert
      severity={'info'}
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
  );
};
