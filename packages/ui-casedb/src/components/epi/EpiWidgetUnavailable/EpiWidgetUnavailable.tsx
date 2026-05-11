import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useStore } from 'zustand';
import { produce } from 'immer';

import type { EPI_ZONE } from '../../../../../ui-casedb/src/models/epi';
import { userProfileStore } from '../../../stores/userProfileStore';

export type EpiWidgetUnavailableProps = {
  readonly epiZone: EPI_ZONE;
  readonly widgetName: string;
};

export const EpiWidgetUnavailable = ({ epiZone, widgetName }: EpiWidgetUnavailableProps) => {
  const { t } = useTranslation();
  const epiDashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.epiDashboardLayoutUserConfig);
  const setEpiDashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.setEpiDashboardLayoutUserConfig);

  const onDisableButtonClick = useCallback(() => {
    setEpiDashboardLayoutUserConfig(produce(epiDashboardLayoutUserConfig, (draft => {
      draft.arrangement = 0;
      draft.zones[epiZone as keyof typeof draft.zones] = false;
      return draft;
    })));
  }, [epiDashboardLayoutUserConfig, epiZone, setEpiDashboardLayoutUserConfig]);

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
          {t('The {{widgetName}} cannot be shown.', { widgetName })}
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
          {t('Hide {{widgetName}}', { widgetName })}
        </Button>
      </Box>
    </Box>
  );
};
