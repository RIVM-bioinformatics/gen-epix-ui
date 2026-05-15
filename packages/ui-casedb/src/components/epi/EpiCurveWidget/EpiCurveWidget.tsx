import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import {
  dispose,
  getInstanceByDom,
  init,
  use as registerECharts,
} from 'echarts/core';
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components';
import {
  BarChart,
  LineChart,
} from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type EChartsReact from 'echarts-for-react';
import type { ReactElement } from 'react';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import intersection from 'lodash/intersection';
import isString from 'lodash/isString';
import round from 'lodash/round';
import type { EChartsType } from 'echarts';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  endOfISOWeek,
  endOfQuarter,
  endOfYear,
  lastDayOfMonth,
  parse,
  startOfISOWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';
import type { CaseDbCol } from '@gen-epix/api-casedb';
import { CaseDbDimType } from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import { DATE_FORMAT } from '@gen-epix/ui';

import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { EPI_ZONE } from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidget } from '../EpiWidget';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { EpiLineListUtil } from '../../../utils/EpiLineListUtil';
import { userProfileStore } from '../../../stores/userProfileStore';

import { EpiCurveBarChart } from './EpiCurveBarChart';
import { EpiCurveStackedAreaChart } from './EpiCurveStackedAreaChart';

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

registerECharts([TooltipComponent, GridComponent, DataZoomComponent, BarChart, LineChart, CanvasRenderer]);

export type ChartType = 'area' | 'bar';

