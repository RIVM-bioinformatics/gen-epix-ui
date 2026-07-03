import {
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export type WidgetUnavailableProps = {
  readonly widgetLabel: string;
};

export const WidgetUnavailable = ({ widgetLabel }: WidgetUnavailableProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        marginY: 1,
      }}
    >
      <Box
        sx={{
          marginY: 1,
        }}
      >
        <Typography>
          {t('The {{widgetLabel}} cannot be shown.', { widgetLabel })}
        </Typography>
      </Box>
    </Box>
  );
};
