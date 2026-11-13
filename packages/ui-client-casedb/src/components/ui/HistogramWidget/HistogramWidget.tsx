import { container } from 'tsyringe';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
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
import type { EChartsReactProps } from 'echarts-for-react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EChartsReact from 'echarts-for-react';
import type {
  CaseDbCol,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui-core-components/models/nested-menu.models';
import { NestedDropdown } from '@gen-epix/ui-core-components/components/NestedMenu';
import { useConfig } from '@gen-epix/ui-client-common/hooks/useConfig';
import { useStore } from 'zustand';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { useTranslation } from 'react-i18next';
import round from 'lodash/round';

import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { ContextMenuConfigWithPosition } from '../ContextMenu';
import { ContextMenu } from '../ContextMenu';
import { DashboardWidget } from '../Dashboard';
import { WidgetUnavailable } from '../WidgetUnavailable';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { EventBusService } from '../../../classes/services/EventBusService';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import type { HistogramWidgetData } from '../../../models/dashboard.models';
import {
  HISTOGRAM_ALLOWED_COL_TYPES,
  HistogramUtil,
} from '../../../utils/HistogramUtil';
import { DashboardContext } from '../Dashboard/context/DashboardContext';

registerECharts([TooltipComponent, BarChart, LegendComponent, CanvasRenderer]);

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

export const HistogramWidget = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const config = useConfig();
  const [chartRef, setChartRef] = useState<EChartsReact>();
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const echartsOpts = useMemo(() => ({
    nonce: config.nonce,
  }), [config.nonce]);
  const dashboardStore = use(DashboardStoreContext);
  const dashboardContext = use(DashboardContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const setFilterValues = useStore(dashboardStore, (state) => state.setFilterValues);
  const updateWidgetData = useStore(dashboardStore, (state) => state.updateWidgetData);
  const histogramWidgetData = useStore(dashboardStore, (state) => state.getWidgetData<HistogramWidgetData>(DASHBOARD_COMPONENT_NAME.HISTOGRAM));
  const [focussedColValues, setFocussedColValues] = useState<{ a: string; b: string }>(null);

  const allowedColTypes = useMemo<CaseDbColType[]>(() => {
    return HISTOGRAM_ALLOWED_COL_TYPES;
  }, []);

  const allowedCols = useMemo(() => {
    return HistogramUtil.getAllowedCols(completeCaseType, allowedColTypes);
  }, [allowedColTypes, completeCaseType]);

  const [aCol, setACol] = useState<CaseDbCol | null>(histogramWidgetData.colAId ? completeCaseType?.cols[histogramWidgetData.colAId] ?? null : null);
  const [bCol, setBCol] = useState<CaseDbCol | null>(histogramWidgetData.colBId ? completeCaseType?.cols[histogramWidgetData.colBId] ?? null : null);

  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithPosition | null>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setContextMenuConfig(null);
    setFocussedColValues(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return DashboardUtil.getCaseCount(sortedData);
  }, [sortedData]);

  const defaultCols = useMemo(() => {
    return HistogramUtil.getDefaultCols(allowedCols, completeCaseType);
  }, [allowedCols, completeCaseType]);


  const canShowWidget = allowedCols.length > 1 && defaultCols?.newColA && defaultCols?.newColB;
  const shouldShowGraph = canShowWidget && aCol && bCol && lineListCaseCount > 0;

  const onMenuItemClick = useCallback((x: CaseDbCol, y: CaseDbCol) => {
    setACol(x);
    setBCol(y);
    updateWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM, {
      colAId: x.id,
      colBId: y.id,
    });
  }, [updateWidgetData]);


  useEffect(() => {
    if (aCol && bCol) {
      return;
    }
    if (!defaultCols) {
      return;
    }
    const { newColA, newColB } = defaultCols;

    setACol(newColA);
    setBCol(newColB);

    updateWidgetData(DASHBOARD_COMPONENT_NAME.HISTOGRAM, {
      colAId: newColA.id,
      colBId: newColB.id,
    });
  }, [aCol, allowedCols, bCol, completeCaseType, defaultCols, updateWidgetData]);

  const [conceptsA, conceptsB] = useMemo(() => {
    return HistogramUtil.getConcepts(aCol, bCol, completeCaseType);
  }, [aCol, bCol, completeCaseType]);

  const series = useMemo(() => {
    return HistogramUtil.getSeries(aCol, bCol, completeCaseType, sortedData, conceptsA, conceptsB);
  }, [aCol, bCol, completeCaseType, sortedData, conceptsA, conceptsB]);

  const caseIdTargets = useMemo(() => {
    const targetsByCaseId = new Map<string, Array<{ dataIndex: number; seriesIndex: number }>>();
    series?.forEach((serie, seriesIndex) => {
      serie.xCaseIds.forEach((caseIds, dataIndex) => {
        caseIds.forEach((caseId) => {
          const targets = targetsByCaseId.get(caseId);
          const target = { dataIndex, seriesIndex };
          if (targets) {
            targets.push(target);
          } else {
            targetsByCaseId.set(caseId, [target]);
          }
        });
      });
    });
    return targetsByCaseId;
  }, [series]);

  const histogramCaseCount = useMemo(() => {
    return HistogramUtil.getCaseCount(series);
  }, [series]);

  const missingCasesCount = lineListCaseCount - histogramCaseCount;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;

  const widgetUnavailableReason = useMemo<ReactElement | string>(() => {
    if (shouldShowGraph) {
      return;
    }
    if (!defaultCols || allowedCols.length < 2) {
      return t`No two compatible columns found to display a histogram.`;
    }
    if (!lineListCaseCount) {
      return t`No cases found.`;
    }
    if (!histogramCaseCount) {
      return t`No cases found with valid values for the selected columns to display a histogram.`;
    }
    return null;
  }, [allowedCols.length, defaultCols, histogramCaseCount, lineListCaseCount, shouldShowGraph, t]);

  const colors = useMemo(() => {
    return HistogramUtil.getColors(aCol, completeCaseType, sortedData);
  }, [completeCaseType, aCol, sortedData]);

  const options = useMemo(() => {
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

  const axisMenus = useMemo<null | ReactElement>(() => {
    if (!defaultCols?.newColA || !defaultCols?.newColB) {
      return null;
    }

    const selectedACol = aCol ?? defaultCols.newColA;
    const selectedBCol = bCol ?? defaultCols.newColB;
    const isMenuDisabled = !canShowWidget || allowedCols.length < 2;
    const xAxisMenu: MenuItemData = {
      disabled: isMenuDisabled,
      items: allowedCols.filter(col => col.id !== selectedACol.id).map(col => ({
        active: selectedBCol.id === col.id || undefined,
        callback: () => {
          onMenuItemClick(selectedACol, col);
        },
        label: col.label,
      })),
      label: t('X-Axis: {{label}}', { label: selectedBCol.label }),
    };
    const yAxisMenu: MenuItemData = {
      disabled: isMenuDisabled,
      items: allowedCols.filter(col => col.id !== selectedBCol.id).map(col => ({
        active: selectedACol.id === col.id || undefined,
        callback: () => {
          onMenuItemClick(col, selectedBCol);
        },
        label: col.label,
      })),
      label: t('Y-Axis: {{label}}', { label: selectedACol.label }),
    };

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          maxWidth: '45vw',
          width: 320,
        }}
      >
        {[xAxisMenu, yAxisMenu].map(menu => (
          <NestedDropdown
            ButtonProps={{
              color: 'primary',
              disabled: menu.disabled,
              size: 'small',
              variant: 'text',
            }}
            ContainerProps={{
              sx: {
                flex: '1 1 160px',
                minWidth: 0,
              },
            }}
            key={menu.label}
            menuItemsData={menu}
            MenuProps={{ elevation: 3 }}
          />
        ))}
      </Box>
    );
  }, [aCol, bCol, canShowWidget, allowedCols, defaultCols, t, onMenuItemClick]);

  const onChartReady = useCallback((chart: EChartsType) => {
    chartInstanceRef.current = chart;
    if (!aCol || !bCol) {
      return;
    }
    const dom = chart.getDom();
    dom?.setAttribute('aria-label', t('Histogram showing the number of cases for {{aColLabel}} and {{bColLabel}}', { aColLabel: aCol?.label, bColLabel: bCol?.label }));
    dom?.setAttribute('role', 'img');
  }, [aCol, bCol, t]);


  useEffect(() => {
    const emitDownloadOptions = () => {
      container.resolve(EventBusService).emit('onDownloadOptionsChanged', {
        disabled: !canShowWidget,
        items: [
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Histogram`, chartRef.getEchartsInstance(), 'png', completeCaseType, t),
            disabled: !shouldShowGraph || !chartRef,
            label: t`Save as PNG`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Histogram`, chartRef.getEchartsInstance(), 'jpeg', completeCaseType, t),
            disabled: !shouldShowGraph || !chartRef,
            label: t`Save as JPEG`,
          },
        ],
        zone: DASHBOARD_COMPONENT_NAME.HISTOGRAM,
        zoneLabel: t`Histogram`,
      });
    };
    emitDownloadOptions();
    const eventBusManager = container.resolve(EventBusService);
    eventBusManager.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    return () => {
      eventBusManager.emit('onDownloadOptionsChanged', {
        items: null,
        zone: DASHBOARD_COMPONENT_NAME.HISTOGRAM,
        zoneLabel: t`Histogram`,
      });
      eventBusManager.removeEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    };
  }, [completeCaseType, shouldShowGraph, canShowWidget, t, chartRef]);

  const highlight = useCallback((caseIds: string[]) => {
    dashboardContext.highlight({
      caseIds,
      origin: DASHBOARD_COMPONENT_NAME.HISTOGRAM,
    });
  }, [dashboardContext]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {

    const getCaseIdsFromPayload = (payload: unknown): string[] => {
      const eventData = payload as { dataIndex?: number; seriesIndex?: number } | null;
      if (
        typeof eventData?.seriesIndex === 'number' &&
        Number.isInteger(eventData.seriesIndex) &&
        typeof eventData.dataIndex === 'number' &&
        Number.isInteger(eventData.dataIndex)
      ) {
        return series[eventData.seriesIndex]?.xCaseIds[eventData.dataIndex] ?? [];
      }

      const colValues = HistogramUtil.getColValuesFromPayload(payload, conceptsA, conceptsB);
      if (!colValues) {
        return [];
      }

      const seriesIndex = conceptsA.findIndex(concept => concept.id === colValues.a);
      const dataIndex = conceptsB.findIndex(concept => concept.id === colValues.b);
      return series[seriesIndex]?.xCaseIds[dataIndex] ?? [];
    };

    return {
      globalout: () => {
        highlight([]);
      },
      mouseout: () => {
        highlight([]);
      },
      mouseover: (payload: unknown) => {
        highlight(getCaseIdsFromPayload(payload));
      },
      mouseup: (payload: unknown) => {
        const { event } = payload as { event: { event: MouseEvent } };
        setFocussedColValues(HistogramUtil.getColValuesFromPayload(payload, conceptsA, conceptsB));
        setContextMenuConfig({
          caseIds: getCaseIdsFromPayload(payload),
          mouseEvent: event.event,
          position: {
            left: (event.event).clientX,
            top: (event.event).clientY,
          },
        });
      },
    };
  }, [conceptsA, conceptsB, highlight, series]);

  const onShowOnlyFocussedColValuesMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (!focussedColValues || !aCol || !bCol) {
      return;
    }
    await setFilterValues({
      [aCol.id]: [focussedColValues.a],
      [bCol.id]: [focussedColValues.b],
    });

    onMenuClose();
  }, [aCol, bCol, focussedColValues, setFilterValues]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    const conceptALabel = conceptsA.find(concept => concept.id === focussedColValues?.a)?.name;
    const conceptBLabel = conceptsB.find(concept => concept.id === focussedColValues?.b)?.name;
    if (!conceptALabel || !conceptBLabel) {
      return null;
    }
    if (!focussedColValues) {
      return null;
    }
    return (
      <MenuItem
        divider
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={async () => await onShowOnlyFocussedColValuesMenuItemClick(onMenuClose)}
      >
        <ListItemIcon>
          <FilterAltIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t('Filter (show only {{conceptALabel}} and {{conceptBLabel}})', { conceptALabel, conceptBLabel })}
        </ListItemText>
      </MenuItem>
    );
  }, [conceptsA, conceptsB, focussedColValues, onShowOnlyFocussedColValuesMenuItemClick, t]);

  useEffect(() => {
    const unsubscribe = dashboardContext.highlightSubject.subscribe((highlighting) => {
      if (highlighting.origin === DASHBOARD_COMPONENT_NAME.HISTOGRAM) {
        return;
      }
      const instance = chartInstanceRef.current;
      if (!instance) {
        return;
      }

      if (!highlighting?.caseIds?.length) {
        instance.dispatchAction({
          type: 'downplay',
        });
        return;
      }

      const highlightTargetsByDataIndex = new Map<number, Set<number>>();
      highlighting.caseIds.forEach((caseId) => {
        caseIdTargets.get(caseId)?.forEach(({ dataIndex, seriesIndex }) => {
          const seriesIndices = highlightTargetsByDataIndex.get(dataIndex) ?? new Set<number>();
          seriesIndices.add(seriesIndex);
          highlightTargetsByDataIndex.set(dataIndex, seriesIndices);
        });
      });

      instance.dispatchAction({
        type: 'downplay',
      });

      const highlightBatch: Array<{ dataIndex: number; notBlur?: boolean; seriesIndex?: number }> = [];
      highlightTargetsByDataIndex.forEach((seriesIndices, dataIndex) => {
        if (seriesIndices.size === series?.length) {
          highlightBatch.push({
            dataIndex,
          });
          return;
        }

        seriesIndices.forEach((seriesIndex) => {
          highlightBatch.push({
            dataIndex,
            seriesIndex,
          });
        });
      });

      highlightBatch.forEach((target, index) => {
        if (index > 0) {
          target.notBlur = true;
        }
      });

      instance.dispatchAction({
        batch: highlightBatch,
        type: 'highlight',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [caseIdTargets, dashboardContext, series]);

  return (
    <DashboardWidget
      expandDisabled={!canShowWidget}
      primaryMenu={axisMenus ?? undefined}
      title={t`Histogram`}
      warningMessage={canShowWidget && histogramCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      widgetName={DASHBOARD_COMPONENT_NAME.HISTOGRAM}
    >
      {!canShowWidget && (
        <WidgetUnavailable
          reason={widgetUnavailableReason}
          widgetLabel={t`histogram`}
        />
      )}
      {canShowWidget && (
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
              onEvents={onEvents}
              option={options}
              opts={echartsOpts as unknown}
              ref={setChartRef}
              style={{
                height: '100%',
                position: 'absolute',
                width: '100%',
              }}
            />
          )}
          <ContextMenu
            config={contextMenuConfig}
            getExtraItems={getEpiContextMenuExtraItems}
            onMenuClose={onEpiContextMenuClose}
          />
        </Box>
      )}
    </DashboardWidget>
  );
};
