import {
  Box,
  CircularProgress,
  Link,
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
import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  GetTableCellRowComparatorProps,
  TableColumn,
  TableColumnText,
  TableRef,
  TableRowParams,
} from '@gen-epix/ui';
import {
  ConfigManager,
  StringUtil,
  Subject,
  Table,
  TableUtil,
} from '@gen-epix/ui';

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import { EpiWidget } from '../EpiWidget';
import { EpiLegendaItem } from '../EpiLegendaItem';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiLineListCaseSetMembersManager } from '../../../classes/managers/EpiLineListCaseSetMembersManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import type {
  EpiLineListRangeSubjectValue,
  EpiLinkedScrollSubjectValue,
  StratificationLegendaItem,
} from '../../../models/epi';
import {
  EPI_ZONE,
  STRATIFICATION_MODE,
} from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CaseUtil } from '../../../utils/CaseUtil';
import type { CaseDbConfig } from '../../../models/config';
import { CaseDbTableUtil } from '../../../utils/CaseDbTableUtil';

import { EpiLineListWidgetTitle } from './EpiLineListWidgetTitle';
import { EpiLineListWidgetPrimaryMenu } from './EpiLineListWidgetPrimaryMenu';
import { EpiLineListWidgetSecondaryMenu } from './EpiLineListWidgetSecondaryMenu';
import { useEpiLineListWidgetEmitDownloadOptions } from './useEpiLineListWidgetEmitDownloadOptions';

export type EpiLineListWidgetProps = {
  readonly caseSet?: CaseDbCaseSet;
  readonly lineListRangeSubject: Subject<EpiLineListRangeSubjectValue>;
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly onLink: () => void;
};

