import {
  Box,
  CircularProgress,
  Link,
  Tooltip,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useDebouncedCallback } from 'use-debounce';
import type { ListRange } from 'react-virtuoso';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import { EpiWidget } from '../EpiWidget';
import { EpiLegendaItem } from '../EpiLegendaItem';
import type {
  CaseSet,
  Case,
  Col,
} from '../../../api';
import { ColType } from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiLineListCaseSetMembersManager } from '../../../classes/managers/EpiLineListCaseSetMembersManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { Subject } from '../../../classes/Subject';
import type { EpiLinkedScrollSubjectValue } from '../../../models/epi';
import {
  EPI_ZONE,
  STRATIFICATION_MODE,
} from '../../../models/epi';
import type {
  TableColumn,
  TableRowParams,
  GetTableCellRowComparatorProps,
  TableColumnCaseType,
} from '../../../models/table';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CaseUtil } from '../../../utils/CaseUtil';
import { StringUtil } from '../../../utils/StringUtil';
import { TableUtil } from '../../../utils/TableUtil';
import {
  Table,
  type TableRef,
} from '../../ui/Table';

import { EpiLineListWidgetTitle } from './EpiLineListWidgetTitle';
import { EpiLineListWidgetPrimaryMenu } from './EpiLineListWidgetPrimaryMenu';
import { EpiLineListWidgetSecondaryMenu } from './EpiLineListWidgetSecondaryMenu';
import { useEpiLineListWidgetEmitDownloadOptions } from './useEpiLineListWidgetEmitDownloadOptions';

export type EpiLineListWidgetProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly onLink: () => void;
  readonly caseSet?: CaseSet;
};

