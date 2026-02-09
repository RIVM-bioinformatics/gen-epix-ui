import {
  Tooltip,
  Box,
  styled,
  Paper,
  useTheme,
  IconButton,
  Popover,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type { MouseEvent as ReactMouseEvent } from 'react';
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

import { tableHeaderCellClassNames } from '../../../data/table';
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

export interface TableHeaderCellProps<TRowData> extends TableCellProps<TRowData> {
  readonly onColumnDividerMouseDown: (event: ReactMouseEvent<HTMLDivElement>, column: TableColumn<TRowData>) => void;
  readonly dividerColor: string;
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
})<TableSortLabelIconProps>(({ theme, ownerState }) => {
  return {
    padding: 0,
    fontSize: iconSize,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    display: 'none',
    opacity: 0,
    userSelect: 'none',
    color: theme.palette.text.primary,
    '&:hover': {
      opacity: '1 !important',
      color: theme.palette.primary.main,
    },
    '& svg': {
      ...(ownerState.direction === 'desc' && {
        transform: 'rotate(0deg)',
      }),
      ...(ownerState.direction === 'asc' && {
        transform: 'rotate(180deg)',
      }),
    },
  };
});

const TableFilterLabelIconButton = styled(IconButton, {
  name: 'GENEPIX-TableFilterLabelIcon',
})(({ theme }) => {
  return {
    fontSize: iconSize,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    padding: 0,
    display: 'none',
    opacity: 0,
    userSelect: 'none',
    '&:hover': {
      opacity: '1 !important',
      color: theme.palette.primary.main,
    },
  };
});

export const TableHeaderCell = <TRowData,>(props: TableHeaderCellProps<TRowData>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const tableStore = useTableStoreContext<TRowData>();
  const sortByField = useStore(tableStore, (state) => state.sortByField);
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
    onColumnDividerMouseDown: onColumnDividerMouseDownProp,
    onCustomDrag,
    order,
    width,
    xOffset,
  } = props;

  const ignoreNextClick = useRef(false);

  const onCustomDragTableHeaderCell = useCallback((event: TableDragEvent, col: TableColumn<TRowData>) => {
    if (onCustomDrag) {
      if (event.type === 'start') {
        ignoreNextClick.current = true;
      }
      onCustomDrag(event, col);
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
    if (ignoreNextClick.current) {
      event.preventDefault();
      event.stopPropagation();
      ignoreNextClick.current = false;
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

  const tableSortLabelClassNames = clsx('TableSortLabelIcon', {
    'TableSortLabelIcon--active': hasActiveSorting,
  });

  const tableFilterLabelClassNames = clsx('TableFilterLabelIcon', {
    'TableFilterLabelIcon--active': hasActiveFilter,
  });

  const shouldShowSortIcon = !!column.comparatorFactory;
  const shouldShowFilterIcon = !!filter;
  const tabIndex = shouldShowSortIcon || shouldShowFilterIcon ? 0 : -1;

  const iconSpacing = +theme.spacing(2).replace('px', '');

  const ariaSortLabel = useMemo((): TableCellProps<TRowData>['ariaSort'] => {
    if (sortByField !== column.id) {
      return undefined;
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }, [column.id, sortByField, sortDirection]);

  return (
    <TableCell
      key={column.id}
      ref={tableCellRef}
      ariaSort={ariaSortLabel}
      className={clsx(tableHeaderCellClassNames.root, {
        [tableHeaderCellClassNamesFocus]: !!filterAnchorElement,
      })}
      column={column}
      columnIndex={columnIndex}
      draggable={!column.frozen && !column.isStatic}
      height={height}
      order={order}
      role={'columnheader'}
      tabIndex={tabIndex}
      sx={{
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: theme.palette.background.paper,
        [`&:hover, &:focus-visible, &:focus, &:focus-within, &.${tableHeaderCellClassNamesFocus}`]: {
          '.TableSortLabelIcon, .TableFilterLabelIcon': {
            display: 'inline-block',
            opacity: 0.5,
          },
        },
        '.TableSortLabelIcon--active, .TableFilterLabelIcon--active': {
          display: 'inline-block',
          opacity: '1 !important',
        },
        '.TableSortLabelIcon--active': {
          color: theme.palette.text.secondary,
        },
        '.TableFilterLabelIcon--active': {
          color: theme.palette.secondary.main,
        },
      }}
      width={width}
      xOffset={xOffset}
      onCustomDrag={onCustomDragTableHeaderCell}
    >
      {column.type === 'actions' && (
        <Box
          className={'GENEPIX-TableHeaderCell-content'}
          sx={visuallyHidden}
        >
          {t`Actions`}
        </Box>
      )}
      {column.type !== 'actions' && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            '&:hover .GENEPIX-TableHeaderCell-content': {
              maxWidth: `calc(100% + 16px - ${sum([shouldShowFilterIcon ? iconSpacing : 0, shouldShowSortIcon ? iconSpacing : 0, iconSpacing])}px)`,
            },
            width: '100%',
          }}
        >
          {column.renderHeader ? (
            <>
              {column.renderHeader({
                columnIndex,
                column,
              })}
            </>
          ) : (
            <Tooltip
              arrow
              placement={'top'}
              title={column.headerTooltipContent}
            >

              <Box
                ref={contentRef}
                className={'GENEPIX-TableHeaderCell-content'}
                sx={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: `calc(100% + 16px - ${sum([hasActiveSorting ? iconSpacing : 0, hasActiveFilter ? iconSpacing : 0, iconSpacing])}px)`,
                  flexGrow: 1,
                }}
                onClick={onContentClick}
              >
                {column.renderHeaderContent
                  ? column.renderHeaderContent({
                    columnIndex,
                    column,
                  })
                  : column.headerName ?? ''}
              </Box>
            </Tooltip>
          )}
          {shouldShowFilterIcon && (
            <>
              <TableFilterLabelIconButton
                ref={filterLabelIconButtonRef}
                className={tableFilterLabelClassNames}
                tabIndex={0}
                title={t('Show filter for {{name}}', { name: column.headerName || t('unknown') })}
                onClick={onFilterIconClick}
              >
                <FilterAltIcon fontSize={'inherit'} />
              </TableFilterLabelIconButton>
              <Popover
                anchorEl={filterAnchorElement}
                id={popperId}
                open={!!filterAnchorElement}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                sx={{
                  zIndex: 1,
                }}
                onClose={onFilterPopOverClose}
              >
                <Paper
                  square
                  elevation={4}
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
                tabIndex={0}
                title={t('Toggle sorting for {{name}}', { name: column.headerName || t('unknown') })}
                className={tableSortLabelClassNames}
                ownerState={tableSortLabelIconProps}
                onClick={onTableSortClick}
              >
                <ArrowDownwardIcon fontSize={'inherit'} />
              </TableSortLabelIconButton>
            </>
          )}
          {column.resizable !== false && (
            <Box
              className={tableHeaderCellClassNames.columnDivider}
              sx={{
                width: '7px',
                height: '18px',
                position: 'absolute',
                right: 0,
                cursor: 'col-resize',
                borderRight: `1px solid ${dividerColor}`,
                boxSizing: 'border-box',
                opacity: 0,
              }}
              onMouseDown={onColumnDividerMouseDown}
            />
          )}
        </Box>
      )}
    </TableCell>
  );
};
