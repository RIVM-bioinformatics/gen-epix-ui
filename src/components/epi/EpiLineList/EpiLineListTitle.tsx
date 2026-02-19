import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';

export const EpiLineListTitle = () => {
  const epiStore = useContext(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const selectedIds = useStore(epiStore, useShallow((state) => state.selectedIds));

  return (
    <strong>
      {t('Line list: {{shownCount}} cases, {{selectedCount}} selected', { shownCount: sortedData.length ?? 0, selectedCount: selectedIds.length ?? 0 })}
    </strong>
  );
};
