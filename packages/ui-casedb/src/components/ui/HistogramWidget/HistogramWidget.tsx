import { Box } from '@mui/system';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  EChartsOption,
  EChartsType,
} from 'echarts';
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
import { CaseDbColType } from '@gen-epix/api-casedb';
import type { CaseDbCol } from '@gen-epix/api-casedb';
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
import { CaseUtil } from '../../../utils/CaseUtil';
import { DataService } from '../../../classes/services/DataService';
import { StratificationUtil } from '../../../utils/StratificationUtil';
import { STRATIFICATION_MODE } from '../../../models/stratification';
import { EventBusService } from '../../../classes/services/EventBusService';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';

registerECharts([TooltipComponent, BarChart, LegendComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

type SeriesItem = {
  data: (number | string)[];
  name: string;
  type: 'bar';
};

export const HistogramWidget = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chartRef = useRef<EChartsReact>(null);
  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);

  const allowedColTypes = useMemo<CaseDbColType[]>(() => {
    return [CaseDbColType.INTERVAL, CaseDbColType.NOMINAL, CaseDbColType.ORDINAL] as CaseDbColType[];
  }, []);

  const allowedCols = useMemo(() => {
    if (!completeCaseType) {
      return [];
    }
    return completeCaseType.ordered_col_ids.reduce<CaseDbCol[]>((acc, colId) => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (allowedColTypes.includes(refCol.col_type)) {
        acc.push(col);
      }
      return acc;
    }, []);

  }, [allowedColTypes, completeCaseType]);

  const [xAxisCol, setXAxisCol] = useState<CaseDbCol | null>(null);
  const [yAxisCol, setYAxisCol] = useState<CaseDbCol | null>(null);

  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithPosition | null>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setContextMenuConfig(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return DashboardUtil.getCaseCount(sortedData);
  }, [sortedData]);


  const shouldShowWidget = allowedColTypes?.length > 1;
  const shouldShowGraph = shouldShowWidget && xAxisCol && yAxisCol && lineListCaseCount > 0;

  const onMenuItemClick = useCallback((x: CaseDbCol, y: CaseDbCol) => {
    setXAxisCol(x);
    setYAxisCol(y);
  }, []);

  const series = useMemo<SeriesItem[]>(() => {
    if (!xAxisCol || !yAxisCol || !completeCaseType) {
      return [];
    }

    const refColY = completeCaseType.ref_cols[yAxisCol.ref_col_id];
    const conceptSetYConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refColY.concept_set_id];
    const conceptsY = conceptSetYConceptIds?.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => a.rank - b.rank) ?? [];

    const refColX = completeCaseType.ref_cols[xAxisCol.ref_col_id];
    const conceptSetXConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refColX.concept_set_id];
    const conceptsX = conceptSetXConceptIds?.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => a.rank - b.rank) ?? [];

    const countMap = new Map<string, Map<string, number>>();

    sortedData.forEach(caseDbCase => {
      const xAxisValue = CaseUtil.getRowValue(caseDbCase.content, xAxisCol, completeCaseType);
      const yAxisValue = CaseUtil.getRowValue(caseDbCase.content, yAxisCol, completeCaseType);

      if (xAxisValue.isMissing || yAxisValue.isMissing) {
        return;
      }

      const xKey = xAxisValue.raw;
      const yKey = yAxisValue.raw;

      if (!countMap.has(yKey)) {
        countMap.set(yKey, new Map<string, number>());
      }
      const xMap = countMap.get(yKey);
      xMap.set(xKey, (xMap.get(xKey) ?? 0) + (caseDbCase.count ?? 1));
    });

    return conceptsY.map(yConcept => {
      const xCounts = countMap.get(yConcept.id) ?? new Map<string, number>();
      return {
        data: conceptsX.map(xConcept => xCounts.get(xConcept.id) ?? 0),
        name: yConcept.name,
        type: 'bar',
      };
    });
  }, [completeCaseType, sortedData, xAxisCol, yAxisCol]);

  const histogramCaseCount = useMemo(() => {
    if (!series?.length) {
      return 0;
    }
    return series.reduce((total, item) => {
      return total + (item.data as number[]).reduce((subTotal, value) => {
        if (typeof value === 'number') {
          return subTotal + value;
        }
        return subTotal;
      }, 0);
    }, 0);
  }, [series]);

  const missingCasesCount = lineListCaseCount - histogramCaseCount;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;

  const colors = useMemo(() => {
    const stratification = StratificationUtil.getStratification({
      col: yAxisCol,
      completeCaseType,
      mode: STRATIFICATION_MODE.FIELD,
      sortedData,
    });
    return stratification?.legendaItems.map(l => l.color) ?? [];
  }, [completeCaseType, yAxisCol, sortedData]);

  const getOptions = useCallback(() => {
    if (!shouldShowGraph) {
      return null;
    }
    const refColY = completeCaseType?.ref_cols[yAxisCol?.ref_col_id ?? ''];
    const conceptSetYConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refColY.concept_set_id];
    const conceptsY = conceptSetYConceptIds?.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => a.rank - b.rank) ?? [];

    const refColX = completeCaseType?.ref_cols[xAxisCol?.ref_col_id ?? ''];
    const conceptSetXConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refColX.concept_set_id];
    const conceptsX = conceptSetXConceptIds?.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => a.rank - b.rank) ?? [];

    return {
      color: colors,
      grid: {
        bottom: theme.spacing(8),
        left: theme.spacing(1),
        right: theme.spacing(25),
        top: theme.spacing(2),
      },
      legend: {
        align: 'auto',
        data: conceptsY.map(concept => concept.name),
        left: 'right',
        orient: 'vertical',
        pageIconColor: theme.palette.primary.main,
        pageIconInactiveColor: theme.palette.text.disabled,
        type: 'scroll',
      },
      series,
      tooltip: {
        axisPointer: {
          crossStyle: {
            color: theme.palette.primary.main,
          },
          type: 'cross',
        },
        trigger: 'axis',
      },
      xAxis: [
        {
          axisLabel: {
            height: 100,
            rotate: 45,
          },
          axisPointer: {
            type: 'shadow',
          },
          axisTick: {
            alignWithLabel: true,
            show: true,
          },
          data: conceptsX.map(concept => concept.name),
          type: 'category',
        },
      ],
      yAxis: [
        {
          minInterval: 1,
          type: 'value',
        },
      ],
    } satisfies EChartsOption;
  }, [colors, completeCaseType?.ref_cols, series, shouldShowGraph, theme, xAxisCol?.ref_col_id, yAxisCol?.ref_col_id]);

  const titleMenu = useMemo<MenuItemData>(() => {
    let label: string;
    if (xAxisCol && yAxisCol) {
      label = t('Histogram: {{xAxisColLabel}} vs {{yAxisColLabel}}', { xAxisColLabel: xAxisCol.label, yAxisColLabel: yAxisCol.label });
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
        active: xAxisCol?.id === x.id || undefined,
        items: [],
        label: t('X-axis: {{label}}', { label: x.label }),
      };
      allowedCols.forEach(y => {
        if (x.id === y.id) {
          return;
        }
        subMenu.items.push({
          active: (xAxisCol?.id === x.id || undefined) && (yAxisCol?.id === y.id || undefined),
          callback: () => {
            onMenuItemClick(x, y);
          },
          label: t('Y-axis: {{label}}', { label: y.label }),
        });
      });
      mainMenu.items.push(subMenu);
    });


    return mainMenu;
  }, [xAxisCol, yAxisCol, shouldShowWidget, allowedCols, t, onMenuItemClick]);

  const onChartReady = useCallback((chart: EChartsType) => {
    if (!xAxisCol || !yAxisCol) {
      return;
    }
    const dom = chart.getDom();
    dom?.setAttribute('aria-label', t('Histogram showing the number of cases ({{xAxisColLabel}} vs {{yAxisColLabel}})', { xAxisColLabel: xAxisCol?.label, yAxisColLabel: yAxisCol?.label }));
    dom?.setAttribute('role', 'img');
  }, [xAxisCol, yAxisCol, t]);


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
              // onEvents={onEvents}
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
            // getExtraItems={getEpiContextMenuExtraItems}
            onMenuClose={onEpiContextMenuClose}
          />
        </Box>
      )}
    </DashboardWidget>
  );
};
