import {
  Box,
  IconButton,
  Paper,
  Popover,
  styled,
  Tooltip,
  useTheme,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import clsx from 'clsx';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import sum from 'lodash/sum';

import type {
  TableColumn,
  TableDragEvent,
} from '../../../models/table';
import { useTableStoreContext } from '../../../stores/tableStore';

import { TableHeaderFilter } from './TableHeaderFilter';
import type {
  TableCellProps,
  TableCellRef,
} from './TableCell';
import { TableCell } from './TableCell';
import { tableHeaderCellClassNames } from './classNames';

export interface TableHeaderCellProps<TRowData, TContext = null> extends TableCellProps<TRowData, TContext> {
  readonly dividerColor: string;
  readonly onColumnDividerKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>, column: TableColumn<TRowData, TContext>) => void;
  readonly onColumnDividerMouseDown: (event: ReactMouseEvent<HTMLDivElement>, column: TableColumn<TRowData, TContext>) => void;
}

type TableSortLabelIconProps = {
  ownerState: {
    readonly direction: 'asc' | 'desc';
  };
};

const iconSize = 18;

const tableHeaderCellClassNamesFocus = `${tableHeaderCellClassNames.root}--focus`;

const TableSortLabelIconButton = styled(IconButton, {
  name: 'GENEPIX-TableSortLabelIcon',
})<TableSortLabelIconProps>(({ ownerState, theme }) => {
  return {
    '&:hover': {
      color: theme.palette.primary.main,
      opacity: '1 !important',
    },
    '& svg': {
      ...(ownerState.direction === 'desc' && {
        transform: 'rotate(0deg)',
      }),
      ...(ownerState.direction === 'asc' && {
        transform: 'rotate(180deg)',
      }),
    },
    color: theme.palette.text.primary,
    display: 'none',
    fontSize: iconSize,
    height: `${iconSize}px`,
    opacity: 0,
    padding: 0,
    userSelect: 'none',
    width: `${iconSize}px`,
  };
});

const TableFilterLabelIconButton = styled(IconButton, {
  name: 'GENEPIX-TableFilterLabelIcon',
})(({ theme }) => {
  return {
    '&:hover': {
      color: theme.palette.primary.main,
      opacity: '1 !important',
    },
    display: 'none',
    fontSize: iconSize,
    height: `${iconSize}px`,
    opacity: 0,
    padding: 0,
    userSelect: 'none',
    width: `${iconSize}px`,
  };
});

