import {
  Box,
  Link,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useDebouncedCallback } from 'use-debounce';
import type { ListRange } from 'react-virtuoso';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  GetTableCellRowComparatorProps,
  TableColumn,
  TableColumnText,
  TableRef,
  TableRowAndColumnParams,
  TableRowParams,
} from '@gen-epix/ui';
import {
  ConfigService,
  StringUtil,
  Subject,
  Table,
  TABLE_COLUMN_FROZEN,
  TableUtil,
} from '@gen-epix/ui';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import { LegendaItem } from '../LegendaItem';
import { EventBusService } from '../../../classes/services/EventBusService';
import { LineListCaseSetMembersService } from '../../../classes/services/LineListService/LineListCaseSetMembersService';
import type { LineListWidgetData } from '../../../models/dashboard';
import type {
  Stratification,
  StratificationLegendaItem,
} from '../../../models/stratification';
import { STRATIFICATION_MODE } from '../../../models/stratification';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CaseUtil } from '../../../utils/CaseUtil';
import type { CaseDbConfig } from '../../../models/config';
import { CaseDbTableUtil } from '../../../utils/CaseDbTableUtil';
import { CASE_INFO_DIALOG_TAB_NAME } from '../CaseInfoDialog';
import { StratificationUtil } from '../../../utils/StratificationUtil';
import { DashboardWidget } from '../Dashboard';
import { DASHBOARD_COMPONENT_NAME } from '../../../data/dashboard';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import { LineListIsOwnCaseService } from '../../../classes/services/LineListService/LineListIsOwnCaseService';

import { LineListWidgetIsInEventCell } from './LineListWidgetIsInEventCell';
import { LineListWidgetIsOwnCaseCell } from './LineListWidgetIsOwnCaseCell';
import { LineListWidgetTitle } from './LineListWidgetTitle';
import { LineListWidgetPrimaryMenu } from './LineListWidgetPrimaryMenu';
import { LineListWidgetSecondaryMenu } from './LineListWidgetSecondaryMenu';
import { useEpiLineListWidgetEmitDownloadOptions } from './useEpiLineListWidgetEmitDownloadOptions';

