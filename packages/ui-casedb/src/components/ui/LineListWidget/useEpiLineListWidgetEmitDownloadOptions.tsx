import {
  use,
  useCallback,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { EventBusService } from '../../../classes/services/EventBusService';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';

export const useEpiLineListWidgetEmitDownloadOptions = () => {
  const { t } = useTranslation();
  const dashboardStore = use(DashboardStoreContext);
  const sortedData = useStore(dashboardStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(dashboardStore, useShallow((state) => state.completeCaseType));

  const getVisibleColumnIds = useCallback(() => {
    return dashboardStore.getState().getCurrentColumnVisualSettings().filter(x => x.isVisible).map(x => x.id);
  }, [dashboardStore]);

  useEffect(() => {
    const emitDownloadOptions = (selectedIds: string[]) => {
      EventBusService.getInstance().emit('onDownloadOptionsChanged', {
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
                callback: () => EventBusService.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData }),
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
                callback: () => EventBusService.getInstance().emit('openSequenceDownloadDialog', { cases: sortedData.filter(c => selectedIds.includes(c.id)) }),
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
        zone: DASHBOARD_WIDGET_NAME.LINE_LIST,
        zoneLabel: t`Line list`,
      });
    };
    emitDownloadOptions(dashboardStore.getState().selectedIds);
    const unsubscribe = dashboardStore.subscribe((state, prevState) => {
      if (JSON.stringify(state.selectedIds) !== JSON.stringify(prevState.selectedIds)) {
        emitDownloadOptions(state.selectedIds);
      }
    });

    const onDownloadOptionsRequested = () => {
      emitDownloadOptions(dashboardStore.getState().selectedIds);
    };
    const eventBusService = EventBusService.getInstance();
    eventBusService.addEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
    return () => {
      eventBusService.emit('onDownloadOptionsChanged', {
        items: null,
        zone: DASHBOARD_WIDGET_NAME.LINE_LIST,
        zoneLabel: t`Line list`,
      });
      eventBusService.removeEventListener('onDownloadOptionsRequested', onDownloadOptionsRequested);
      unsubscribe();
    };
  }, [completeCaseType, dashboardStore, getVisibleColumnIds, sortedData, t]);
};
