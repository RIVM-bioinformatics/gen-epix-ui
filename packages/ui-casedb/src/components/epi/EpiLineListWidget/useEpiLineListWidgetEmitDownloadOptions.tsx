import {
  use,
  useCallback,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { EpiEventBusService } from '../../../classes/services/EpiEventBusService';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { EPI_WIDGET_NAME } from '../../../data/epi';

export const useEpiLineListWidgetEmitDownloadOptions = () => {
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const sortedData = useStore(epiDashboardStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));

  const getVisibleColumnIds = useCallback(() => {
    return epiDashboardStore.getState().getCurrentColumnVisualSettings().filter(x => x.isVisible).map(x => x.id);
  }, [epiDashboardStore]);

  useEffect(() => {
    const emitDownloadOptions = (selectedIds: string[]) => {
      EpiEventBusService.getInstance().emit('onDownloadOptionsChanged', {
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
                callback: () => EpiEventBusService.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData }),
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
                callback: async () => CaseDbDownloadUtil.downloadAsExcel(DashboardUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as Excel`,
              },
              {
                callback: () => CaseDbDownloadUtil.downloadAsCsv(DashboardUtil.getSelectedRows(sortedData, selectedIds), getVisibleColumnIds(), completeCaseType, t),
                label: t`Download as CSV`,
              },
              {
                callback: () => EpiEventBusService.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData.filter(c => selectedIds.includes(c.id)) }),
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
        zone: EPI_WIDGET_NAME.LINE_LIST,
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
    const epiEventBusService = EpiEventBusService.getInstance();
    epiEventBusService.addEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
    return () => {
      epiEventBusService.emit('onDownloadOptionsChanged', {
        items: null,
        zone: EPI_WIDGET_NAME.LINE_LIST,
        zoneLabel: t`Line list`,
      });
      epiEventBusService.removeEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
      unsubscribe();
    };
  }, [completeCaseType, epiDashboardStore, getVisibleColumnIds, sortedData, t]);
};