export const LineListWidget = () => {
  const { caseSet } = use(DashboardContext);
  const dashboardContext = use(DashboardContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const rowHighlightingSubject = useMemo(() => new Subject<string[]>([]), []);
  const tableRef = useRef<TableRef>(null);

  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const isCondensed = useStore(dashboardStore, (state) => state.isCondensed);
  const stratification = useStore(dashboardStore, (state) => state.stratification?.mode === STRATIFICATION_MODE.FIELD ? state.stratification : null);
  const updateWidgetData = useStore(dashboardStore, (state) => state.updateWidgetData);
  const treeAddresses = useStore(dashboardStore, (state) => state.treeAddresses);
  const setTableColumns = useStore(dashboardStore, (state) => state.setColumns);
  const isDataLoading = useStore(dashboardStore, (state) => state.isDataLoading);

  useEffect(() => {
    return () => {
      dashboardContext.lineListRangeSubject.next(undefined);
    };
  }, [dashboardContext]);

  const openCaseInfoDialog = useCallback((caseId: string, tabName: CASE_INFO_DIALOG_TAB_NAME) => {
    EventBusService.getInstance().emit('openCaseInfoDialog', {
      caseId,
      caseTypeId: completeCaseType.id,
      initialTab: tabName,
    });
  }, [completeCaseType.id]);

  const onAddToEventClick = useCallback((row: CaseDbCase) => {
    EventBusService.getInstance().emit('openAddCasesToEventDialog', {
      currentCaseSet: caseSet,
      rows: [row],
    });
  }, [caseSet]);


  const onIndexCellClick = useCallback((row: CaseDbCase) => {
    openCaseInfoDialog(row.id, CASE_INFO_DIALOG_TAB_NAME.INFO);
  }, [openCaseInfoDialog]);

  const getColumnWidth = useCallback((col: CaseDbCol, label: string) => {
    let maxTextLength = label?.length * 0.8;
    sortedData.forEach(row => {
      const value = CaseUtil.getRowValue(row.content, col, completeCaseType).short;
      if (value?.length > maxTextLength) {
        maxTextLength = value.length;
      }
    });

    let maxWidth = +theme.spacing(5).replace('px', '') + maxTextLength * 7;
    if (stratification?.col?.id === col.id) {
      maxWidth = maxWidth + +theme.spacing(3).replace('px', '');
    }

    const { MAX_COLUMN_WIDTH, REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT } = ConfigService.getInstance<CaseDbConfig>().config.lineList;
    return Math.min(MAX_COLUMN_WIDTH, maxWidth) + REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT;
  }, [completeCaseType, sortedData, stratification?.col?.id, theme]);

  const onOrganizationCellClick = useCallback((organizationId: string, organizationName: string) => {
    EventBusService.getInstance().emit('openContactDetailsDialog', {
      organizationId,
      organizationName,
    });
  }, []);

  const renderOrganizationCell = useCallback(({ id, row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.cols[id], completeCaseType);
    if (rowValue.isMissing) {
      return rowValue.short;
    }
    const legendaItem: StratificationLegendaItem = {
      caseIds: [row.id],
      color: stratification?.caseIdColors[row.id],
      columnType: completeCaseType.ref_cols[completeCaseType.cols[id].ref_col_id].col_type,
      rowValue,
    };

    const link = (
      <Link
        color={'primary'}
        component={'button'}
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={() => {
          onOrganizationCellClick(row.content[id], rowValue.long);
        }}
        sx={{
          cursor: 'pointer',
        }}
      >
        {rowValue.short}
      </Link>
    );
    if (id === stratification?.col?.id) {
      return (
        <LegendaItem
          item={legendaItem}
        >
          {link}
        </LegendaItem>
      );
    }
    return link;
  }, [completeCaseType, onOrganizationCellClick, stratification?.caseIdColors, stratification?.col?.id]);

  const onGeneticSequenceCellClick = useCallback((id: string, row: CaseDbCase) => {
    EventBusService.getInstance().emit('openSequenceDownloadDialog', {
      cases: [row],
      geneticSequenceColId: id,
    });
  }, []);

  const renderGeneticSequenceCell = useCallback(({ id, row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    return (
      <Link
        color={'primary'}
        component={'button'}
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onClick={() => {
          onGeneticSequenceCellClick(id, row);
        }}
        sx={{
          cursor: 'pointer',
        }}
      >
        {row.content[id]}
      </Link>
    );
  }, [onGeneticSequenceCellClick]);

  const renderIsInEventHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t`Indicates if the case is in an event.`}
      >
        <CollectionIcon
          fontSize={'small'}
          style={{
            color: theme.palette.primary.main,
            height: 20,
            marginLeft: theme.spacing(-0.5),
            position: 'absolute',
            width: 20,
          }}
        />
      </Tooltip>
    );
  }, [t, theme]);

  const renderIsInEventCell = useCallback(({ row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    return <LineListWidgetIsInEventCell row={row} />;
  }, []);

  const renderIsOwnCaseHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t`Indicates if the case is owned by the current user (the case is in a private data collection that is owned by the user's organization).`}
      >
        <CorporateFareIcon
          fontSize={'small'}
          style={{
            color: theme.palette.primary.main,
            height: 20,
            marginLeft: theme.spacing(-0.5),
            position: 'absolute',
            width: 20,
          }}
        />
      </Tooltip>
    );
  }, [t, theme]);

  const renderIsOwnCaseCell = useCallback(({ row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    return <LineListWidgetIsOwnCaseCell row={row} />;
  }, []);

  const renderSimilarCell = useCallback(({ row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    const similarCaseIds = dashboardStore.getState().findSimilarCasesResults.reduce<string[]>((acc, result) => [...acc, ...result.similarCaseIds], []);
    if (similarCaseIds.includes(row.id)) {
      return (
        <TroubleshootIcon
          fontSize={'small'}
          style={{
            color: theme.palette.primary.main,
            height: 20,
            marginLeft: theme.spacing(-0.5),
            position: 'absolute',
            width: 20,
          }}
        />
      );
    }
    return null;
  }, [dashboardStore, theme]);


  const renderSimilarHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t`Indicates if the case has been identified as a similar case, based on the find similar cases result.`}
      >
        <TroubleshootIcon
          fontSize={'small'}
          style={{
            color: theme.palette.primary.main,
            height: 20,
            marginLeft: theme.spacing(-0.5),
            position: 'absolute',
            width: 20,
          }}
        />
      </Tooltip>
    );
  }, [t, theme]);


  const renderCell = useCallback(({ id, row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.cols[id], completeCaseType);
    const legendaItem: StratificationLegendaItem = {
      caseIds: [row.id],
      color: stratification?.caseIdColors[row.id],
      columnType: completeCaseType.ref_cols[completeCaseType.cols[id].ref_col_id].col_type,
      rowValue,
    };
    if (id === stratification?.col?.id) {
      return (
        <LegendaItem
          item={legendaItem}
        />
      );
    }

    return (
      <>
        {rowValue.short}
      </>
    );
  }, [completeCaseType, stratification?.caseIdColors, stratification?.col?.id]);

  const frozenTableColumnsLeft = useMemo<TableColumn<CaseDbCase, CaseDbCompleteCaseType>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => t('Show case information for {{index}}', { index: params.rowIndex + 1 }),
      }),
      TableUtil.createSelectableColumn(),
      {
        frozen: TABLE_COLUMN_FROZEN.LEFT,
        id: 'isInEvent',
        isInitiallyVisible: true,
        renderCell: renderIsInEventCell,
        renderHeader: renderIsInEventHeader,
        resizable: false,
        type: 'text',
        widthPx: 24,
      } satisfies TableColumn<CaseDbCase, CaseDbCompleteCaseType>,
      {
        frozen: TABLE_COLUMN_FROZEN.LEFT,
        id: 'isOwnCase',
        isInitiallyVisible: true,
        renderCell: renderIsOwnCaseCell,
        renderHeader: renderIsOwnCaseHeader,
        resizable: false,
        type: 'text',
        widthPx: 24,
      } satisfies TableColumn<CaseDbCase, CaseDbCompleteCaseType>,
      {
        frozen: TABLE_COLUMN_FROZEN.LEFT,
        headerTooltipContent: t`Is similar case?`,
        id: 'similar',
        isInitiallyVisible: true,
        renderCell: renderSimilarCell,
        renderHeader: renderSimilarHeader,
        resizable: false,
        type: 'text',
        widthPx: 24,
      } satisfies TableColumn<CaseDbCase, CaseDbCompleteCaseType>,
    ];
  }, [renderIsInEventCell, renderIsInEventHeader, renderIsOwnCaseCell, renderIsOwnCaseHeader, t, renderSimilarCell, renderSimilarHeader]);

  const frozenTableColumnsRight = useMemo<TableColumn<CaseDbCase, CaseDbCompleteCaseType>[]>(() => {
    return [
      TableUtil.createActionsColumn({
        columnContext: null,
        getActions: (params: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
          const actions: ReactElement[] = [
            (
              <MenuItem
                key={'showInformation'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => openCaseInfoDialog(params.row.id, CASE_INFO_DIALOG_TAB_NAME.INFO)}
              >
                <ListItemIcon>
                  <ArrowCircleRightIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Show information`}
                </ListItemText>
              </MenuItem>
            ),
            (
              <MenuItem
                key={'editInformation'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => openCaseInfoDialog(params.row.id, CASE_INFO_DIALOG_TAB_NAME.EDIT)}
              >
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Edit information`}
                </ListItemText>
              </MenuItem>
            ),
            (
              <MenuItem
                key={'share'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => openCaseInfoDialog(params.row.id, CASE_INFO_DIALOG_TAB_NAME.SHARING)}
              >
                <ListItemIcon>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Share`}
                </ListItemText>
              </MenuItem>
            ),
            (
              <MenuItem
                key={'addToEvent'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => onAddToEventClick(params.row)}
              >
                <ListItemIcon>
                  <CollectionIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Add to event`}
                </ListItemText>
              </MenuItem>
            ),
          ];
          return actions;
        },
        t,
      }),
    ];
  }, [onAddToEventClick, openCaseInfoDialog, t]);


  const columnStratificationCache = useMemo(() => {
    const cache: Record<string, Stratification> = {};
    if (!isCondensed) {
      return cache;
    }
    completeCaseType.ordered_col_ids.forEach((colId) => {
      const col = completeCaseType.cols[colId];
      cache[colId] = StratificationUtil.getStratification({
        col,
        completeCaseType,
        mode: STRATIFICATION_MODE.FIELD,
        sortedData,
        useExtraGradients: true,
      });
    });

    return cache;
  }, [completeCaseType, isCondensed, sortedData]);

  const cellColorGetter = useCallback((params: TableRowAndColumnParams<CaseDbCase, CaseDbCompleteCaseType>): string | undefined => {
    const columnStratification = columnStratificationCache[params.column.id];
    return columnStratification?.caseIdColors[params.row.id];
  }, [columnStratificationCache]);

  const cellTitleGetter = useCallback((params: TableRowAndColumnParams<CaseDbCase, CaseDbCompleteCaseType>): string | undefined => {
    const rowValue = CaseUtil.getRowValue(params.row.content, completeCaseType.cols[params.column.id], completeCaseType);
    return rowValue.isMissing ? undefined : rowValue.long;
  }, [completeCaseType]);

  const tableColumns = useMemo<TableColumn<CaseDbCase, CaseDbCompleteCaseType>[]>(() => {
    const { DATA_MISSING_CHARACTER } = ConfigService.getInstance<CaseDbConfig>().config.epi;

    const initialVisibleColumnIds = CaseTypeUtil.getInitialVisibleColIds(completeCaseType);
    const caseTypeTableColumns: TableColumn<CaseDbCase, CaseDbCompleteCaseType>[] = [];


    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        const baseCaseTypeTableColumn: Partial<TableColumn<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>> = {
          cellColorGetter,
          cellTitleGetter,
          columnContext: col,
          headerName: col.label,
          headerTooltipContent: refCol.description,
          id: col.id,
          isInitiallyVisible: initialVisibleColumnIds.includes(col.id),
        };
        if (refCol.col_type === CaseDbColType.GENETIC_DISTANCE) {
          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            cellTitleGetter: (params) => {
              const value = treeAddresses[col.id]?.addresses[params.row.id] ? `${treeAddresses[col.id].algorithmCode} ${treeAddresses[col.id].addresses[params.row.id]}` : undefined;
              return value ?? undefined;
            },
            comparatorFactory: ({ direction }: GetTableCellRowComparatorProps<TableColumnText<CaseDbCase, CaseDbCompleteCaseType>, CaseDbCompleteCaseType>) => (a: CaseDbCase, b: CaseDbCase) => {
              const sortValue = StringUtil.advancedSortComperator(treeAddresses[col.id]?.addresses?.[a.id], treeAddresses[col.id]?.addresses?.[b.id]);
              return direction === 'asc' ? sortValue : -sortValue;
            },
            type: 'text',
            valueGetter: (params) => {
              const value = treeAddresses[col.id]?.addresses[params.row.id] ? `${treeAddresses[col.id].algorithmCode} ${treeAddresses[col.id].addresses[params.row.id]}` : undefined;
              return value ?? DATA_MISSING_CHARACTER;
            },
            widthPx: 200,
          } as TableColumn<CaseDbCase, CaseDbCompleteCaseType>);
        } else {
          let cellRenderer: (params: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => ReactElement | string;
          if (refCol.col_type === CaseDbColType.ORGANIZATION) {
            cellRenderer = renderOrganizationCell;
          } else if (refCol.col_type === CaseDbColType.GENETIC_SEQUENCE) {
            cellRenderer = renderGeneticSequenceCell;
          } else {
            cellRenderer = renderCell;
          }

          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            comparatorFactory: CaseDbTableUtil.createCaseTypeCellRowComperator,
            renderCell: cellRenderer,
            textAlign: ([CaseDbColType.DECIMAL_0, CaseDbColType.DECIMAL_1, CaseDbColType.DECIMAL_2, CaseDbColType.DECIMAL_3, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_5, CaseDbColType.DECIMAL_6] as CaseDbColType[]).includes(refCol.col_type) ? 'right' : 'left',
            type: 'text',
            widthPx: getColumnWidth(col, col.label),
          } as TableColumn<CaseDbCase, CaseDbCompleteCaseType>);
        }
      });
    });

    return [
      ...frozenTableColumnsLeft,
      ...caseTypeTableColumns,
      ...frozenTableColumnsRight,
    ];
  }, [completeCaseType, frozenTableColumnsLeft, frozenTableColumnsRight, cellColorGetter, cellTitleGetter, treeAddresses, getColumnWidth, renderOrganizationCell, renderGeneticSequenceCell, renderCell]);

  const onRowMouseEnter = useCallback((row: CaseDbCase) => {
    dashboardContext.highlight({
      caseIds: [row.id],
      origin: DASHBOARD_COMPONENT_NAME.LINE_LIST,
    });
  }, [dashboardContext]);


  const onRowMouseLeave = useCallback(() => {
    dashboardContext.highlight({
      caseIds: [],
      origin: DASHBOARD_COMPONENT_NAME.LINE_LIST,
    });
  }, [dashboardContext]);

  useEffect(() => {
    setTableColumns(tableColumns);
  }, [setTableColumns, tableColumns]);

  useEffect(() => {
    const unsubscribe = dashboardContext.highlightSubject.subscribe((highlighting) => {
      if (highlighting?.origin === DASHBOARD_COMPONENT_NAME.LINE_LIST) {
        return;
      }
      if (highlighting.scrollIntoView) {
        const firstHighlightedCaseId = highlighting.caseIds[0];
        const index = sortedData.findIndex(row => row.id === firstHighlightedCaseId);
        if (index !== -1) {
          tableRef.current?.scrollToIndex(index, () => {
            rowHighlightingSubject.next(highlighting.caseIds);
          });
        }
      } else {
        rowHighlightingSubject.next(highlighting.caseIds);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [dashboardContext, rowHighlightingSubject, sortedData]);

  useEpiLineListWidgetEmitDownloadOptions();

  const updateVisibleIndexDebounced = useDebouncedCallback((index: number) => {
    updateWidgetData<LineListWidgetData>(DASHBOARD_COMPONENT_NAME.LINE_LIST, {
      visibleItemItemIndex: index,
    });
  }, 500);

  const onTableVisibleItemIndexChange = useCallback((index: number) => {
    updateVisibleIndexDebounced(index);
  }, [updateVisibleIndexDebounced]);

  const onRangeChangedDebounced = useDebouncedCallback(async (range: ListRange) => {
    await LineListCaseSetMembersService.getInstance().loadRange(sortedData.slice(range.startIndex, Math.min(range.endIndex + 1, sortedData.length)).map(row => row.id));
    await LineListIsOwnCaseService.getInstance().loadRange(sortedData.slice(range.startIndex, Math.min(range.endIndex + 1, sortedData.length)).map(row => row.id), completeCaseType.id);
  }, ConfigService.getInstance<CaseDbConfig>().config.lineList.CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS, {
    leading: false,
    trailing: true,
  });

  const onRangeChanged = useCallback((range: ListRange) => {
    dashboardContext.lineListRangeSubject.next(range);
    void onRangeChangedDebounced(range);
  }, [dashboardContext, onRangeChangedDebounced]);

  useEffect(() => {
    return () => {
      LineListCaseSetMembersService.getInstance().cleanStaleQueue();
      LineListIsOwnCaseService.getInstance().cleanStaleQueue();
    };
  }, []);

  const onVerticalScrollPositionChange = useCallback((position: number) => {
    if (isNaN(position)) {
      return;
    }
    dashboardContext.linkedScrollSubject.next({
      origin: containerRef.current,
      position,
    });
  }, [dashboardContext]);

  useEffect(() => {
    const unsubscribe = dashboardContext.linkedScrollSubject.subscribe((data) => {
      if (data.origin === containerRef.current) {
        return;
      }
      tableRef.current.setVerticalScrollPosition(data.position);
    });

    return () => {
      unsubscribe();
    };
  }, [dashboardContext]);

  const getRowName = useCallback((row: CaseDbCase): string => {
    return row.id;
  }, []);

  return (
    <DashboardWidget
      isLoading={isDataLoading}
      primaryMenu={<LineListWidgetPrimaryMenu caseSet={caseSet} />}
      secondaryMenu={<LineListWidgetSecondaryMenu />}
      title={<LineListWidgetTitle />}
      widgetName={DASHBOARD_COMPONENT_NAME.LINE_LIST}
    >
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          width: '100%',
        }}
      >
        <Table
          font={theme['gen-epix-ui-casedb'].lineList.font}
          forceHorizontalOverflow
          getRowName={getRowName}
          initialVisibleItemIndex={dashboardStore.getState().getWidgetData<LineListWidgetData>(DASHBOARD_COMPONENT_NAME.LINE_LIST)?.visibleItemItemIndex}
          onRangeChanged={onRangeChanged}
          onReadableIndexClick={onIndexCellClick}
          onRowMouseEnter={onRowMouseEnter}
          onRowMouseLeave={onRowMouseLeave}
          onVerticalScrollPositionChange={onVerticalScrollPositionChange}
          onVisibleItemIndexChange={onTableVisibleItemIndexChange}
          ref={tableRef}
          rowHeight={3}
          rowHighlightingSubject={rowHighlightingSubject}
        />
      </Box>
    </DashboardWidget>
  );
};
