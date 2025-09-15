import {
  Box,
  CircularProgress,
  Link,
  useTheme,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import noop from 'lodash/noop';
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
import {
  ColType,
  CommandName,
  PermissionType,
} from '../../../api';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiListsCaseSetMembersManager } from '../../../classes/managers/EpiListsCaseSetMembersManager';
import { HighlightingManager } from '../../../classes/managers/HighlightingManager';
import { Subject } from '../../../classes/Subject';
import { UseColumnsMenu } from '../../../hooks/useColumnsMenu';
import type { EpiLinkedScrollSubjectValue } from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import type {
  TableColumn,
  TableRowParams,
  GetTableCellRowComparatorProps,
  TableColumnCaseType,
} from '../../../models/table';
import { EpiStoreContext } from '../../../stores/epiStore';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import { StringUtil } from '../../../utils/StringUtil';
import { TableUtil } from '../../../utils/TableUtil';
import {
  Table,
  type TableRef,
} from '../../ui/Table';
import { EpiDownloadUtil } from '../../../utils/EpiDownloadUtil';

export type EpiListProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly onLink: () => void;
  readonly caseSet?: CaseSet;
};

export const EpiList = ({ linkedScrollSubject, onLink, caseSet }: EpiListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t] = useTranslation();
  const theme = useTheme();
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);
  const rowHighlightingSubject = useMemo(() => new Subject<string[]>([]), []);
  const tableRef = useRef<TableRef>(null);

  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const setSorting = useStore(epiStore, useShallow((state) => state.setSorting));
  const selectedRowCaseIds = useStore(epiStore, useShallow((state) => state.selectedIds));
  const selectRows = useStore(epiStore, useShallow((state) => state.setSelectedIds));
  const stratification = useStore(epiStore, useShallow((state) => state.stratification));
  const epiListWidgetData = useStore(epiStore, useShallow((state) => state.epiListWidgetData));
  const updateEpiListWidgetData = useStore(epiStore, useShallow((state) => state.updateEpiListWidgetData));
  const treeAddresses = useStore(epiStore, useShallow((state) => state.treeAddresses));
  const setFilterValue = useStore(epiStore, useShallow((state) => state.setFilterValue));
  const setTableColumns = useStore(epiStore, useShallow((state) => state.setColumns));
  const isDataLoading = useStore(epiStore, useShallow((state) => state.isDataLoading));
  const isTreeLinked = useStore(epiStore, useShallow((state) => state.epiTreeWidgetData.zoomLevel === 1));

  const onIndexCellClick = useCallback((row: Case) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
      caseId: row.id,
    });
  }, []);

  const getColumnWidth = useCallback((caseTypeColumn: CaseTypeCol, label: string) => {
    let maxTextLength = label?.length * 0.8;
    sortedData.forEach(row => {
      const value = EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).short;
      if (value?.length > maxTextLength) {
        maxTextLength = value.length;
      }
    });

    let maxWidth = +theme.spacing(5).replace('px', '') + maxTextLength * 7;
    if (stratification?.caseTypeColumn?.id === caseTypeColumn.id) {
      maxWidth = maxWidth + +theme.spacing(3).replace('px', '');
    }

    const { MAX_COLUMN_WIDTH, REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT } = ConfigManager.instance.config.epiList;
    return Math.min(MAX_COLUMN_WIDTH, maxWidth) + REQUIRED_EXTRA_CELL_PADDING_TO_FIT_CONTENT;
  }, [completeCaseType, sortedData, stratification?.caseTypeColumn?.id, theme]);

  const onOrganizationCellClick = useCallback((contactId: string) => {
    EpiEventBusManager.instance.emit('openContactDetailsDialog', {
      contactId,
    });
  }, []);

  const hasCellData = useCallback((row: Case, column: TableColumn<Case>, rowIndex: number) => {
    if (column.type === 'caseType' && column.valueGetter) {
      return !column.valueGetter({
        row,
        id: column.id,
        rowIndex,
      }).isMissing;
    }
    return !EpiCaseUtil.getRowValue(row, completeCaseType.case_type_cols[column.id], completeCaseType).isMissing;
  }, [completeCaseType]);

  const renderOrganizationCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    const rowValue = EpiCaseUtil.getRowValue(row, completeCaseType.case_type_cols[id], completeCaseType);
    if (rowValue.isMissing) {
      return rowValue.short;
    }
    const link = (
      <Link
        sx={{
          cursor: 'pointer',
        }}
        color={'primary'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          onOrganizationCellClick(row.content[id]);
        }}
      >
        {rowValue.short}
      </Link>
    );
    if (id === stratification?.caseTypeColumn?.id) {
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
  }, [completeCaseType, onOrganizationCellClick, stratification?.caseIdColors, stratification?.caseTypeColumn?.id]);

  const onGeneticSequenceCellClick = useCallback((id: string, row: Case) => {
    EpiEventBusManager.instance.emit('openSequenceDownloadDialog', {
      geneticSequenceCaseTypeColId: id,
      cases: [row],
    });
  }, []);

  const renderGeneticSequenceCell = useCallback(({ id, row }: TableRowParams<Case>) => {
    return (
      <Link
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

    EpiListsCaseSetMembersManager.instance.query(row.id).then(result => {
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
    const rowValue = EpiCaseUtil.getRowValue(row, completeCaseType.case_type_cols[id], completeCaseType);

    if (id === stratification?.caseTypeColumn?.id) {
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
  }, [completeCaseType, stratification?.caseIdColors, stratification?.caseTypeColumn?.id]);

  const staticTableColumns = useMemo<TableColumn<Case>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn(),
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

    const initialVisibleColumnIds = EpiCaseTypeUtil.getInitialVisibleColumnIds(completeCaseType);
    const caseTypeTableColumns: TableColumn<Case>[] = [];

    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dimension, dimensionCaseTypeColumns) => {
      dimensionCaseTypeColumns.forEach(caseTypeColumn => {
        const col = completeCaseType.cols[caseTypeColumn.col_id];
        const baseCaseTypeTableColumn: Partial<TableColumn<Case>> = {
          isInitiallyVisible: initialVisibleColumnIds.includes(caseTypeColumn.id),
          id: caseTypeColumn.id,
          headerTooltipContent: col.description,
          headerName: caseTypeColumn.label,
        };
        if (col.col_type === ColType.GENETIC_DISTANCE) {
          caseTypeTableColumns.push({
            ...baseCaseTypeTableColumn,
            type: 'caseType',
            widthPx: 200,
            valueGetter: (params) => {

              const value = treeAddresses[caseTypeColumn.id]?.addresses[params.row.id] ? `${treeAddresses[caseTypeColumn.id].algorithmCode} ${treeAddresses[caseTypeColumn.id].addresses[params.row.id]}` : undefined;
              return {
                raw: value,
                short: value ?? DATA_MISSING_CHARACTER,
                full: value ?? DATA_MISSING_CHARACTER,
                long: value ?? DATA_MISSING_CHARACTER,
                isMissing: !value,
              };
            },
            comparatorFactory: ({ direction }: GetTableCellRowComparatorProps<TableColumnCaseType<Case>>) => (a: Case, b: Case) => {
              const sortValue = StringUtil.advancedSortComperator(treeAddresses[caseTypeColumn.id]?.addresses?.[a.id], treeAddresses[caseTypeColumn.id]?.addresses?.[b.id]);
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
            widthPx: getColumnWidth(caseTypeColumn, caseTypeColumn.label),
            type: 'caseType',
            renderCell: cellRenderer,
            caseTypeColumn,
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

  const getSelectedRows = useCallback(() => {
    return sortedData.filter(row => selectedRowCaseIds.includes(row.id));
  }, [sortedData, selectedRowCaseIds]);

  const createFilterFromSelectedRowCaseIds = useCallback(async () => {
    await setFilterValue('selected', selectedRowCaseIds);
    selectRows([]);
  }, [selectRows, selectedRowCaseIds, setFilterValue]);

  const getVisibleColumnIds = useCallback(() => {
    return epiStore.getState().columnSettings.filter(x => x.isVisible).map(x => x.id);
  }, [epiStore]);

  const columnsMenuItem = UseColumnsMenu({ hasCellData });

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    const shouldShowCreateEventMenuItem = AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CreateCaseSetCommand, permission_type: PermissionType.EXECUTE }]);
    const shouldShowAddToEventMenuItem = AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CaseSetMemberCrudCommand, permission_type: PermissionType.CREATE }]);
    const shouldShowRemoveFromEventMenuItem = !!caseSet && AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CaseSetMemberCrudCommand, permission_type: PermissionType.DELETE }]);
    // FIXME
    // const shouldShowBulkEditCaseMenuItem = true;

    const actionsColumnMenuItem: MenuItemData = {
      label: t`Actions`,
      items: [
        {
          label: t`Create filter from selected cases`,
          disabled: !selectedRowCaseIds?.length,
          callback: createFilterFromSelectedRowCaseIds,
          divider: true,
        },
        {
          label: t`Find similar cases`,
          disabled: true,
          callback: noop,
        },
      ],
    };

    if (shouldShowCreateEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          label: t`Create new event with selected cases`,
          disabled: !selectedRowCaseIds?.length,
          callback: () => EpiEventBusManager.instance.emit('openCreateEventDialog', {
            rows: getSelectedRows(),
            completeCaseType,
          }),
        },
      );
    }

    if (shouldShowAddToEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          disabled: !selectedRowCaseIds?.length,
          label: t`Add selected cases to existing event`,
          callback: () => EpiEventBusManager.instance.emit('openAddCasesToEventDialog', { rows: getSelectedRows(), currentCaseSet: caseSet }),
        },
      );
    }

    if (shouldShowRemoveFromEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          disabled: !selectedRowCaseIds?.length,
          label: t`Remove selected cases from this event`,
          callback: () => EpiEventBusManager.instance.emit('openRemoveCasesFromEventDialog', { rows: getSelectedRows(), caseSet }),
        },
      );
    }
    if (actionsColumnMenuItem.items.length > 2) {
      actionsColumnMenuItem.items[1].divider = true;
    }

    // last(actionsColumnMenuItem.items).divider = true;
    // if (shouldShowBulkEditCaseMenuItem) {
    //   actionsColumnMenuItem.items.push(
    //     {
    //       disabled: !selectedRowCaseIds?.length,
    //       label: t`Bulk edit selected cases`,
    //       callback: () => EpiEventBusManager.instance.emit('openBulkEditCaseDialog', { rows: getSelectedRows() }),
    //     },
    //   );
    // }

    const menus: MenuItemData[] = [
      columnsMenuItem,
      actionsColumnMenuItem,
    ];

    return menus;
  }, [caseSet, t, selectedRowCaseIds, createFilterFromSelectedRowCaseIds, columnsMenuItem, getSelectedRows, completeCaseType]);


  useEffect(() => {
    const emitDownloadOptions = () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.LINE_LIST,
        zoneLabel: t`Line list`,
        items: [
          {
            label: t`All rows`,
            items: [
              {
                label: t`Download as Excel`,
                callback: async () => EpiDownloadUtil.downloadAsExcel(sortedData, getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download as CSV`,
                callback: () => EpiDownloadUtil.downloadAsCsv(sortedData, getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download sequences`,
                callback: () => EpiEventBusManager.instance.emit('openSequenceDownloadDialog', { cases: sortedData }),
              },
              {
                label: t`Download allele profiles`,
                disabled: true,
                callback: () => null,
              },
            ],
            disabled: !sortedData?.length,
          },
          {
            label: t`Selected rows`,
            items: [
              {
                label: t`Download as Excel`,
                callback: async () => EpiDownloadUtil.downloadAsExcel(getSelectedRows(), getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download as CSV`,
                callback: () => EpiDownloadUtil.downloadAsCsv(getSelectedRows(), getVisibleColumnIds(), completeCaseType, t),
              },
              {
                label: t`Download sequences`,
                callback: () => EpiEventBusManager.instance.emit('openSequenceDownloadDialog', { cases: sortedData.filter(c => selectedRowCaseIds.includes(c.id)) }),
              },
              {
                label: t`Download allele profiles`,
                disabled: true,
                callback: () => null,
              },
            ],
            disabled: selectedRowCaseIds.length === 0,
          },
        ],
      });
    };
    emitDownloadOptions();
    const remove = EpiEventBusManager.instance.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);

    return () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.LINE_LIST,
        items: null,
        zoneLabel: t`Line list`,
      });
      remove();
    };
  }, [completeCaseType, getSelectedRows, getVisibleColumnIds, selectedRowCaseIds, sortedData, t]);

  const onLinkButtonClick = useCallback(() => {
    const perform = async () => {
      await setSorting(null, null);
      onLink();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [onLink, setSorting]);

  const updateVisibleIndexDebounced = useDebouncedCallback((index: number) => {
    updateEpiListWidgetData({
      visibleItemItemIndex: index,
    });
  }, 500);

  const onTableVisibleItemIndexChange = useCallback((index: number) => {
    updateVisibleIndexDebounced(index);
  }, [updateVisibleIndexDebounced]);

  const onRangeChangedDebounced = useDebouncedCallback(async (range: ListRange) => {
    await EpiListsCaseSetMembersManager.instance.loadRange(sortedData.slice(range.startIndex, Math.min(range.endIndex + 1, sortedData.length)).map(row => row.id));
  }, ConfigManager.instance.config.epiList.CASE_SET_MEMBERS_FETCH_DEBOUNCE_DELAY_MS, {
    trailing: true,
    leading: false,
  });

  useEffect(() => {
    return () => {
      EpiListsCaseSetMembersManager.instance.cleanStaleQueue();
    };
  }, []);

  const secondaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        disabled: isTreeLinked,
        label: t`Link and snap the Tree to the Line list (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
        callback: onLinkButtonClick,
      },
    ];
  }, [isTreeLinked, onLinkButtonClick, t, theme.palette.error.main]);


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
      primaryMenu={primaryMenu}
      secondaryMenu={secondaryMenu}
      title={t('Line list: {{shownCount}} cases, {{selectedCount}} selected', { shownCount: sortedData.length ?? 0, selectedCount: selectedRowCaseIds.length ?? 0 })}
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
          font={theme.epi.lineList.font}
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
