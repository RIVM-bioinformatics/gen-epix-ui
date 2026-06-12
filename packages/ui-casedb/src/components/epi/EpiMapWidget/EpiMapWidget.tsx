import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import {
  GeoComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import {
  dispose,
  getInstanceByDom,
  init,
  use as registerECharts,
  registerMap,
} from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { ReactElement } from 'react';
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
import { useTranslation } from 'react-i18next';
import intersection from 'lodash/intersection';
import round from 'lodash/round';
import { useStore } from 'zustand';
import type {
  CaseDbCol,
  CaseDbRegion,
  CaseDbRegionSetShape,
  CaseDbTypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import {
  CaseDbDimType,
  CaseDbGeoApi,
} from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import {
  QueryClientManager,
  useDimensions,
  useQueryMemo,
} from '@gen-epix/ui';

import { EpiDataManager } from '../../../classes/managers/EpiDataManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { EPI_ZONE } from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { EpiDashboardUtil } from '../../../utils/EpiDashboardUtil';
import { EpiMapUtil } from '../../../utils/EpiMapUtil';
import type { GenEpixPieSeriesOptionEventData } from '../../../utils/EpiMapUtil';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidget } from '../EpiWidget';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import { StratificationUtil } from '../../../utils/StratificationUtil';

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

registerECharts([GeoComponent, TooltipComponent, LegendComponent, CanvasRenderer, PieChart]);

type GenEpixEchartsEvent = {
  data: GenEpixPieSeriesOptionEventData;
  event: {
    event: MouseEvent;
  };
};

type GeoJSON = { features: unknown[] };

export const EpiMapWidget = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [col, setCol] = useState<CaseDbCol>(null);
  const colLabel = col?.label ?? '';
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsReact>(null);
  const { dimensions: { height, width } } = useDimensions(containerRef);
  const highlightingManager = useMemo(() => EpiHighlightingManager.getInstance(), []);

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const isDataLoading = useStore(epiDashboardStore, (state) => state.isDataLoading);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const updateEpiMapWidgetData = useStore(epiDashboardStore, (state) => state.updateEpiMapWidgetData);
  const epiMapWidgetData = useStore(epiDashboardStore, (state) => state.epiMapWidgetData);
  const setFilterValue = useStore(epiDashboardStore, (state) => state.setFilterValue);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);

  const [focussedRegion, setFocussedRegion] = useState<CaseDbRegion>();
  const geoDims = useMemo(() => CaseTypeUtil.getDims(completeCaseType, [CaseDbDimType.GEO]), [completeCaseType]);
  const regionSetShapesFilter = useMemo<CaseDbTypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'region_set_id',
      members: CaseTypeUtil.getRegionSetIds(completeCaseType),
      type: 'UUID_SET',
    };
  }, [completeCaseType]);

  const { data: regionSetShapes, error: regionSetShapesError, isLoading: isRegionSetShapesLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      return (await CaseDbGeoApi.getInstance().regionSetShapesPostQuery(regionSetShapesFilter, { signal })).data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.REGION_SET_SHAPES, regionSetShapesFilter),
    retry: false,
    select: (shapes) => Object.fromEntries(shapes.map(regionSetShape => [regionSetShape.region_set_id, regionSetShape])),
  });

  useEffect(() => {
    if (col) {
      return;
    }
    if (!geoDims.length) {
      throw Error('Epi map can not be shown');
    }
    let preferredCol: CaseDbCol;
    if (epiMapWidgetData.columnId) {
      preferredCol = CaseTypeUtil.getCols(completeCaseType).find(c => c.id === epiMapWidgetData.columnId);
    } else {
      preferredCol = CaseTypeUtil.getPreferredGEOCol(CaseTypeUtil.getCols(completeCaseType, geoDims[0].id));
    }
    setCol(preferredCol);
  }, [col, completeCaseType, epiMapWidgetData.columnId, geoDims]);

  const regions = useMemo(() => {
    if (!col) {
      return [];
    }
    const regionSetId = completeCaseType.ref_cols[col.ref_col_id].region_set_id;
    return EpiDataManager.getInstance().data.regionsByRegionSetId[regionSetId];
  }, [col, completeCaseType.ref_cols]);

  const lineListCaseCount = useMemo(() => {
    return EpiDashboardUtil.getCaseCount(sortedData);
  }, [sortedData]);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setFocussedRegion(null);
  }, []);

  const isLoading = isRegionSetShapesLoading || isDataLoading;
  const error = regionSetShapesError;

  const regionSetShape = useMemo<CaseDbRegionSetShape>(() => {
    if (!col || !regionSetShapes) {
      return null;
    }
    const regionSetId = completeCaseType.ref_cols[col.ref_col_id].region_set_id;
    return regionSetShapes[regionSetId];
  }, [col, completeCaseType.ref_cols, regionSetShapes]);

  const numZones = useMemo(() => {
    if (!regionSetShape) {
      return 0;
    }
    try {
      return (JSON.parse(regionSetShape.geo_json) as GeoJSON).features.length;
    } catch {
      return 0;
    }
  }, [regionSetShape]);

  const maxPieChartArea = useMemo(() => EpiMapUtil.getMaxPieChartArea(width, height, numZones), [height, numZones, width]);

  const lineListRegionStatistics = useMemo(() => EpiMapUtil.getRegionStatistics(sortedData, col?.id, regions), [col, sortedData, regions]);
  const getPieChartRadius = useCallback((numCases: number): number => {
    return EpiMapUtil.getPieChartRadius(numCases, maxPieChartArea, lineListRegionStatistics);
  }, [lineListRegionStatistics, maxPieChartArea]);

  const { epiMapCaseCount, series } = useMemo(
    () => EpiMapUtil.getMapSeries(col, regions, sortedData, stratification, getPieChartRadius),
    [col, getPieChartRadius, sortedData, regions, stratification],
  );

  const getOptions = useCallback(() => {
    if (!regionSetShape) {
      return;
    }

    registerMap(regionSetShape.id, regionSetShape.geo_json);
    const aspectScale = EpiMapUtil.getGeoJsonAspectScale(regionSetShape.geo_json);

    return {
      color: StratificationUtil.getEchartsColors(stratification, theme),
      geo: {
        aspectScale,
        emphasis: {
          disabled: true,
        },
        itemStyle: {
          areaColor: '#e7e8ea',
        },
        label: {
          show: false,
          silent: true,
        },
        map: regionSetShape.id,
        roam: true,
        scaleLimit: {
          max: 5,
          min: 1,
        },
        silent: true,
        zoom: 1,
      },
      legend: {
        show: false,
      },
      series: series as unknown,
      tooltip: {},
    } satisfies EChartsOption;
  }, [regionSetShape, series, stratification, theme]);

  const onChartReady = useCallback((chart: EChartsType) => {
    const dom = chart.getDom();
    dom?.setAttribute('aria-label', t('Figure of a map showing the geographical distribution of cases per region ({{label}})', { label: colLabel }));
    dom?.setAttribute('role', 'img');
  }, [colLabel, t]);

  const onEvents = useMemo<EChartsReactProps['onEvents']>(() => {
    return {
      mouseout: () => {
        highlightingManager.highlight({
          caseIds: [],
          origin: EPI_ZONE.MAP,
        });
      },
      mouseover: (event: unknown) => {
        try {
          highlightingManager.highlight({
            caseIds: (event as GenEpixEchartsEvent).data.genEpixData.caseIds,
            origin: EPI_ZONE.MAP,
          });
        } catch (_error) {
          // ignore
        }
      },
      mouseup: (event: unknown) => {
        const mouseEvent = (event as GenEpixEchartsEvent)?.event?.event;
        const eventCaseIds = (event as GenEpixEchartsEvent).data.genEpixData.caseIds;
        const region = regions.find(r => r.id === (event as GenEpixEchartsEvent).data.genEpixData.regionId);
        setEpiContextMenuConfig({
          caseIds: eventCaseIds,
          mouseEvent,
          position: {
            left: (event as { event: { event: MouseEvent } }).event.event.clientX,
            top: (event as { event: { event: MouseEvent } }).event.event.clientY,
          },
        });
        setFocussedRegion(region);
      },
    };
  }, [highlightingManager, regions]);

  useEffect(() => {
    const unsubscribe = highlightingManager.subscribe((highlighting) => {
      const foundSerieIndexes: number[] = [];
      const foundDataIndexes: number[] = [];
      series.forEach((serie, serieIndex) => {
        serie.data.forEach((dataArray, dataIndex) => {
          const caseIds = (dataArray as GenEpixPieSeriesOptionEventData).genEpixData.caseIds;
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
        chartRef.current.getEchartsInstance()?.dispatchAction({
          dataIndex: foundDataIndexes,
          seriesIndex: foundSerieIndexes,
          type: 'highlight',
        });
      } else {
        chartRef.current.getEchartsInstance()?.dispatchAction({
          type: 'downplay',
        });
      }
    });

    // use highlighting imperatively
    return () => {
      unsubscribe();
    };
  }, [chartRef, highlightingManager, series]);

  const titleMenu = useMemo<MenuItemData>(() => {
    const menu: MenuItemData = {
      disabled: !geoDims?.length,
      items: [],
      label: col?.label ? t('Map: {{label}}', { label: col.label }) : t`Map`,
      tooltip: col ? completeCaseType.ref_cols[col.ref_col_id].description : undefined,
    };

    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).filter(dim => {
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      return refDim.dim_type === CaseDbDimType.GEO;
    }).forEach((dim) => {
      if (menu.items.length) {
        menu.items.at(-1).divider = true;
      }
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach((c) => {
        menu.items.push({
          active: c.id === c?.id,
          callback: () => {
            updateEpiMapWidgetData({ columnId: c.id });
            setCol(c);
          },
          label: c.label,
          tooltip: c.description,
        });
      });
    });

    return menu;
  }, [col, completeCaseType, geoDims.length, t, updateEpiMapWidgetData]);

  const missingCasesCount = epiMapCaseCount !== undefined ? lineListCaseCount - epiMapCaseCount : 0;
  const missingCasesPercentage = missingCasesCount > 0 ? round(missingCasesCount / lineListCaseCount * 100, 1) : 0;
  const shouldShowLoading = isLoading && !error;
  const shouldShowMap = !!col && (regionSetShape?.geo_json && regionSetShape?.geo_json !== 'null') && series.length > 0;

  const onShowOnlySelectedRegionMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    await setFilterValue(col.id, [focussedRegion.id]);
    onMenuClose();
  }, [col, focussedRegion, setFilterValue]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!col || !focussedRegion?.name) {
      return null;
    }
    return (
      <MenuItem
        divider
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={async () => await onShowOnlySelectedRegionMenuItemClick(onMenuClose)}
      >
        <ListItemIcon>
          <FilterAltIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t('Filter (show only {{regionName}})', { regionName: focussedRegion?.name ?? '-' })}
        </ListItemText>
      </MenuItem>
    );
  }, [col, focussedRegion, onShowOnlySelectedRegionMenuItemClick, t]);

  useEffect(() => {
    const emitDownloadOptions = () => {
      EpiEventBusManager.getInstance().emit('onDownloadOptionsChanged', {
        disabled: !shouldShowMap,
        items: [
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Incidence map`, chartRef.current.getEchartsInstance(), 'png', completeCaseType, t),
            label: t`Save as PNG`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadEchartsImage(t`Incidence map`, chartRef.current.getEchartsInstance(), 'jpeg', completeCaseType, t),
            label: t`Save as JPEG`,
          },
        ],
        zone: EPI_ZONE.MAP,
        zoneLabel: t`Map`,
      });
    };


    emitDownloadOptions();
    const epiEventBusManager = EpiEventBusManager.getInstance();
    epiEventBusManager.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    return () => {
      EpiEventBusManager.getInstance().emit('onDownloadOptionsChanged', {
        items: null,
        zone: EPI_ZONE.MAP,
        zoneLabel: t`Map`,
      });
      epiEventBusManager.removeEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    };
  }, [completeCaseType, shouldShowMap, t]);

  return (
    <EpiWidget
      expandDisabled={!shouldShowMap}
      isLoading={shouldShowLoading}
      title={titleMenu}
      warningMessage={shouldShowMap && epiMapCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      zone={EPI_ZONE.MAP}
    >
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          position: 'relative',
        }}
      >
        {!shouldShowLoading && !shouldShowMap && (
          <Box sx={{ position: 'absolute' }}>
            <EpiWidgetUnavailable
              epiZone={EPI_ZONE.MAP}
              widgetName={t`map`}
            />
          </Box>
        )}
        {shouldShowMap && (
          <EChartsReact
            echarts={echartsCore}
            notMerge
            onChartReady={onChartReady}
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
    </EpiWidget>
  );
};
