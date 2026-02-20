import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { Typography } from '@mui/material';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';

export const EpiLineListTitle = () => {
  const epiStore = useContext(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const selectedIds = useStore(epiStore, useShallow((state) => state.selectedIds));

  return (
    <Typography
      component={'div'}
      sx={{
        fontWeight: 600,
        lineHeight: theme => theme.spacing(3),
      }}
      role={'status'}
      aria-live={'polite'}
    >
      {t('Line list: {{shownCount}} cases, {{selectedCount}} selected', { shownCount: sortedData.length ?? 0, selectedCount: selectedIds.length ?? 0 })}
    </Typography>
  );
};
