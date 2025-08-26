import {
  Tooltip,
  Box,
  styled,
  Popper,
  ClickAwayListener,
  Paper,
  useTheme,
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
import type { TableColumn } from '../../../models/table';
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

const TableSortLabelIcon = styled(ArrowDownwardIcon, {
  name: 'GENEPIX-TableSortLabelIcon',
})<TableSortLabelIconProps>(({ theme, ownerState }) => {
  return {
    cursor: 'pointer',
    fontSize: 18,
    display: 'none',
    userSelect: 'none',
    transition: theme.transitions.create(['opacity', 'transform'], {
      duration: theme.transitions.duration.shorter,
    }),
    opacity: 0,
    color: theme.palette.text.primary,
    ...(ownerState.direction === 'desc' && {
      transform: 'rotate(0deg)',
    }),
    ...(ownerState.direction === 'asc' && {
      transform: 'rotate(180deg)',
    }),
    '&:hover': {
      opacity: '1 !important',
      color: theme.palette.primary.main,
    },
  };
});

const TableFilterLabelIcon = styled(FilterAltIcon, {
  name: 'GENEPIX-TableFilterLabelIcon',
})(({ theme }) => {
  return {
    cursor: 'pointer',
    display: 'none',
    fontSize: 18,
    userSelect: 'none',
    opacity: 0,
    '&:hover': {
      opacity: '1 !important',
      color: theme.palette.primary.main,
    },
  };
});

export const TableHeaderCell = <TRowData,>(props: TableHeaderCellProps<TRowData>) => {
  const [t] = useTranslation();
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

  const {
    column,
    height,
    width,
    xOffset,
    columnIndex,
    onColumnDividerMouseDown: onColumnDividerMouseDownProp,
    dividerColor,
    onDragCapture,
    onDragEnd,
    onDragStart,
    order,
  } = props;

  const updateSorting = useCallback(async () => {
    if (sortByField === column.id) {

      await setSorting(column.id, sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    await setSorting(column.id, 'asc');
  }, [column.id, setSorting, sortByField, sortDirection]);

  const onContentClick = useCallback(async () => {
    if (column.comparatorFactory) {
      await updateSorting();
    }
  }, [column.comparatorFactory, updateSorting]);

  const onTableSortClick = useCallback(async () => {
    await updateSorting();
  }, [updateSorting]);

  const onFilterIconClick = useCallback(() => {
    setFilterAnchorElement(el => el ? null : tableCellRef.current);
  }, []);

  const onFilterChange = useCallback(() => {
    setFilterAnchorElement(null);
  }, []);

  const onFilterIconClickAway = useCallback(() => {
    setFilterAnchorElement(null);
  }, []);

  const onColumnDividerMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    onColumnDividerMouseDownProp(event, column);
  }, [column, onColumnDividerMouseDownProp]);

  const filter = useMemo(() => {
    return filters.find((f) => f.id === column.id);
  }, [column.id, filters]);

  const hasActiveFilter = useMemo(() => {
    return !!filter && !filter.isInitialFilterValue();
  }, [filter]);

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

  const iconSpacing = +theme.spacing(2).replace('px', '');

  return (
    <TableCell
      className={tableHeaderCellClassNames.root}
      column={column}
      columnIndex={columnIndex}
      draggable={!column.frozen && !column.isStatic}
      height={height}
      key={column.id}
      onDragCapture={onDragCapture}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      order={order}
      ref={tableCellRef}
      role={'columnheader'}
      sx={{
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
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
        <ClickAwayListener
          mouseEvent={'onMouseDown'}
          onClickAway={onFilterIconClickAway}
        >
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
            <Tooltip
              arrow
              placement={'top'}
              title={column.headerTooltipContent}
            >

              <Box
                className={'GENEPIX-TableHeaderCell-content'}
                onClick={onContentClick}
                ref={contentRef}
                sx={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: `calc(100% + 16px - ${sum([hasActiveSorting ? iconSpacing : 0, hasActiveFilter ? iconSpacing : 0, iconSpacing])}px)`,
                  flexGrow: 1,
                }}
              >
                {column.renderHeader
                  ? column.renderHeader({
                    columnIndex,
                    column,
                  })
                  : column.headerName ?? ''}
              </Box>

            </Tooltip>
            {shouldShowFilterIcon && (
              <>
                <TableFilterLabelIcon
                  className={tableFilterLabelClassNames}
                  onClick={onFilterIconClick}
                />

                <Popper
                  anchorEl={filterAnchorElement}
                  id={popperId}
                  open={!!filterAnchorElement}
                  placement={'bottom-start'}
                  sx={{
                    zIndex: 1,
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
                </Popper>
              </>
            )}
            {shouldShowSortIcon && (
              <>
                <TableSortLabelIcon
                  className={tableSortLabelClassNames}
                  onClick={onTableSortClick}
                  ownerState={tableSortLabelIconProps}
                />
                {sortByField === column.id && (
                  <Box
                    component={'span'}
                    sx={visuallyHidden}
                  >
                    {sortDirection === 'desc' ? t`sorted descending` : t`sorted ascending`}
                  </Box>
                )}
              </>
            )}
            {column.resizable !== false && (
              <Box
                className={tableHeaderCellClassNames.columnDivider}
                onMouseDown={onColumnDividerMouseDown}
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
              />
            )}
          </Box>
        </ClickAwayListener>
      )}
    </TableCell>
  );
};
