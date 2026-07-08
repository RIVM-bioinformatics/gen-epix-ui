import { Box } from '@mui/system';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { EChartsType } from 'echarts';
import {
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import {
  dispose,
  getInstanceByDom,
  init,
  use as registerECharts,
} from 'echarts/core';
import EChartsReact from 'echarts-for-react';
import type {
  CaseDbCol,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import { useStore } from 'zustand';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { useTranslation } from 'react-i18next';
import round from 'lodash/round';
import { useTheme } from '@mui/material';

import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';
import type { ContextMenuConfigWithPosition } from '../ContextMenu';
import { ContextMenu } from '../ContextMenu';
import { DashboardWidget } from '../Dashboard';
import { WidgetUnavailable } from '../WidgetUnavailable';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { EventBusService } from '../../../classes/services/EventBusService';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import type { HistogramWidgetData } from '../../../models/dashboard';
import {
  HISTOGRAM_ALLOWED_COL_TYPES,
  HistogramUtil,
} from '../../../utils/HistogramUtil';

registerECharts([TooltipComponent, BarChart, LegendComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

export const HistogramWidget = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chartRef = useRef<EChartsReact>(null);
  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const updateWidgetData = useStore(dashboardStore, (state) => state.updateWidgetData);
  const epiCurveWidgetData = useStore(dashboardStore, (state) => state.getWidgetData<HistogramWidgetData>(DASHBOARD_WIDGET_NAME.HISTOGRAM));

  const allowedColTypes = useMemo<CaseDbColType[]>(() => {
    return HISTOGRAM_ALLOWED_COL_TYPES;
  }, []);

  const allowedCols = useMemo(() => {
    return HistogramUtil.getAllowedCols(completeCaseType, allowedColTypes);
  }, [allowedColTypes, completeCaseType]);

  const [aCol, setACol] = useState<CaseDbCol | null>(epiCurveWidgetData.colAId ? completeCaseType?.cols[epiCurveWidgetData.colAId] ?? null : null);
  const [bCol, setBCol] = useState<CaseDbCol | null>(epiCurveWidgetData.colBId ? completeCaseType?.cols[epiCurveWidgetData.colBId] ?? null : null);

  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithPosition | null>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setContextMenuConfig(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return DashboardUtil.getCaseCount(sortedData);
  }, [sortedData]);


  const shouldShowWidget = allowedColTypes?.length > 1;
  const shouldShowGraph = shouldShowWidget && aCol && bCol && lineListCaseCount > 0;

  const onMenuItemClick = useCallback((x: CaseDbCol, y: CaseDbCol) => {
    setACol(x);
    setBCol(y);
    updateWidgetData(DASHBOARD_WIDGET_NAME.HISTOGRAM, {
      colAId: x.id,
      colBId: y.id,
    });
  }, [updateWidgetData]);

  useEffect(() => {
    if (aCol || bCol) {
      return;
    }
    const defaultCols = HistogramUtil.getDefaultCols(allowedCols, completeCaseType);
    if (!defaultCols) {
      return;
    }
    const { newColA, newColB } = defaultCols;

    setACol(newColA);
    setBCol(newColB);

    updateWidgetData(DASHBOARD_WIDGET_NAME.HISTOGRAM, {
      colAId: newColA.id,
      colBId: newColB.id,
    });
  }, [aCol, allowedCols, bCol, completeCaseType, updateWidgetData]);

  const [conceptsA, conceptsB] = useMemo(() => {
    return HistogramUtil.getConcepts(aCol, bCol, completeCaseType);
  }, [aCol, bCol, completeCaseType]);

  const series = useMemo(() => {
    return HistogramUtil.getSeries(aCol, bCol, completeCaseType, sortedData, conceptsA, conceptsB);
  }, [aCol, bCol, completeCaseType, sortedData, conceptsA, conceptsB]);

  const histogramCaseCount = useMemo(() => {
    return HistogramUtil.getCaseCount(series);
  }, [series]);

  const missingCasesCount = lineListCaseCount - histogramCaseCount;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;

  const colors = useMemo(() => {
    return HistogramUtil.getColors(aCol, completeCaseType, sortedData);
  }, [completeCaseType, aCol, sortedData]);

  const getOptions = useCallback(() => {
    if (!shouldShowGraph) {
      return null;
    }

    return HistogramUtil.getChartOptions({
      aCol,
      bCol,
      colors,
      conceptsA,
      conceptsB,
      series,
      t,
      theme,
    });
  }, [shouldShowGraph, colors, theme, conceptsB, series, conceptsA, aCol, bCol, t]);

  const titleMenu = useMemo<MenuItemData>(() => {
    let label: string;
    if (aCol && bCol) {
      label = t('Histogram: {{aColLabel}} and {{bColLabel}}', { aColLabel: aCol.label, bColLabel: bCol.label });
    } else {
      label = t`Histogram`;
    }

    const mainMenu: MenuItemData = {
      disabled: !shouldShowWidget || allowedCols.length < 2,
      items: [],
      label,
    };

    allowedCols.forEach(x => {
      const subMenu: MenuItemData = {
        active: aCol?.id === x.id || undefined,
        items: [],
        label: t('Grouping: {{label}}', { label: x.label }),
      };
      allowedCols.forEach(y => {
        if (x.id === y.id) {
          return;
        }
        subMenu.items.push({
          active: (aCol?.id === x.id || undefined) && (bCol?.id === y.id || undefined),
          callback: () => {
            onMenuItemClick(x, y);
          },
          label: t('X-Axis: {{label}}', { label: y.label }),
        });
      });
      mainMenu.items.push(subMenu);
    });


    return mainMenu;
  }, [aCol, bCol, shouldShowWidget, allowedCols, t, onMenuItemClick]);

  const onChartReady = useCallback((chart: EChartsType) => {
    if (!aCol || !bCol) {
      return;
    }
    const dom = chart.getDom();
    dom?.setAttribute('aria-label', t('Histogram showing the number of cases for {{aColLabel}} and {{bColLabel}}', { aColLabel: aCol?.label, bColLabel: bCol?.label }));
    dom?.setAttribute('role', 'img');
  }, [aCol, bCol, t]);


  useEffect(() => {
    const emitDownloadOptions = () => {
      EventBusService.getInstance().emit('onDownloadOptionsChanged', {
        disabled: !shouldShowWidget,
        items: [
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Histogram`, chartRef.current.getEchartsInstance(), 'png', completeCaseType, t),
            disabled: !shouldShowGraph,
            label: t`Save as PNG`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Histogram`, chartRef.current.getEchartsInstance(), 'jpeg', completeCaseType, t),
            disabled: !shouldShowGraph,
            label: t`Save as JPEG`,
          },
        ],
        zone: DASHBOARD_WIDGET_NAME.HISTOGRAM,
        zoneLabel: t`Histogram`,
      });
    };
    emitDownloadOptions();
    const eventBusManager = EventBusService.getInstance();
    eventBusManager.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    return () => {
      eventBusManager.emit('onDownloadOptionsChanged', {
        items: null,
        zone: DASHBOARD_WIDGET_NAME.HISTOGRAM,
        zoneLabel: t`Histogram`,
      });
      eventBusManager.removeEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    };
  }, [completeCaseType, shouldShowGraph, shouldShowWidget, t]);

  return (
    <DashboardWidget
      expandDisabled={!shouldShowWidget}
      title={titleMenu}
      warningMessage={shouldShowWidget && histogramCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      widgetName={DASHBOARD_WIDGET_NAME.HISTOGRAM}
    >
      {!shouldShowWidget && (
        <WidgetUnavailable
          widgetLabel={t`Histogram`}
        />
      )}
      {shouldShowWidget && (
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          {shouldShowGraph && (
            <EChartsReact
              echarts={echartsCore}
              notMerge
              onChartReady={onChartReady}
              option={getOptions()}
              ref={chartRef}
              style={{
                height: '100%',
                position: 'absolute',
                width: '100%',
              }}
            />
          )}
          <ContextMenu
            config={contextMenuConfig}
            onMenuClose={onEpiContextMenuClose}
          />
        </Box>
      )}
    </DashboardWidget>
  );
};
