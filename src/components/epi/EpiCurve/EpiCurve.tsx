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
  useCallback,
  useContext,
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

import type { CaseTypeCol } from '../../../api';
import { DimType } from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { HighlightingManager } from '../../../classes/managers/HighlightingManager';
import { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiStoreContext } from '../../../stores/epiStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidget } from '../EpiWidget';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { DATE_FORMAT } from '../../../data/date';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { DownloadUtil } from '../../../utils/DownloadUtil';
import { EpiLineListUtil } from '../../../utils/EpiLineListUtil';

echarts.use([TooltipComponent, GridComponent, DataZoomComponent, BarChart, CanvasRenderer]);

type LspEchartsEvent = {
  data: [unknown, unknown, string];
  event: {
    event: MouseEvent;
  };
};

export const EpiCurve = () => {
  const [t] = useTranslation();
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);
  const chartRef = useRef<EChartsReact>(null);

  const epiStore = useContext(EpiStoreContext);
  const stratification = useStore(epiStore, (state) => state.stratification);
  const isDataLoading = useStore(epiStore, (state) => state.isDataLoading);
  const sortedData = useStore(epiStore, (state) => state.sortedData);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);
  const updateEpiCurveWidgetData = useStore(epiStore, (state) => state.updateEpiCurveWidgetData);
  const epiCurveWidgetData = useStore(epiStore, (state) => state.epiCurveWidgetData);
  const setFilterValue = useStore(epiStore, (state) => state.setFilterValue);
  const filterDimensions = useStore(epiStore, (state) => state.filterDimensions);
  const timeCaseTypeDims = useMemo(() => CaseTypeUtil.getCaseTypeDims(completeCaseType, [DimType.TIME]), [completeCaseType]);
  const [focussedDate, setFocussedDate] = useState<string>(null);
  const [column, setColumn] = useState<CaseTypeCol>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedDate(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return EpiLineListUtil.getCaseCount(sortedData);
  }, [sortedData]);

  const titleMenu = useMemo<MenuItemData>(() => {
    let label: string;
    if (column) {
      label = t('Epi curve: {{label}}', { label: column.label });
    } else {
      label = t`Epi curve`;
    }

    const menu: MenuItemData = {
      label,
      tooltip: column ? completeCaseType.cols[column.col_id].description : undefined,
      disabled: !timeCaseTypeDims.length,
      items: [],
    };

    completeCaseType.ordered_case_type_dim_ids.map(x => completeCaseType.case_type_dims[x]).filter(caseTypeDim => {
      const dim = completeCaseType.dims[caseTypeDim.dim_id];
      return dim.dim_type === DimType.TIME;
    }).forEach((caseTypeDim) => {
      if (menu.items.length) {
        menu.items.at(-1).divider = true;
      }
      completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDim.id].map(id => completeCaseType.case_type_cols[id]).forEach((caseTypeCol) => {
        menu.items.push({
          label: caseTypeCol.label,
          tooltip: caseTypeCol.description,
          active: caseTypeCol.id === column?.id,
          callback: () => {
            updateEpiCurveWidgetData({ columnId: caseTypeCol.id });
            setColumn(caseTypeCol);
          },
        });
      });
    });

    return menu;
  }, [column, completeCaseType, t, timeCaseTypeDims.length, updateEpiCurveWidgetData]);

  useEffect(() => {
    if (column) {
      return;
    }
    if (!timeCaseTypeDims.length) {
      throw Error('Epi curve can not be shown');
    }
    if (epiCurveWidgetData.columnId) {
      setColumn(CaseTypeUtil.getCaseTypeCols(completeCaseType).find(c => c.id === epiCurveWidgetData.columnId));
    } else if (sortedData.length) {
      setColumn(EpiCurveUtil.getPreferredTimeColumn(
        completeCaseType,
        sortedData,
        CaseTypeUtil.getCaseTypeCols(completeCaseType, completeCaseType.case_date_case_type_dim_id),
      ));
    }
  }, [column, completeCaseType, epiCurveWidgetData.columnId, timeCaseTypeDims, sortedData]);

  const items = useMemo(() => {
    if (!column) {
      return [];
    }
    return EpiCurveUtil.getSortedItems(completeCaseType, sortedData, [column]);
  }, [column, sortedData, completeCaseType]);

  const epiCurveCaseCount = useMemo(() => {
    return items.reduce((prev, current) => {
      return prev + current.value;
    }, 0) ?? 0;
  }, [items]);

  const getXAxisLabel = useCallback((value: Date): string => {
    if (!column) {
      return null;
    }

    return EpiCurveUtil.getXAxisLabel(completeCaseType.cols[column.col_id].col_type, value);
  }, [column, completeCaseType.cols]);

  const xAxisIntervals = useMemo<Date[]>(() => {
    if (!column) {
      return [];
    }
    return EpiCurveUtil.getXAxisIntervals(completeCaseType.cols[column.col_id].col_type, items);
  }, [column, completeCaseType.cols, items]);

  const serieData = useMemo<{ series: BarSeriesOption[]; max: number }>(() => {
    if (!items) {
      return {
        series: null,
        max: null,
      };
    }

    let max = 0;
    const barSerieOptionsBase: BarSeriesOption = {
      type: 'bar',
      emphasis: {
        focus: 'self',
      },
      stack: 'total',
    };
    const barSeries: BarSeriesOption[] = [];
    if (!stratification) {
      barSeries.push({
        ...barSerieOptionsBase,
        color: ConfigManager.instance.config.epi.STRATIFICATION_COLORS[0],
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
      series: barSeries,
      max,
    };
  }, [stratification, xAxisIntervals, items, getXAxisLabel]);

  const events = useMemo<EChartsReactProps['onEvents']>(() => {
    return {
      finished: !hasRenderedOnce ? () => {
        const dom = chartRef?.current?.getEchartsInstance()?.getDom();
        dom?.setAttribute('aria-label', t('Epidemiological curve showing the number of cases over time ({{label}})', { label: column?.label ?? '' }));
        dom?.setAttribute('role', 'img');
        setHasRenderedOnce(true);
      } : undefined,
      mouseover: (event: unknown) => {
        highlightingManager.highlight({
          caseIds: JSON.parse((event as LspEchartsEvent).data[2]) as string[],
          origin: EPI_ZONE.EPI_CURVE,
        });
      },
      mouseout: () => {
        highlightingManager.highlight({
          caseIds: [],
          origin: EPI_ZONE.EPI_CURVE,
        });
      },
      mouseup: (event: unknown) => {
        setFocussedDate((event as { name: string }).name);
        const mouseEvent = (event as { event: { event: MouseEvent } })?.event?.event;
        const caseIds = JSON.parse((event as LspEchartsEvent).data[2]) as string[];
        setEpiContextMenuConfig({
          caseIds,
          position: {
            left: (event as { event: { event: MouseEvent } }).event.event.clientX,
            top: (event as { event: { event: MouseEvent } }).event.event.clientY,
          },
          mouseEvent,
        });
      },

    };
  }, [column?.label, hasRenderedOnce, highlightingManager, t]);

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
          type: 'highlight',
          seriesIndex: foundSerieIndexes,
          dataIndex: foundDataIndexes,
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
      grid: {
        bottom: 64,
        left: 48,
        right: 8,
        top: 16,
      },
      tooltip: {
        show: true,
        triggerOn: 'mousemove',
        trigger: 'item',
        formatter: (params) => {
          const typedParams = params as { name: string; value: number[]; seriesName: string };

          if (stratification) {
            return `${typedParams.name} - ${typedParams.seriesName} (n=${typedParams.value[1]})`;
          }
          return `${typedParams.name} (n=${typedParams.value[1]})`;
        },
      },
      xAxis: {
        type: 'category',
        data: xAxisIntervals.map(x => getXAxisLabel(x)),
        axisTick: {
          show: true,
          alignWithLabel: true,
        },
        axisLabel: {
          rotate: 45,
          height: 100,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        min: 0,
        max: serieData.max,
      },
      series: serieData.series,
      color: ConfigManager.instance.config.epi.STRATIFICATION_COLORS,
    } satisfies EChartsOption;
  }, [serieData, xAxisIntervals, getXAxisLabel, stratification]);

  const onShowOnlySelectedDateMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (!isString(focussedDate) || !column?.id) {
      onMenuClose();
      return;
    }
    const dateDimension = filterDimensions.find(filterDimension => filterDimension.filterIds.includes(column.id));
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
  }, [focussedDate, column?.id, filterDimensions, setFilterValue]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!focussedDate) {
      return null;
    }
    return (
      <MenuItem
        divider
        // eslint-disable-next-line react/jsx-no-bind
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
  const shouldShowEpiCurve = epiCurveCaseCount > 0 && timeCaseTypeDims.length > 0;


  useEffect(() => {
    const emitDownloadOptions = () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.EPI_CURVE,
        disabled: !shouldShowEpiCurve,
        zoneLabel: t`Epi curve`,
        items: [
          {
            label: t`Save as PNG`,
            callback: () => DownloadUtil.downloadEchartsImage(t`Epi curve`, chartRef.current.getEchartsInstance(), 'png', completeCaseType, t),
          },
          {
            label: t`Save as JPEG`,
            callback: () => DownloadUtil.downloadEchartsImage(t`Epi curve`, chartRef.current.getEchartsInstance(), 'jpeg', completeCaseType, t),
          },
        ],
      });
    };
    emitDownloadOptions();
    const remove = EpiEventBusManager.instance.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);

    return () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.EPI_CURVE,
        zoneLabel: t`Epi curve`,
        items: null,
      });
      remove();
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
              ref={chartRef}
              notMerge
              echarts={echarts}
              option={getOptions()}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
              }}
              onEvents={events}
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