export const EpiLineListWidget = ({ caseSet, lineListRangeSubject, linkedScrollSubject, onLink }: EpiLineListWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const highlightingManager = useMemo(() => EpiHighlightingManager.getInstance(), []);
  const rowHighlightingSubject = useMemo(() => new Subject<string[]>([]), []);
  const tableRef = useRef<TableRef>(null);

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification?.mode === STRATIFICATION_MODE.FIELD ? state.stratification : null);
  const updateEpiListWidgetData = useStore(epiDashboardStore, (state) => state.updateEpiListWidgetData);
  const treeAddresses = useStore(epiDashboardStore, (state) => state.treeAddresses);
  const setTableColumns = useStore(epiDashboardStore, (state) => state.setColumns);
  const isDataLoading = useStore(epiDashboardStore, (state) => state.isDataLoading);

  useEffect(() => {
    return () => {
      lineListRangeSubject.next(undefined);
    };
  }, [lineListRangeSubject]);

  const onIndexCellClick = useCallback((row: CaseDbCase) => {
    EpiEventBusManager.getInstance().emit('openCaseInfoDialog', {
      caseId: row.id,
      caseTypeId: completeCaseType.id,
    });
  }, [completeCaseType.id]);

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

    const { MAX_COLUMN_WIDTH, REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT } = ConfigManager.getInstance<CaseDbConfig>().config.epiLineList;
    return Math.min(MAX_COLUMN_WIDTH, maxWidth) + REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT;
  }, [completeCaseType, sortedData, stratification?.col?.id, theme]);

  const onOrganizationCellClick = useCallback((organizationId: string, organizationName: string) => {
    EpiEventBusManager.getInstance().emit('openContactDetailsDialog', {
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
        <EpiLegendaItem
          item={legendaItem}
        >
          {link}
        </EpiLegendaItem>
      );
    }
    return link;
  }, [completeCaseType, onOrganizationCellClick, stratification?.caseIdColors, stratification?.col?.id]);

  const onGeneticSequenceCellClick = useCallback((id: string, row: CaseDbCase) => {
    EpiEventBusManager.getInstance().emit('openSequenceDownloadDialog', {
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

  const renderEventsHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t('Indicates if case is in an event')}
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

  const renderEventsCell = useCallback(({ row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    let queryResult;
    const rowId = `row_${row.id}`;

    EpiLineListCaseSetMembersManager.getInstance().query(row.id).then(result => {
      queryResult = result;
      const element = document.getElementById(rowId);
      if (element) {
        element.innerHTML = queryResult ? '✓' : '';
      }
    }).catch(() => {
      const element = document.getElementById(rowId);
      if (element) {
        element.innerHTML = '?';
      }
    });
    return (
      <Box id={rowId}>
        <CircularProgress
          size={16}
          sx={{
            marginTop: '4px',
            position: 'absolute',
          }}
        />
      </Box>
    );
  }, []);

  const renderSimilarCell = useCallback(({ row }: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => {
    const similarCaseIds = epiDashboardStore.getState().findSimilarCasesResults.reduce<string[]>((acc, result) => [...acc, ...result.similarCaseIds], []);
    if (similarCaseIds.includes(row.id)) {
      return (
        <Box>
          {`✓`}
        </Box>
      );
    }
    return null;
  }, [epiDashboardStore]);


  const renderSimilarHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t('Indicates if the case has been identified as similar to another case based on the selected tree algorithm and distance threshold')}
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
        <EpiLegendaItem
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

  const staticTableColumns = useMemo<TableColumn<CaseDbCase, CaseDbCompleteCaseType>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<CaseDbCase, CaseDbCompleteCaseType>) => t('Show case information for {{index}}', { index: params.rowIndex + 1 }),
      }),
      TableUtil.createSelectableColumn(),
      {
        frozen: true,
        id: 'events',
        isInitiallyVisible: true,
        isStatic: true,
        renderCell: renderEventsCell,
        renderHeader: renderEventsHeader,
        resizable: false,
        type: 'text',
        widthPx: 24,
      },
      {
        frozen: true,
        headerTooltipContent: t`Is similar case?`,
        id: 'similar',
        isInitiallyVisible: true,
        isStatic: true,
        renderCell: renderSimilarCell,
        renderHeader: renderSimilarHeader,
        resizable: false,
        type: 'text',
        widthPx: 24,
      },
    ];
  }, [renderEventsCell, renderSimilarCell, renderEventsHeader, renderSimilarHeader, t]);

  const tableColumns = useMemo<TableColumn<CaseDbCase, CaseDbCompleteCaseType>[]>(() => {
    const { DATA_MISSING_CHARACTER } = ConfigManager.getInstance<CaseDbConfig>().config.epi;

    const initialVisibleColumnIds = CaseTypeUtil.getInitialVisibleColIds(completeCaseType);
    const caseTypeTableColumns: TableColumn<CaseDbCase, CaseDbCompleteCaseType>[] = [];


    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        const baseCaseTypeTableColumn: Partial<TableColumn<CaseDbCase, CaseDbCompleteCaseType, CaseDbCol>> = {
          columnContext: col,
          headerName: col.label,
          headerTooltipContent: refCol.description,
          id: col.id,
          isInitiallyVisible: initialVisibleColumnIds.includes(col.id),
        };
        if (refCol.col_type === CaseDbColType.GENETIC_DISTANCE) {
          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
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
      ...staticTableColumns,
      ...caseTypeTableColumns,
    ];
  }, [completeCaseType, staticTableColumns, treeAddresses, getColumnWidth, renderOrganizationCell, renderGeneticSequenceCell, renderCell]);

  const onRowMouseEnter = useCallback((row: CaseDbCase) => {
    highlightingManager.highlight({
      caseIds: [row.id],
      origin: EPI_ZONE.LINE_LIST,
    });
  }, [highlightingManager]);

  const onRowMouseLeave = useCallback(() => {
    highlightingManager.highlight({
      caseIds: [],
      origin: EPI_ZONE.LINE_LIST,
    });
  }, [highlightingManager]);

  useEffect(() => {
    setTableColumns(tableColumns);
  }, [setTableColumns, tableColumns]);

  useEffect(() => {
    const unsubscribe = highlightingManager.subscribe((highlighting) => {
      if (highlighting?.origin === EPI_ZONE.LINE_LIST) {
        return;
      }
      rowHighlightingSubject.next(highlighting.caseIds);
    });
    return () => {
      unsubscribe();
    };
  }, [highlightingManager, rowHighlightingSubject]);

  useEpiLineListWidgetEmitDownloadOptions();

  const updateVisibleIndexDebounced = useDebouncedCallback((index: number) => {
    updateEpiListWidgetData({
      visibleItemItemIndex: index,
    });
  }, 500);

  const onTableVisibleItemIndexChange = useCallback((index: number) => {
    updateVisibleIndexDebounced(index);
  }, [updateVisibleIndexDebounced]);

  const onRangeChangedDebounced = useDebouncedCallback(async (range: ListRange) => {
    await EpiLineListCaseSetMembersManager.getInstance().loadRange(sortedData.slice(range.startIndex, Math.min(range.endIndex + 1, sortedData.length)).map(row => row.id));
  }, ConfigManager.getInstance<CaseDbConfig>().config.epiLineList.CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS, {
    leading: false,
    trailing: true,
  });

  const onRangeChanged = useCallback((range: ListRange) => {
    lineListRangeSubject.next(range);
    void onRangeChangedDebounced(range);
  }, [lineListRangeSubject, onRangeChangedDebounced]);

  useEffect(() => {
    return () => {
      EpiLineListCaseSetMembersManager.getInstance().cleanStaleQueue();
    };
  }, []);

  const onVerticalScrollPositionChange = useCallback((position: number) => {
    if (isNaN(position)) {
      return;
    }
    linkedScrollSubject.next({
      origin: containerRef.current,
      position,
    });
  }, [linkedScrollSubject]);

  useEffect(() => {
    const unsubscribe = linkedScrollSubject.subscribe((data) => {
      if (data.origin === containerRef.current) {
        return;
      }
      tableRef.current.setVerticalScrollPosition(data.position);
    });

    return () => {
      unsubscribe();
    };
  }, [linkedScrollSubject]);

  const getRowName = useCallback((row: CaseDbCase): string => {
    return row.id;
  }, []);

  return (
    <EpiWidget
      isLoading={isDataLoading}
      primaryMenu={<EpiLineListWidgetPrimaryMenu caseSet={caseSet} />}
      secondaryMenu={<EpiLineListWidgetSecondaryMenu onLink={onLink} />}
      title={<EpiLineListWidgetTitle />}
      zone={EPI_ZONE.LINE_LIST}
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
          initialVisibleItemIndex={epiDashboardStore.getState().epiListWidgetData.visibleItemItemIndex}
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
    </EpiWidget>
  );
};