export const EpiCurveWidget = () => {
  const { t } = useTranslation();
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const highlightingManager = useMemo(() => EpiHighlightingManager.getInstance(), []);
  const chartRef = useRef<EChartsReact>(null);

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const isDataLoading = useStore(epiDashboardStore, (state) => state.isDataLoading);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const updateEpiCurveWidgetData = useStore(epiDashboardStore, (state) => state.updateEpiCurveWidgetData);
  const epiCurveWidgetData = useStore(epiDashboardStore, (state) => state.epiCurveWidgetData);
  const setFilterValue = useStore(epiDashboardStore, (state) => state.setFilterValue);
  const filterDimensions = useStore(epiDashboardStore, (state) => state.filterDimensions);
  const timeDims = useMemo(() => CaseTypeUtil.getDims(completeCaseType, [CaseDbDimType.TIME]), [completeCaseType]);
  const isShowMissingValuesInAreaChartEnabled = useStore(userProfileStore, (state) => state.epiDashboardEpiCurveSettings.isShowMissingValuesInAreaChartEnabled);
  const [focussedDate, setFocussedDate] = useState<string>(null);
  const [col, setCol] = useState<CaseDbCol>(null);
  const colLabel = col?.label ?? '';

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedDate(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return EpiLineListUtil.getCaseCount(sortedData);
  }, [sortedData]);


  // Auto-switch to bar chart if stratification is disabled while showing area chart
  useEffect(() => {
    if (!stratification && chartType === 'area') {
      setChartType('bar');
    }
  }, [stratification, chartType]);

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        active: chartType === 'bar',
        callback: () => {
          setChartType('bar');
        },
        label: t`Bar chart`,
        leftIcon: <LeaderboardIcon />,
      },
      {
        active: chartType === 'area',
        callback: () => {
          setChartType('area');
        },
        disabled: !stratification,
        label: t`Normalized stacked area chart`,
        leftIcon: <AreaChartIcon />,
      },
    ];
  }, [t, chartType, stratification]);

  const titleMenu = useMemo<MenuItemData>(() => {
    let label: string;
    if (col) {
      label = t('Epi curve: {{label}}', { label: col.label });
    } else {
      label = t`Epi curve`;
    }

    const menu: MenuItemData = {
      disabled: !timeDims.length,
      items: [],
      label,
      tooltip: col ? completeCaseType.ref_cols[col.ref_col_id].description : undefined,
    };

    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).filter(dim => {
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      return refDim.dim_type === CaseDbDimType.TIME;
    }).forEach((dim) => {
      if (menu.items.length) {
        menu.items.at(-1).divider = true;
      }
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach((c) => {
        menu.items.push({
          active: c.id === c?.id,
          callback: () => {
            updateEpiCurveWidgetData({ columnId: c.id });
            setCol(c);
          },
          label: c.label,
          tooltip: c.description,
        });
      });
    });

    return menu;
  }, [col, completeCaseType, t, timeDims.length, updateEpiCurveWidgetData]);

  useEffect(() => {
    if (col) {
      return;
    }
    if (!timeDims.length) {
      throw Error('Epi curve can not be shown');
    }
    if (epiCurveWidgetData.columnId) {
      setCol(CaseTypeUtil.getCols(completeCaseType).find(c => c.id === epiCurveWidgetData.columnId));
    } else if (sortedData.length) {
      setCol(EpiCurveUtil.getPreferredTimeColumn(
        completeCaseType,
        sortedData,
        CaseTypeUtil.getCols(completeCaseType, completeCaseType.case_date_dim_id),
      ));
    }
  }, [col, completeCaseType, epiCurveWidgetData.columnId, timeDims, sortedData]);

  const items = useMemo(() => {
    if (!col) {
      return [];
    }
    return EpiCurveUtil.getSortedItems(completeCaseType, sortedData, [col]);
  }, [col, sortedData, completeCaseType]);

  const epiCurveCaseCount = useMemo(() => {
    return items.reduce((prev, current) => {
      return prev + current.value;
    }, 0) ?? 0;
  }, [items]);

  const getXAxisLabel = useCallback((value: Date): string => {
    if (!col) {
      return null;
    }

    return EpiCurveUtil.getXAxisLabel(completeCaseType.ref_cols[col.ref_col_id].col_type, value);
  }, [col, completeCaseType.ref_cols]);

  const xAxisIntervals = useMemo<Date[]>(() => {
    if (!col) {
      return [];
    }
    return EpiCurveUtil.getXAxisIntervals(completeCaseType.ref_cols[col.ref_col_id].col_type, items);
  }, [col, completeCaseType.ref_cols, items]);

  // Select chart type for highlighting logic
  const currentChartType = chartType;

  const currentSeriesData = useMemo(() => {
    return currentChartType === 'area'
      ? EpiCurveUtil.getAreaChartSeriesData(items, xAxisIntervals, getXAxisLabel, isShowMissingValuesInAreaChartEnabled, stratification)
      : EpiCurveUtil.getBarChartSeriesData(items, xAxisIntervals, getXAxisLabel, stratification);
  }, [currentChartType, items, xAxisIntervals, getXAxisLabel, isShowMissingValuesInAreaChartEnabled, stratification]);

  const onChartCaseIdsChange = useCallback((caseIds: string[]) => {
    highlightingManager.highlight({
      caseIds,
      origin: EPI_ZONE.EPI_CURVE,
    });
  }, [highlightingManager]);

  const onChartPointMouseUp = useCallback((payload: { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent }) => {
    setFocussedDate(payload.focussedDate);
    setEpiContextMenuConfig({
      caseIds: payload.caseIds,
      mouseEvent: payload.mouseEvent,
      position: {
        left: payload.mouseEvent?.clientX,
        top: payload.mouseEvent?.clientY,
      },
    });
  }, []);

  const onChartReady = useCallback((chart: EChartsType) => {
    const dom = chart.getDom();
    dom?.setAttribute('aria-label', t('Epidemiological curve showing the number of cases over time ({{label}})', { label: colLabel }));
    dom?.setAttribute('role', 'img');
  }, [colLabel, t]);

  useEffect(() => {
    const unsubscribe = highlightingManager.subscribe((highlighting) => {
      const instance = chartRef.current?.getEchartsInstance();
      if (highlighting.origin === EPI_ZONE.EPI_CURVE || !instance) {
        return;
      }
      const highlightTargets: Array<{ dataIndex: number; seriesIndex: number }> = [];
      // Calculate series data for highlighting (matches chart rendering logic)
      const seriesData = currentSeriesData;
      if (seriesData.series) {
        (seriesData.series).forEach((serie, serieIndex) => {
          const serieData = (serie as { data: unknown[] }).data;
          serieData?.forEach((dataArray: unknown, dataIndex: number) => {
            const caseIds = JSON.parse((dataArray as [unknown, unknown, string])[2]) as string[];
            if (intersection(caseIds, highlighting.caseIds).length) {
              highlightTargets.push({
                dataIndex,
                seriesIndex: serieIndex,
              });
            }
          });
        });
      }
      if (!chartRef?.current) {
        return;
      }
      if (highlighting.caseIds.length) {
        // Reset previous emphasis state before applying new outbound highlights.
        instance.dispatchAction({
          type: 'downplay',
        });

        highlightTargets.forEach((target) => {
          instance.dispatchAction({
            dataIndex: target.dataIndex,
            seriesIndex: target.seriesIndex,
            type: 'highlight',
          });
        });
      } else {
        instance.dispatchAction({
          type: 'downplay',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chartRef, highlightingManager, currentSeriesData]);

  const onShowOnlySelectedDateMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (!isString(focussedDate) || !col?.id) {
      onMenuClose();
      return;
    }
    const dateDimension = filterDimensions.find(filterDimension => filterDimension.filterIds.includes(col.id));
    const dateColumnId = dateDimension.preferredFilterId;

    let fromDate: Date;
    let toDate: Date;

    if (focussedDate.match(/^\d{4}$/)) {
      const date = parse(focussedDate, DATE_FORMAT.YEAR, new Date());
      fromDate = startOfYear(date);
      toDate = endOfYear(date);
      // year
    } else if (focussedDate.match(/^\d{4}-\d{2}$/)) {
      // month
      const date = parse(focussedDate, DATE_FORMAT.YEAR_MONTH, new Date());
      fromDate = startOfMonth(date);
      toDate = lastDayOfMonth(date);
    } else if (focussedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // full date
      const date = parse(focussedDate, DATE_FORMAT.DATE, new Date());
      fromDate = date;
      toDate = date;
    } else if (focussedDate.match(/^\d{4}-W\d{2}$/)) {
      // week
      const date = parse(focussedDate, DATE_FORMAT.YEAR_WEEK, new Date(), {
        useAdditionalWeekYearTokens: true,
      });
      fromDate = startOfISOWeek(date);
      toDate = endOfISOWeek(date);
    } else if (focussedDate.match(/^\d{4}-Q\d$/)) {
      // quarter
      const date = parse(focussedDate, DATE_FORMAT.YEAR_QUARTER, new Date());
      fromDate = startOfQuarter(date);
      toDate = endOfQuarter(date);
    }

    if (fromDate && toDate) {
      await setFilterValue(dateColumnId, [fromDate, toDate]);
    }

    onMenuClose();
  }, [focussedDate, col, filterDimensions, setFilterValue]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!focussedDate) {
      return null;
    }
    return (
      <MenuItem
        divider
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={async () => await onShowOnlySelectedDateMenuItemClick(onMenuClose)}
      >
        <ListItemIcon>
          <FilterAltIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t('Filter (show only {{date}})', { date: focussedDate })}
        </ListItemText>
      </MenuItem>
    );
  }, [focussedDate, onShowOnlySelectedDateMenuItemClick, t]);

  const missingCasesCount = lineListCaseCount - epiCurveCaseCount;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;
  const shouldShowEpiCurve = epiCurveCaseCount > 0 && timeDims.length > 0;


  useEffect(() => {
    const emitDownloadOptions = () => {
      EpiEventBusManager.getInstance().emit('onDownloadOptionsChanged', {
        disabled: !shouldShowEpiCurve,
        items: [
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Epi curve`, chartRef.current.getEchartsInstance(), 'png', completeCaseType, t),
            label: t`Save as PNG`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Epi curve`, chartRef.current.getEchartsInstance(), 'jpeg', completeCaseType, t),
            label: t`Save as JPEG`,
          },
        ],
        zone: EPI_ZONE.EPI_CURVE,
        zoneLabel: t`Epi curve`,
      });
    };
    emitDownloadOptions();
    const eventBusManager = EpiEventBusManager.getInstance();
    eventBusManager.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    return () => {
      eventBusManager.emit('onDownloadOptionsChanged', {
        items: null,
        zone: EPI_ZONE.EPI_CURVE,
        zoneLabel: t`Epi curve`,
      });
      eventBusManager.removeEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    };
  }, [completeCaseType, shouldShowEpiCurve, t]);

  return (
    <EpiWidget
      expandDisabled={!shouldShowEpiCurve}
      isLoading={isDataLoading}
      primaryMenu={primaryMenu}
      title={titleMenu}
      warningMessage={shouldShowEpiCurve && epiCurveCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      zone={EPI_ZONE.EPI_CURVE}
    >
      {!shouldShowEpiCurve && (
        <EpiWidgetUnavailable
          epiZone={EPI_ZONE.EPI_CURVE}
          widgetName={t`epi curve`}
        />
      )}
      {shouldShowEpiCurve && (
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          {items?.length > 0 && chartType === 'bar' && (
            <EpiCurveBarChart
              chartRef={chartRef}
              echarts={echartsCore}
              getXAxisLabel={getXAxisLabel}
              items={items}
              onCaseIdsChange={onChartCaseIdsChange}
              onChartReady={onChartReady}
              onPointMouseUp={onChartPointMouseUp}
              stratification={stratification}
              xAxisIntervals={xAxisIntervals}
            />
          )}
          {items?.length > 0 && chartType === 'area' && (
            <EpiCurveStackedAreaChart
              chartRef={chartRef}
              echarts={echartsCore}
              getXAxisLabel={getXAxisLabel}
              items={items}
              onCaseIdsChange={onChartCaseIdsChange}
              onChartReady={onChartReady}
              onPointMouseUp={onChartPointMouseUp}
              showMissingValues={isShowMissingValuesInAreaChartEnabled}
              stratification={stratification}
              xAxisIntervals={xAxisIntervals}
            />
          )}
          <EpiContextMenu
            config={epiContextMenuConfig}
            getExtraItems={getEpiContextMenuExtraItems}
            onMenuClose={onEpiContextMenuClose}
          />
        </Box>
      )}
    </EpiWidget>
  );
};
