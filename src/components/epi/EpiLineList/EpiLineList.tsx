import {
  Box,
  CircularProgress,
  Link,
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
import { useShallow } from 'zustand/shallow';
import { useDebouncedCallback } from 'use-debounce';
import type { ListRange } from 'react-virtuoso';

import { EpiWidget } from '../EpiWidget';
import { EpiLegendaItem } from '../EpiLegendaItem';
import type {
  CaseSet,
  Case,
  CaseTypeCol,
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

import { EpiLineListTitle } from './EpiLineListTitle';
import { EpiLineListPrimaryMenu } from './EpiLineListPrimaryMenu';
import { EpiLineListSecondaryMenu } from './EpiLineListSecondaryMenu';
import { useEpiLineListEmitDownloadOptions } from './useEpiLineListEmitDownloadOptions';

export type EpiLineListProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly onLink: () => void;
  readonly caseSet?: CaseSet;
};

export const EpiLineList = ({ linkedScrollSubject, onLink, caseSet }: EpiLineListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const highlightingManager = useMemo(() => EpiHighlightingManager.instance, []);
  const rowHighlightingSubject = useMemo(() => new Subject<string[]>([]), []);
  const tableRef = useRef<TableRef>(null);

  const epiStore = useContext(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const stratification = useStore(epiStore, useShallow((state) => state.stratification?.mode === STRATIFICATION_MODE.FIELD ? state.stratification : null));
  const epiListWidgetData = useStore(epiStore, useShallow((state) => state.epiListWidgetData));
  const updateEpiListWidgetData = useStore(epiStore, useShallow((state) => state.updateEpiListWidgetData));
  const treeAddresses = useStore(epiStore, useShallow((state) => state.treeAddresses));
  const setTableColumns = useStore(epiStore, useShallow((state) => state.setColumns));
  const isDataLoading = useStore(epiStore, useShallow((state) => state.isDataLoading));

  const onIndexCellClick = useCallback((row: Case) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
      caseId: row.id,
      caseTypeId: completeCaseType.id,
    });
  }, [completeCaseType.id]);

  const getColumnWidth = useCallback((caseTypeCol: CaseTypeCol, label: string) => {
    let maxTextLength = label?.length * 0.8;
    sortedData.forEach(row => {
      const value = CaseUtil.getRowValue(row.content, caseTypeCol, completeCaseType).short;
      if (value?.length > maxTextLength) {
        maxTextLength = value.length;
      }
    });

    let maxWidth = +theme.spacing(5).replace('px', '') + maxTextLength * 7;
    if (stratification?.caseTypeCol?.id === caseTypeCol.id) {
      maxWidth = maxWidth + +theme.spacing(3).replace('px', '');
    }

    const { MAX_COLUMN_WIDTH, REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT } = ConfigManager.instance.config.epiLineList;
    return Math.min(MAX_COLUMN_WIDTH, maxWidth) + REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT;
  }, [completeCaseType, sortedData, stratification?.caseTypeCol?.id, theme]);

  const onOrganizationCellClick = useCallback((organizationId: string, organizationName: string) => {
    EpiEventBusManager.instance.emit('openContactDetailsDialog', {
      organizationId,
      organizationName,
    });
  }, []);

  const renderOrganizationCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.case_type_cols[id], completeCaseType);
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
    if (id === stratification?.caseTypeCol?.id) {
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
  }, [completeCaseType, onOrganizationCellClick, stratification?.caseIdColors, stratification?.caseTypeCol?.id]);

  const onGeneticSequenceCellClick = useCallback((id: string, row: Case) => {
    EpiEventBusManager.instance.emit('openSequenceDownloadDialog', {
      geneticSequenceCaseTypeColId: id,
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

  const renderEventsCell = useCallback(({ row }: TableRowParams<Case>) => {
    if (caseSet) {
      return (
        <Box>
          {`✓`}
        </Box>
      );
    }
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
  }, [caseSet]);

  const renderCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    const rowValue = CaseUtil.getRowValue(row.content, completeCaseType.case_type_cols[id], completeCaseType);

    if (id === stratification?.caseTypeCol?.id) {
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
  }, [completeCaseType, stratification?.caseIdColors, stratification?.caseTypeCol?.id]);

  const staticTableColumns = useMemo<TableColumn<Case>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<Case>) => t('Show case information for {{index}}', { index: params.rowIndex + 1 }),
      }),
      TableUtil.createSelectableColumn(),
      {
        type: 'text',
        renderCell: renderEventsCell,
        headerTooltipContent: t`Is case in an event?`,
        isInitiallyVisible: true,
        isStatic: true,
        frozen: true,
        resizable: false,
        id: 'events',
        headerName: '✓',
        widthPx: 32,
      },
    ];
  }, [renderEventsCell, t]);

  const tableColumns = useMemo<TableColumn<Case>[]>(() => {
    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;

    const initialVisibleColumnIds = CaseTypeUtil.getInitialVisibleColumnIds(completeCaseType);
    const caseTypeTableColumns: TableColumn<Case>[] = [];


    completeCaseType.ordered_case_type_dim_ids.map(x => completeCaseType.case_type_dims[x]).forEach((caseTypeDim) => {
      completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDim.id].map(id => completeCaseType.case_type_cols[id]).forEach(caseTypeCol => {
        const col = completeCaseType.cols[caseTypeCol.col_id];
        const baseCaseTypeTableColumn: Partial<TableColumn<Case>> = {
          isInitiallyVisible: initialVisibleColumnIds.includes(caseTypeCol.id),
          id: caseTypeCol.id,
          headerTooltipContent: col.description,
          headerName: caseTypeCol.label,
        };
        if (col.col_type === ColType.GENETIC_DISTANCE) {
          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            type: 'caseType',
            widthPx: 200,
            valueGetter: (params) => {
              const value = treeAddresses[caseTypeCol.id]?.addresses[params.row.id] ? `${treeAddresses[caseTypeCol.id].algorithmCode} ${treeAddresses[caseTypeCol.id].addresses[params.row.id]}` : undefined;
              return {
                raw: value,
                short: value ?? DATA_MISSING_CHARACTER,
                full: value ?? DATA_MISSING_CHARACTER,
                long: value ?? DATA_MISSING_CHARACTER,
                isMissing: !value,
              };
            },
            comparatorFactory: ({ direction }: GetTableCellRowComparatorProps<TableColumnCaseType<Case>>) => (a: Case, b: Case) => {
              const sortValue = StringUtil.advancedSortComperator(treeAddresses[caseTypeCol.id]?.addresses?.[a.id], treeAddresses[caseTypeCol.id]?.addresses?.[b.id]);
              return direction === 'asc' ? sortValue : -sortValue;
            },
          } as TableColumn<Case>);
        } else {
          let cellRenderer: (params: TableRowParams<Case>) => string | ReactElement;
          if (col.col_type === ColType.ORGANIZATION) {
            cellRenderer = renderOrganizationCell;
          } else if (col.col_type === ColType.GENETIC_SEQUENCE) {
            cellRenderer = renderGeneticSequenceCell;
          } else {
            cellRenderer = renderCell;
          }

          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            widthPx: getColumnWidth(caseTypeCol, caseTypeCol.label),
            type: 'caseType',
            renderCell: cellRenderer,
            caseTypeCol,
            completeCaseType,
            comparatorFactory: TableUtil.createCaseTypeCellRowComperator,
            textAlign: ([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(col.col_type) ? 'right' : 'left',
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

  useEpiLineListEmitDownloadOptions();

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
      primaryMenu={<EpiLineListPrimaryMenu caseSet={caseSet} />}
      secondaryMenu={<EpiLineListSecondaryMenu onLink={onLink} />}
      title={<EpiLineListTitle />}
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
          initialVisibleItemIndex={epiListWidgetData.visibleItemItemIndex}
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