export const TableHeaderCell = <TRowData, TContext = null>(props: TableHeaderCellProps<TRowData, TContext>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const tableStore = useTableStoreContext<TRowData, TContext>();
  const sortByField = useStore(tableStore, (state) => state.sortByField);
  const context = useStore(tableStore, (state) => state.context);
  const sortDirection = useStore(tableStore, (state) => state.sortDirection);
  const setSorting = useStore(tableStore, (state) => state.setSorting);
  const filters = useStore(tableStore, (state) => state.filters);
  const contentRef = useRef<HTMLDivElement>(null);
  const popperId = useId();
  const [filterAnchorElement, setFilterAnchorElement] = useState<HTMLDivElement>();
  const tableCellRef = useRef<TableCellRef>(null);
  const filterLabelIconButtonRef = useRef<HTMLButtonElement>(null);

  const {
    column,
    columnIndex,
    dividerColor,
    height,
    onColumnDividerKeyDown: onColumnDividerKeyDownProp,
    onColumnDividerMouseDown: onColumnDividerMouseDownProp,
    onCustomDrag,
    order,
    width,
    xOffset,
  } = props;

  const ignoreNextClickRef = useRef(false);

  const canDrag = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (column.frozen || column.isStatic) {
      return false;
    }
    if (event.button !== 0) {
      return false;
    }
    return (event.nativeEvent.target as HTMLDivElement).classList.contains(tableHeaderCellClassNames.content);
  }, [column.frozen, column.isStatic]);

  const onCustomDragTableHeaderCell = useCallback((event: TableDragEvent, tableColumn: TableColumn<TRowData, TContext>) => {
    if (onCustomDrag) {
      if (event.type === 'start') {
        ignoreNextClickRef.current = true;
      }
      onCustomDrag(event, tableColumn);
    }
  }, [onCustomDrag]);

  const updateSorting = useCallback(async () => {
    if (sortByField === column.id) {

      await setSorting(column.id, sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    await setSorting(column.id, 'asc');
  }, [column.id, setSorting, sortByField, sortDirection]);

  const onContentClick = useCallback(async (event: ReactMouseEvent<HTMLDivElement>) => {
    if (ignoreNextClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      ignoreNextClickRef.current = false;
      return;
    }

    if (column.comparatorFactory) {
      await updateSorting();
    }
  }, [column.comparatorFactory, updateSorting]);

  const onTableSortClick = useCallback(async (_event: ReactMouseEvent<HTMLButtonElement>) => {
    await updateSorting();
  }, [updateSorting]);

  const onFilterIconClick = useCallback(() => {
    setFilterAnchorElement(el => el ? null : tableCellRef.current);
  }, []);

  const onFilterChange = useCallback(() => {
    setFilterAnchorElement(null);
  }, []);

  const onColumnDividerMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onColumnDividerMouseDownProp(event, column);
  }, [column, onColumnDividerMouseDownProp]);

  const onColumnDividerKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    onColumnDividerKeyDownProp(event, column);
  }, [column, onColumnDividerKeyDownProp]);

  const filter = useMemo(() => {
    return filters.find((f) => f.id === column.id);
  }, [column.id, filters]);

  const hasActiveFilter = useMemo(() => {
    return !!filter && !filter.isInitialFilterValue();
  }, [filter]);

  const onFilterPopOverClose = useCallback(() => {
    setFilterAnchorElement(null);
    // Focus back to the header cell and filter icon button after closing the popover. This must be done in a setTimeout to ensure the popover has closed before focusing.
    setTimeout(() => {
      tableCellRef.current.classList.add(tableHeaderCellClassNamesFocus);
      tableCellRef.current?.focus();
      filterLabelIconButtonRef.current?.focus();
    });
  }, []);

  const hasActiveSorting = sortByField === column.id;

  const tableSortLabelIconProps: TableSortLabelIconProps['ownerState'] = {
    direction: sortByField === column.id ? sortDirection : 'asc',
  };

  const tableSortLabelClassNames = clsx(tableHeaderCellClassNames.sortLabelIcon, {
    [`${tableHeaderCellClassNames.sortLabelIcon}--active`]: hasActiveSorting,
  });

  const tableFilterLabelClassNames = clsx(tableHeaderCellClassNames.filterLabelIcon, {
    [`${tableHeaderCellClassNames.filterLabelIcon}--active`]: hasActiveFilter,
  });

  const shouldShowSortIcon = !!column.comparatorFactory;
  const shouldShowFilterIcon = !!filter;
  const tabIndex = shouldShowSortIcon || shouldShowFilterIcon ? 0 : -1;

  const iconSpacing = +theme.spacing(2).replace('px', '');

  const ariaSortLabel = useMemo((): TableCellProps<TRowData, TContext>['ariaSort'] => {
    if (sortByField !== column.id) {
      return undefined;
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }, [column.id, sortByField, sortDirection]);

  return (
    <TableCell
      ariaSort={ariaSortLabel}
      canDrag={canDrag}
      className={clsx(tableHeaderCellClassNames.root, {
        [tableHeaderCellClassNamesFocus]: !!filterAnchorElement,
      })}
      column={column}
      columnIndex={columnIndex}
      height={height}
      key={column.id}
      onCustomDrag={onCustomDragTableHeaderCell}
      order={order}
      ref={tableCellRef}
      role={'columnheader'}
      sx={{
        [`.${tableHeaderCellClassNames.filterLabelIcon}--active`]: {
          color: theme.palette.secondary.main,
        },
        [`.${tableHeaderCellClassNames.sortLabelIcon}--active, .${tableHeaderCellClassNames.filterLabelIcon}--active`]: {
          display: 'inline-block',
          opacity: '1 !important',
        },
        [`.${tableHeaderCellClassNames.sortLabelIcon}--active`]: {
          color: theme.palette.text.secondary,
        },
        [`&:hover, &:focus-visible, &:focus, &:focus-within, &.${tableHeaderCellClassNamesFocus}`]: {
          [`.${tableHeaderCellClassNames.columnDivider}`]: {
            opacity: 1,
          },
          [`.${tableHeaderCellClassNames.sortLabelIcon}, .${tableHeaderCellClassNames.filterLabelIcon}`]: {
            display: 'inline-block',
            opacity: 0.5,
          },
        },
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'flex-start',
        textAlign: 'left',
      }}
      tabIndex={tabIndex}
      width={width}
      xOffset={xOffset}
    >
      {column.type === 'actions' && (
        <Box
          className={tableHeaderCellClassNames.content}
          sx={visuallyHidden}
        >
          {t`Actions`}
        </Box>
      )}
      {column.type !== 'actions' && (
        <Box
          sx={{
            [`&:hover .${tableHeaderCellClassNames.content}`]: {
              maxWidth: `calc(100% + 16px - ${sum([shouldShowFilterIcon ? iconSpacing : 0, shouldShowSortIcon ? iconSpacing : 0, iconSpacing])}px)`,
            },
            alignItems: 'center',
            display: 'inline-flex',
            width: '100%',
          }}
        >
          {column.renderHeader ? (
            <>
              {column.renderHeader({
                column,
                columnIndex,
                context,
              })}
            </>
          ) : (
            <Tooltip
              arrow
              placement={'top'}
              title={column.headerTooltipContent}
            >

              <Box
                className={tableHeaderCellClassNames.content}
                onClick={onContentClick}
                ref={contentRef}
                sx={{
                  cursor: 'pointer',
                  flexGrow: 1,
                  maxWidth: `calc(100% + 16px - ${sum([hasActiveSorting ? iconSpacing : 0, hasActiveFilter ? iconSpacing : 0, iconSpacing])}px)`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.renderHeaderContent
                  ? column.renderHeaderContent({
                    column,
                    columnIndex,
                    context,
                  })
                  : column.headerName ?? ''}
              </Box>
            </Tooltip>
          )}
          {shouldShowFilterIcon && (
            <>
              <TableFilterLabelIconButton
                className={tableFilterLabelClassNames}
                onClick={onFilterIconClick}
                ref={filterLabelIconButtonRef}
                tabIndex={0}
                title={t('Show filter for {{name}}', { name: column.headerName || t('unknown') })}
              >
                <FilterAltIcon fontSize={'inherit'} />
              </TableFilterLabelIconButton>
              <Popover
                anchorEl={filterAnchorElement}
                anchorOrigin={{
                  horizontal: 'center',
                  vertical: 'bottom',
                }}
                id={popperId}
                onClose={onFilterPopOverClose}
                open={!!filterAnchorElement}
                sx={{
                  zIndex: theme.zIndex.appBar + 1,
                }}
                transformOrigin={{
                  horizontal: 'center',
                  vertical: 'top',
                }}
              >
                <Paper
                  elevation={4}
                  square
                  sx={{
                    padding: theme.spacing(3),
                  }}
                >
                  <TableHeaderFilter
                    filter={filter}
                    onFilterChange={onFilterChange}
                  />
                </Paper>
              </Popover>
            </>
          )}
          {shouldShowSortIcon && (
            <>
              <TableSortLabelIconButton
                className={tableSortLabelClassNames}
                onClick={onTableSortClick}
                ownerState={tableSortLabelIconProps}
                tabIndex={0}
                title={t('Toggle sorting for {{name}}', { name: column.headerName || t('unknown') })}
              >
                <ArrowDownwardIcon fontSize={'inherit'} />
              </TableSortLabelIconButton>
            </>
          )}
          {column.resizable !== false && (
            <Box
              aria-label={t('Resize column {{name}}, use arrow keys to adjust the size.', { name: column.headerName || t('unknown') })}
              className={tableHeaderCellClassNames.columnDivider}
              onKeyDown={onColumnDividerKeyDown}
              onMouseDown={onColumnDividerMouseDown}
              role={'separator'}
              sx={{
                '&:focus-visible, &:focus, &:focus-within': {
                  borderColor: theme.palette.primary.main,
                  opacity: 1,
                },
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  opacity: 1,
                },
                borderRight: `1px solid ${dividerColor}`,
                boxSizing: 'border-box',
                cursor: 'col-resize',
                height: '18px',
                opacity: 0,
                position: 'absolute',

                right: 0,
                width: '7px',
              }}
              tabIndex={0}
            />
          )}
        </Box>
      )}
    </TableCell>
  );
};
