import {
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EPI_ZONE } from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { DownloadUtil } from '../../../utils/DownloadUtil';
import { EpiLineListUtil } from '../../../utils/EpiLineListUtil';

export const useEpiLineListEmitDownloadOptions = () => {
  const { t } = useTranslation();
  const epiStore = useContext(EpiDashboardStoreContext);
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));

  const getVisibleColumnIds = useCallback(() => {
    return epiStore.getState().columnSettings.filter(x => x.isVisible).map(x => x.id);
  }, [epiStore]);

  useEffect(() => {
    const emitDownloadOptions = (selectedIds: string[]) => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.LINE_LIST,
        zoneLabel: t`Line list`,
        items: [
          {
            label: t`All rows`,
            items: [
              {
                label: t`Download as Excel`,
                callback: async () => DownloadUtil.downloadAsExcel(sortedData, getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download as CSV`,
                callback: () => DownloadUtil.downloadAsCsv(sortedData, getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download sequences`,
                callback: () => EpiEventBusManager.instance.emit('openSequenceDownloadDialog', { cases: sortedData }),
              },
              {
                label: t`Download allele profiles`,
                disabled: true,
                callback: () => null,
              },
            ],
            disabled: !sortedData?.length,
          },
          {
            label: t`Selected rows`,
            items: [
              {
                label: t`Download as Excel`,
                callback: async () => DownloadUtil.downloadAsExcel(EpiLineListUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download as CSV`,
                callback: () => DownloadUtil.downloadAsCsv(EpiLineListUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download sequences`,
                callback: () => EpiEventBusManager.instance.emit('openSequenceDownloadDialog', { cases: sortedData.filter(c => selectedIds.includes(c.id)) }),
              },
              {
                label: t`Download allele profiles`,
                disabled: true,
                callback: () => null,
              },
            ],
            disabled: selectedIds.length === 0,
          },
        ],
      });
    };
    emitDownloadOptions(epiStore.getState().selectedIds);
    const unsubscribe = epiStore.subscribe((state, prevState) => {
      if (JSON.stringify(state.selectedIds) !== JSON.stringify(prevState.selectedIds)) {
        emitDownloadOptions(state.selectedIds);
      }
    });


    const removeEventListener = EpiEventBusManager.instance.addEventListener('onDownloadOptionsRequested', () => {
      emitDownloadOptions(epiStore.getState().selectedIds);
    });
    return () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.LINE_LIST,
        items: null,
        zoneLabel: t`Line list`,
      });
      removeEventListener();
      unsubscribe();
    };
  }, [completeCaseType, epiStore, getVisibleColumnIds, sortedData, t]);
};
