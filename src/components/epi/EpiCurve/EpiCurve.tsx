import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
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
import { EChartsUtil } from '../../../utils/EChartsUtil';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { EpiCurveUtil } from '../../../utils/EpiCurveUtil';
import { EpiListUtil } from '../../../utils/EpiListUtil';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidget } from '../EpiWidget';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';

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
  const timeDimensions = useMemo(() => EpiCaseTypeUtil.getDimensions(completeCaseType, [DimType.TIME]), [completeCaseType]);
  const [focussedDate, setFocussedDate] = useState<string>(null);
  const [column, setColumn] = useState<CaseTypeCol>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedDate(null);
  }, []);

  const lineListCaseCount = useMemo(() => {
    return EpiListUtil.getCaseCount(sortedData);
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
      disabled: !timeDimensions.length,
      items: [],
    };

    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dimension, dimensionCaseTypeColumns, dimIndex) => {
      EpiCaseTypeUtil.iterateCaseTypeColumns(completeCaseType, dimensionCaseTypeColumns, (caseTypeColumn, col, colIndex) => {
        menu.items.push({
          label: caseTypeColumn.label,
          tooltip: col.description,
          active: caseTypeColumn.id === column?.id,
          divider: dimIndex < timeDimensions.length - 1 && colIndex === dimensionCaseTypeColumns.length - 1,
          callback: () => {
            updateEpiCurveWidgetData({ columnId: caseTypeColumn.id });
            setColumn(caseTypeColumn);
          },
        });
      });
    }, DimType.TIME);
    return menu;
  }, [column, completeCaseType, t, timeDimensions.length, updateEpiCurveWidgetData]);

  useEffect(() => {
    if (column) {
      return;
    }
    if (!timeDimensions.length) {
      throw Error('Epi curve can not be shown');
    }
    if (epiCurveWidgetData.columnId) {
      setColumn(EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).find(c => c.id === epiCurveWidgetData.columnId));
    } else if (sortedData.length) {
      setColumn(EpiCurveUtil.getPreferredTimeColumn(
        completeCaseType,
        sortedData,
        EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType, timeDimensions[0].id),
      ));
    }
  }, [column, completeCaseType, epiCurveWidgetData.columnId, timeDimensions, sortedData]);

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
        dom?.setAttribute('aria-label', t`Figure of an epi curve`);
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
  }, [chartRef, hasRenderedOnce, highlightingManager, t]);

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
      aria: {
        enabled: true,
      },
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

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    const menus: MenuItemData[] = [];
    menus.push(
      {
        label: t`Download`,
        disabled: !column,
        items: [
          {
            label: t`Save as PNG`,
            leftIcon: <DownloadIcon />,
            callback: () => EChartsUtil.downloadImage(chartRef.current.getEchartsInstance(), 'png', t`Epi curve`),
          },
          {
            label: t`Save as JPEG`,
            leftIcon: <DownloadIcon />,
            callback: () => EChartsUtil.downloadImage(chartRef.current.getEchartsInstance(), 'jpeg', t`Epi curve`),
          },
        ],
      },
    );

    return menus;
  }, [chartRef, column, t]);

  const onShowOnlySelectedDateMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (!isString(focussedDate) || !column?.id) {
      onMenuClose();
      return;
    }
    const dateDimension = filterDimensions.find(dimension => dimension.filterIds.includes(column.id));
    const dateColumnId = dateDimension.preferredFilterId;

    let fromDate: Date;
    let toDate: Date;

    if (focussedDate.match(/^\d{4}$/)) {
      const date = parse(focussedDate, 'yyyy', new Date());
      fromDate = startOfYear(date);
      toDate = endOfYear(date);
      // year
    } else if (focussedDate.match(/^\d{4}-\d{2}$/)) {
      // month
      const date = parse(focussedDate, 'yyyy-MM', new Date());
      fromDate = startOfMonth(date);
      toDate = lastDayOfMonth(date);
    } else if (focussedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // full date
      const date = parse(focussedDate, 'yyyy-MM-dd', new Date());
      fromDate = date;
      toDate = date;
    } else if (focussedDate.match(/^\d{4}-W\d{2}$/)) {
      // week
      const date = parse(focussedDate, 'YYYY-\'W\'ww', new Date(), {
        useAdditionalWeekYearTokens: true,
      });
      fromDate = startOfISOWeek(date);
      toDate = endOfISOWeek(date);
    } else if (focussedDate.match(/^\d{4}-Q\d$/)) {
      // quarter
      const date = parse(focussedDate, 'yyyy-QQQ', new Date());
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
  const shouldShowEpiCurve = epiCurveCaseCount > 0 && timeDimensions.length > 0;

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
          {items?.length > 0 && (
            <EChartsReact
              echarts={echarts}
              notMerge
              onEvents={events}
              option={getOptions()}
              ref={chartRef}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
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
