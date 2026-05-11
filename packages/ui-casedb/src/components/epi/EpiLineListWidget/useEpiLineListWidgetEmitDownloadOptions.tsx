import {
  use,
  useCallback,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EPI_ZONE } from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { EpiLineListUtil } from '../../../utils/EpiLineListUtil';

export const useEpiLineListWidgetEmitDownloadOptions = () => {
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const sortedData = useStore(epiDashboardStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));

  const getVisibleColumnIds = useCallback(() => {
    return epiDashboardStore.getState().columnVisualSettings.filter(x => x.isVisible).map(x => x.id);
  }, [epiDashboardStore]);

  useEffect(() => {
    const emitDownloadOptions = (selectedIds: string[]) => {
      EpiEventBusManager.getInstance().emit('onDownloadOptionsChanged', {
        items: [
          {
            disabled: !sortedData?.length,
            items: [
              {
                callback: async () => CaseDbDownloadUtil.downloadAsExcel(sortedData, getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as Excel`,
              },
              {
                callback: () => CaseDbDownloadUtil.downloadAsCsv(sortedData, getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as CSV`,
              },
              {
                callback: () => EpiEventBusManager.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData }),
                label: t`Download sequences`,
              },
              {
                callback: () => null,
                disabled: true,
                label: t`Download allele profiles`,
              },
            ],
            label: t`All rows`,
          },
          {
            disabled: selectedIds.length === 0,
            items: [
              {
                callback: async () => CaseDbDownloadUtil.downloadAsExcel(EpiLineListUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as Excel`,
              },
              {
                callback: () => CaseDbDownloadUtil.downloadAsCsv(EpiLineListUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as CSV`,
              },
              {
                callback: () => EpiEventBusManager.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData.filter(c => selectedIds.includes(c.id)) }),
                label: t`Download sequences`,
              },
              {
                callback: () => null,
                disabled: true,
                label: t`Download allele profiles`,
              },
            ],
            label: t`Selected rows`,
          },
        ],
        zone: EPI_ZONE.LINE_LIST,
        zoneLabel: t`Line list`,
      });
    };
    emitDownloadOptions(epiDashboardStore.getState().selectedIds);
    const unsubscribe = epiDashboardStore.subscribe((state, prevState) => {
      if (JSON.stringify(state.selectedIds) !== JSON.stringify(prevState.selectedIds)) {
        emitDownloadOptions(state.selectedIds);
      }
    });

    const onDownloadOptionsRequested = () => {
      emitDownloadOptions(epiDashboardStore.getState().selectedIds);
    };
    const epiEventBusManager = EpiEventBusManager.getInstance();
    epiEventBusManager.addEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
    return () => {
      epiEventBusManager.emit('onDownloadOptionsChanged', {
        items: null,
        zone: EPI_ZONE.LINE_LIST,
        zoneLabel: t`Line list`,
      });
      epiEventBusManager.removeEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
      unsubscribe();
    };
  }, [completeCaseType, epiDashboardStore, getVisibleColumnIds, sortedData, t]);
};
