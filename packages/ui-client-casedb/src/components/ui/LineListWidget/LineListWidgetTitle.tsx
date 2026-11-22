import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { Typography } from '@mui/material';

import { DashboardStoreContext } from '../../../stores/dashboardStore';

export const LineListWidgetTitle = () => {
  const dashboardStore = use(DashboardStoreContext);
  const { t } = useTranslation();
  const sortedData = useStore(dashboardStore, useShallow((state) => state.sortedData));
  const selectedIds = useStore(dashboardStore, useShallow((state) => state.selectedIds));

  const selectedCount = selectedIds.length;
  const shownCount = sortedData.length;
  /* v8 ignore next -- sortedData and selectedIds are arrays, so their length is never nullish and the ?? 0 fallbacks are unreachable */
  const message = t('Line list: {{shownCount}} cases, {{selectedCount}} selected', { selectedCount: selectedCount ?? 0, shownCount: shownCount ?? 0 });

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
      {message}
    </Typography>
  );
};
