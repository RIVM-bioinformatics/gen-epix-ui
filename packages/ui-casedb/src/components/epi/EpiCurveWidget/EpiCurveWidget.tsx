import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import * as echarts from 'echarts/core';
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
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
import sum from 'lodash/sum';
import type {
  BarSeriesOption,
  EChartsOption,
} from 'echarts';
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
import {
  ConfigManager,
  DATE_FORMAT,
} from '@gen-epix/ui';

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
import type { CaseDbConfig } from '../../../models/config';

echarts.use([TooltipComponent, GridComponent, DataZoomComponent, BarChart, CanvasRenderer]);

type GenEpixEchartsEvent = {
  data: [unknown, unknown, string];
  event: {
    event: MouseEvent;
  };
};

export const EpiCurveWidget = () => {
  const { t } = useTranslation();
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
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
  const [focussedDate, setFocussedDate] = useState<string>(null);
  const [col, setCol] = useState<CaseDbCol>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedDate(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return EpiLineListUtil.getCaseCount(sortedData);
  }, [sortedData]);

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

  const serieData = useMemo<{ max: number; series: BarSeriesOption[] }>(() => {
    if (!items) {
      return {
        max: null,
        series: null,
      };
    }

    let max = 0;
    const barSerieOptionsBase: BarSeriesOption = {
      emphasis: {
        focus: 'self',
      },
      stack: 'total',
      type: 'bar',
    };
    const barSeries: BarSeriesOption[] = [];
    if (!stratification) {
      barSeries.push({
        ...barSerieOptionsBase,
        color: ConfigManager.getInstance<CaseDbConfig>().config.epi.STRATIFICATION_COLORS[0],
        data: [],
        name: '',
      });
    } else {
      stratification.legendaItems.forEach(legendaItem => {
        barSeries.push({
          ...barSerieOptionsBase,
          color: legendaItem.color,
          data: [],
          name: legendaItem.rowValue.full,
        });
      });
    }

    xAxisIntervals.forEach((interval, intervalIndex) => {
      const itemsWithinInterval = EpiCurveUtil.getItemsWithinInterval(items, xAxisIntervals, intervalIndex);
      const xAxisLabel = getXAxisLabel(interval);
      const intervalTotal = sum(itemsWithinInterval.map(item => item.value));

      if (intervalTotal > max) {
        max = intervalTotal;
      }

      if (!stratification) {
        barSeries[0].data.push([
          xAxisLabel,
          intervalTotal,
          JSON.stringify(itemsWithinInterval.map(item => item.row.id)),
        ]);
      } else {
        barSeries.forEach(barSerie => {
          const filteredItems = itemsWithinInterval.filter(item => stratification.caseIdColors[item.row.id] === barSerie.color);
          barSerie.data.push([
            xAxisLabel,
            sum(itemsWithinInterval.filter(item => stratification.caseIdColors[item.row.id] === barSerie.color).map(item => item.value)),
            JSON.stringify(filteredItems.map(item => item.row.id)),
          ]);
        });
      }
    });

    return {
      max,
      series: barSeries,
    };
  }, [stratification, xAxisIntervals, items, getXAxisLabel]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {
    return {
      finished: !hasRenderedOnce ? () => {
        const dom = chartRef?.current?.getEchartsInstance()?.getDom();
        dom?.setAttribute('aria-label', t('Epidemiological curve showing the number of cases over time ({{label}})', { label: col?.label ?? '' }));
        dom?.setAttribute('role', 'img');
        setHasRenderedOnce(true);
      } : undefined,
      mouseout: () => {
        highlightingManager.highlight({
          caseIds: [],
          origin: EPI_ZONE.EPI_CURVE,
        });
      },
      mouseover: (event: unknown) => {
        highlightingManager.highlight({
          caseIds: JSON.parse((event as GenEpixEchartsEvent).data[2]) as string[],
          origin: EPI_ZONE.EPI_CURVE,
        });
      },
      mouseup: (event: unknown) => {
        setFocussedDate((event as { name: string }).name);
        const mouseEvent = (event as { event: { event: MouseEvent } })?.event?.event;
        const caseIds = JSON.parse((event as GenEpixEchartsEvent).data[2]) as string[];
        setEpiContextMenuConfig({
          caseIds,
          mouseEvent,
          position: {
            left: (event as { event: { event: MouseEvent } }).event.event.clientX,
            top: (event as { event: { event: MouseEvent } }).event.event.clientY,
          },
        });
      },

    };
  }, [col?.label, hasRenderedOnce, highlightingManager, t]);

  useEffect(() => {
    const unsubscribe = highlightingManager.subscribe((highlighting) => {
      const instance = chartRef.current?.getEchartsInstance();
      if (highlighting.origin === EPI_ZONE.EPI_CURVE || !instance) {
        return;
      }
      const foundSerieIndexes: number[] = [];
      const foundDataIndexes: number[] = [];
      serieData.series.forEach((serie, serieIndex) => {
        serie.data.forEach((dataArray, dataIndex) => {
          const caseIds = JSON.parse((dataArray as [unknown, unknown, string])[2]) as string[];
          if (intersection(caseIds, highlighting.caseIds).length) {
            if (!foundSerieIndexes.includes(serieIndex)) {
              foundSerieIndexes.push(serieIndex);
            }
            foundDataIndexes.push(dataIndex);
          }
        });
      });
      if (!chartRef?.current) {
        return;
      }
      if (highlighting.caseIds.length) {
        instance.dispatchAction({
          dataIndex: foundDataIndexes,
          seriesIndex: foundSerieIndexes,
          type: 'highlight',
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
  }, [chartRef, highlightingManager, serieData.series]);

  const getOptions = useCallback(() => {
    return {
      color: ConfigManager.getInstance<CaseDbConfig>().config.epi.STRATIFICATION_COLORS,
      grid: {
        bottom: 64,
        left: 48,
        right: 8,
        top: 16,
      },
      series: serieData.series,
      tooltip: {
        formatter: (params) => {
          const typedParams = params as { name: string; seriesName: string; value: number[] };

          if (stratification) {
            return `${typedParams.name} - ${typedParams.seriesName} (n=${typedParams.value[1]})`;
          }
          return `${typedParams.name} (n=${typedParams.value[1]})`;
        },
        show: true,
        trigger: 'item',
        triggerOn: 'mousemove',
      },
      xAxis: {
        axisLabel: {
          height: 100,
          rotate: 45,
        },
        axisTick: {
          alignWithLabel: true,
          show: true,
        },
        data: xAxisIntervals.map(x => getXAxisLabel(x)),
        type: 'category',
      },
      yAxis: {
        max: serieData.max,
        min: 0,
        minInterval: 1,
        type: 'value',
      },
    } satisfies EChartsOption;
  }, [serieData, xAxisIntervals, getXAxisLabel, stratification]);

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
  }, [focussedDate, col?.id, filterDimensions, setFilterValue]);

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
          {items?.length > 0 && (
            <EChartsReact
              echarts={echarts}
              notMerge
              onEvents={onEvents}
              option={getOptions()}
              ref={chartRef}
              style={{
                height: '100%',
                position: 'absolute',
                width: '100%',
              }}
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
