import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { Typography } from '@mui/material';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';

export const EpiLineListWidgetTitle = () => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const sortedData = useStore(epiDashboardStore, useShallow((state) => state.sortedData));
  const selectedIds = useStore(epiDashboardStore, useShallow((state) => state.selectedIds));

  return (
    <Typography
      aria-live={'polite'}
      component={'div'}
      role={'status'}
      sx={{
        fontWeight: 600,
        lineHeight: theme => theme.spacing(3),
      }}
    >
      {t('Line list: {{shownCount}} cases, {{selectedCount}} selected', { selectedCount: selectedIds.length ?? 0, shownCount: sortedData.length ?? 0 })}
    </Typography>
  );
};
