import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useStore } from 'zustand';
import { produce } from 'immer';

import { userProfileStore } from '../../../stores/userProfileStore';

export type EpiWidgetUnavailableProps = {
  readonly widgetLabel: string;
  readonly widgetName: string;
};

export const EpiWidgetUnavailable = ({ widgetLabel, widgetName }: EpiWidgetUnavailableProps) => {
  const { t } = useTranslation();
  const epiDashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.epiDashboardLayoutUserConfig);
  const setEpiDashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.setEpiDashboardArrangementConfig);

  const onDisableButtonClick = useCallback(() => {
    setEpiDashboardLayoutUserConfig(produce(epiDashboardLayoutUserConfig, (draft => {
      draft.arrangement = 0;
      draft.zones[widgetName as keyof typeof draft.zones] = false;
      return draft;
    })));
  }, [epiDashboardLayoutUserConfig, widgetName, setEpiDashboardLayoutUserConfig]);

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
      <Box
        sx={{
          marginY: 1,
        }}
      >
        <Button
          color={'primary'}
          onClick={onDisableButtonClick}
          size={'small'}
          variant={'outlined'}
        >
          {t('Hide {{widgetLabel}}', { widgetLabel })}
        </Button>
      </Box>
    </Box>
  );
};