export const EpiLineListWidget = ({ linkedScrollSubject, onLink, caseSet }: EpiLineListWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const highlightingManager = useMemo(() => EpiHighlightingManager.instance, []);
  const rowHighlightingSubject = useMemo(() => new Subject<string[]>([]), []);
  const tableRef = useRef<TableRef>(null);

  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification?.mode === STRATIFICATION_MODE.FIELD ? state.stratification : null);
  const updateEpiListWidgetData = useStore(epiDashboardStore, (state) => state.updateEpiListWidgetData);
  const treeAddresses = useStore(epiDashboardStore, (state) => state.treeAddresses);
  const setTableColumns = useStore(epiDashboardStore, (state) => state.setColumns);
  const isDataLoading = useStore(epiDashboardStore, (state) => state.isDataLoading);

  const onIndexCellClick = useCallback((row: Case) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
      caseId: row.id,
      caseTypeId: completeCaseType.id,
    });
  }, [completeCaseType.id]);

  const getColumnWidth = useCallback((col: Col, label: string) => {
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

    const { MAX_COLUMN_WIDTH, REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT } = ConfigManager.instance.config.epiLineList;
    return Math.min(MAX_COLUMN_WIDTH, maxWidth) + REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT;
  }, [completeCaseType, sortedData, stratification?.col?.id, theme]);

  const onOrganizationCellClick = useCallback((organizationId: string, organizationName: string) => {
    EpiEventBusManager.instance.emit('openContactDetailsDialog', {
      organizationId,
      organizationName,
    });
  }, []);

  const renderOrganizationCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.cols[id], completeCaseType);
    if (rowValue.isMissing) {
      return rowValue.short;
    }
    const link = (
      <Link
        component={'button'}
        sx={{
          cursor: 'pointer',
        }}
        color={'primary'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          onOrganizationCellClick(row.content[id], rowValue.long);
        }}
      >
        {rowValue.short}
      </Link>
    );
    if (id === stratification?.col?.id) {
      return (
        <EpiLegendaItem
          color={stratification?.caseIdColors[row.id]}
          rowValue={rowValue}
        >
          {link}
        </EpiLegendaItem>
      );
    }
    return link;
  }, [completeCaseType, onOrganizationCellClick, stratification?.caseIdColors, stratification?.col?.id]);

  const onGeneticSequenceCellClick = useCallback((id: string, row: Case) => {
    EpiEventBusManager.instance.emit('openSequenceDownloadDialog', {
      geneticSequenceColId: id,
      cases: [row],
    });
  }, []);

  const renderGeneticSequenceCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    return (
      <Link
        component={'button'}
        sx={{
          cursor: 'pointer',
        }}
        color={'primary'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          onGeneticSequenceCellClick(id, row);
        }}
      >
        {row.content[id]}
      </Link>
    );
  }, [onGeneticSequenceCellClick]);

  const renderEventsHeader = useCallback(() => {
    return (
      <Tooltip
        arrow
        title={t('Indicates if case is in an event')}
        aria-hidden={false}
      >
        <CollectionIcon
          style={{
            color: theme.palette.primary.main,
            position: 'absolute',
            width: 20,
            height: 20,
            marginLeft: theme.spacing(-0.5),
          }}
          fontSize={'small'}
        />
      </Tooltip>
    );
  }, [t, theme]);

  const renderEventsCell = useCallback(({ row }: TableRowParams<Case>) => {
    let queryResult;
    const rowId = `row_${row.id}`;

    EpiLineListCaseSetMembersManager.instance.query(row.id).then(result => {
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
            position: 'absolute',
            marginTop: '4px',
          }}
        />
      </Box>
    );
  }, []);

  const renderSimilarCell = useCallback(({ row }: TableRowParams<Case>) => {
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
        arrow
        title={t('Indicates if the case has been identified as similar to another case based on the selected tree algorithm and distance threshold')}
        aria-hidden={false}
      >
        <TroubleshootIcon
          style={{
            color: theme.palette.primary.main,
            position: 'absolute',
            width: 20,
            height: 20,
            marginLeft: theme.spacing(-0.5),
          }}
          fontSize={'small'}
        />
      </Tooltip>
    );
  }, [t, theme]);


  const renderCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.cols[id], completeCaseType);

    if (id === stratification?.col?.id) {
      return (
        <EpiLegendaItem
          color={stratification?.caseIdColors[row.id]}
          rowValue={rowValue}
        />
      );
    }

    return (
      <>
        {rowValue.short}
      </>
    );
  }, [completeCaseType, stratification?.caseIdColors, stratification?.col?.id]);

  const staticTableColumns = useMemo<TableColumn<Case>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<Case>) => t('Show case information for {{index}}', { index: params.rowIndex + 1 }),
      }),
      TableUtil.createSelectableColumn(),
      {
        type: 'text',
        renderCell: renderEventsCell,
        isInitiallyVisible: true,
        isStatic: true,
        frozen: true,
        resizable: false,
        id: 'events',
        renderHeader: renderEventsHeader,
        widthPx: 24,
      },
      {
        type: 'text',
        renderCell: renderSimilarCell,
        headerTooltipContent: t`Is similar case?`,
        isInitiallyVisible: true,
        isStatic: true,
        frozen: true,
        resizable: false,
        id: 'similar',
        renderHeader: renderSimilarHeader,
        widthPx: 24,
      },
    ];
  }, [renderEventsCell, renderSimilarCell, renderEventsHeader, renderSimilarHeader, t]);

  const tableColumns = useMemo<TableColumn<Case>[]>(() => {
    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;

    const initialVisibleColumnIds = CaseTypeUtil.getInitialVisibleColIds(completeCaseType);
    const caseTypeTableColumns: TableColumn<Case>[] = [];


    completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).forEach((dim) => {
      completeCaseType.ordered_col_ids_by_dim[dim.id].map(id => completeCaseType.cols[id]).forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        const baseCaseTypeTableColumn: Partial<TableColumn<Case>> = {
          isInitiallyVisible: initialVisibleColumnIds.includes(col.id),
          id: col.id,
          headerTooltipContent: refCol.description,
          headerName: col.label,
        };
        if (refCol.col_type === ColType.GENETIC_DISTANCE) {
          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            type: 'caseType',
            widthPx: 200,
            valueGetter: (params) => {
              const value = treeAddresses[col.id]?.addresses[params.row.id] ? `${treeAddresses[col.id].algorithmCode} ${treeAddresses[col.id].addresses[params.row.id]}` : undefined;
              return {
                raw: value,
                short: value ?? DATA_MISSING_CHARACTER,
                full: value ?? DATA_MISSING_CHARACTER,
                long: value ?? DATA_MISSING_CHARACTER,
                isMissing: !value,
              };
            },
            comparatorFactory: ({ direction }: GetTableCellRowComparatorProps<TableColumnCaseType<Case>>) => (a: Case, b: Case) => {
              const sortValue = StringUtil.advancedSortComperator(treeAddresses[col.id]?.addresses?.[a.id], treeAddresses[col.id]?.addresses?.[b.id]);
              return direction === 'asc' ? sortValue : -sortValue;
            },
          } as TableColumn<Case>);
        } else {
          let cellRenderer: (params: TableRowParams<Case>) => string | ReactElement;
          if (refCol.col_type === ColType.ORGANIZATION) {
            cellRenderer = renderOrganizationCell;
          } else if (refCol.col_type === ColType.GENETIC_SEQUENCE) {
            cellRenderer = renderGeneticSequenceCell;
          } else {
            cellRenderer = renderCell;
          }

          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            widthPx: getColumnWidth(col, col.label),
            type: 'caseType',
            renderCell: cellRenderer,
            col,
            completeCaseType,
            comparatorFactory: TableUtil.createCaseTypeCellRowComperator,
            textAlign: ([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(refCol.col_type) ? 'right' : 'left',
          } as TableColumn<Case>);
        }
      });
    });

    return [
      ...staticTableColumns,
      ...caseTypeTableColumns,
    ];
  }, [completeCaseType, staticTableColumns, treeAddresses, getColumnWidth, renderOrganizationCell, renderGeneticSequenceCell, renderCell]);

  const onRowMouseEnter = useCallback((row: Case) => {
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
    await EpiLineListCaseSetMembersManager.instance.loadRange(sortedData.slice(range.startIndex, Math.min(range.endIndex + 1, sortedData.length)).map(row => row.id));
  }, ConfigManager.instance.config.epiLineList.CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS, {
    trailing: true,
    leading: false,
  });

  useEffect(() => {
    return () => {
      EpiLineListCaseSetMembersManager.instance.cleanStaleQueue();
    };
  }, []);

  const onVerticalScrollPositionChange = useCallback((position: number) => {
    if (isNaN(position)) {
      return;
    }
    linkedScrollSubject.next({
      position,
      origin: containerRef.current,
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

  const getRowName = useCallback((row: Case): string => {
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
          width: '100%',
          height: '100%',
        }}
      >
        <Table
          ref={tableRef}
          forceHorizontalOverflow
          font={theme['gen-epix'].lineList.font}
          getRowName={getRowName}
          initialVisibleItemIndex={epiDashboardStore.getState().epiListWidgetData.visibleItemItemIndex}
          rowHeight={3}
          rowHighlightingSubject={rowHighlightingSubject}
          onRangeChanged={onRangeChangedDebounced}
          onReadableIndexClick={onIndexCellClick}
          onRowMouseEnter={onRowMouseEnter}
          onRowMouseLeave={onRowMouseLeave}
          onVerticalScrollPositionChange={onVerticalScrollPositionChange}
          onVisibleItemIndexChange={onTableVisibleItemIndexChange}
        />
      </Box>
    </EpiWidget>
  );
};
