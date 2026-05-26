import {
  Box,
  useTheme,
} from '@mui/material';
import type {
  AriaRole,
  ForwardedRef,
  PropsWithChildren,
  MouseEvent as ReactMouseEvent,
} from 'react';
import {
  useCallback,
  useRef,
} from 'react';
import type {
  SxProps,
  Theme,
} from '@mui/material';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { TABLE_COLUMN_FROZEN } from '../../../models/table';
import type {
  TableColumn,
  TableDragEvent,
  TableRowParams,
} from '../../../models/table';
import { useTableStoreContext } from '../../../stores/tableStore';

export type TableCellProps<TRowData, TDataContext = null> = PropsWithChildren<{
  readonly ariaSort?: 'ascending' | 'descending' | 'other';
  readonly backgroundColor?: string;
  readonly canDrag?: (event: ReactMouseEvent<HTMLDivElement>) => boolean;
  readonly className?: string;
  readonly column: TableColumn<TRowData, TDataContext>;
  readonly columnIndex: number;
  readonly enabled?: boolean;
  readonly height: string;
  readonly onClick?: (row: TableRowParams<TRowData, TDataContext>, event?: MouseEvent) => void;
  readonly onCustomDrag?: (event: TableDragEvent, column: TableColumn<TRowData, TDataContext>) => void;
  readonly order: number;
  readonly ref?: ForwardedRef<TableCellRef>;
  readonly role?: AriaRole;
  readonly row?: TRowData;
  readonly rowIndex?: number;
  readonly sx?: SxProps<Theme>;
  readonly tabIndex?: number;
  readonly title?: string;
  readonly width: number;
  readonly xOffset?: number;
}>;

export type TableCellRef = HTMLDivElement;

// Cache for contrast colors to avoid recalculating them on every render for the same background color.
// The list of background colors is expected to be limited, so this should not grow indefinitely.
const contrastColorCache: Record<string, string> = {};

export const TableCell = <TRowData, TDataContext = null>({
  ariaSort,
  backgroundColor,
  canDrag,
  children,
  className,
  column,
  columnIndex,
  enabled,
  height,
  onClick,
  onCustomDrag,
  order,
  ref,
  role,
  row,
  rowIndex,
  sx,
  tabIndex,
  title,
  width,
  xOffset,
}: TableCellProps<TRowData, TDataContext>) => {
  const theme = useTheme();
  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const dataContext = useStore(tableStore, useShallow((state) => state.dataContext));

  const onTableCellClick = useCallback((event: ReactMouseEvent) => {
    onClick({ dataContext, id: column.id, row, rowIndex }, event.nativeEvent);
  }, [column.id, dataContext, onClick, row, rowIndex]);
  const dragPositionRef = useRef<{ target: HTMLDivElement; x: number; y: number } | null>(null);

  const onMouseDown = useCallback((mouseDownEvent: ReactMouseEvent<HTMLDivElement>) => {
    if (!onCustomDrag || (canDrag && !canDrag(mouseDownEvent))) {
      return;
    }

    const target = mouseDownEvent.currentTarget;
    const elementWidth = target.getBoundingClientRect().width;
    const elementOffsetX = mouseDownEvent.clientX - target.getBoundingClientRect().left;

    const eventBase = {
      elementOffsetX, elementWidth, target,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragPositionRef.current) {
        dragPositionRef.current = { target, x: mouseDownEvent.clientX, y: mouseDownEvent.clientY };
        onCustomDrag({ clientX: mouseDownEvent.clientX, clientY: mouseDownEvent.clientY, deltaX: 0, deltaY: 0, type: 'start', ...eventBase }, column);
      }

      const deltaX = moveEvent.clientX - dragPositionRef.current.x;
      const deltaY = moveEvent.clientY - dragPositionRef.current.y;
      onCustomDrag({ clientX: moveEvent.clientX, clientY: moveEvent.clientY, deltaX, deltaY, type: 'move', ...eventBase }, column);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      if (dragPositionRef.current) {
        const deltaX = upEvent.clientX - dragPositionRef.current.x;
        const deltaY = upEvent.clientY - dragPositionRef.current.y;
        onCustomDrag({ clientX: upEvent.clientX, clientY: upEvent.clientY, deltaX, deltaY, type: 'end', ...eventBase }, column);
      }
      dragPositionRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mouseup', onMouseUp, {
      once: true,
    });
    document.addEventListener('mousemove', onMouseMove);
  }, [onCustomDrag, canDrag, column]);


  const isMovable = !column.frozen;

  const getCellStyles = useCallback((): SxProps<Theme> => {
    const isFrozenLeft = column.frozen === TABLE_COLUMN_FROZEN.LEFT;
    const isFrozenRight = column.frozen === TABLE_COLUMN_FROZEN.RIGHT;
    const isFrozen = isFrozenLeft || isFrozenRight;
    let color: string | undefined;
    if (backgroundColor) {
      if (contrastColorCache[backgroundColor]) {
        color = contrastColorCache[backgroundColor];
      } else {
        color = theme.palette.getContrastText(backgroundColor);
        contrastColorCache[backgroundColor] = color;
      }
    }
    return {
      '*': backgroundColor ?? {
        color: color ? `${color} !important` : undefined,
      },
      background: isFrozen ? theme.palette.background.paper : backgroundColor,
      boxSizing: 'border-box',
      color,
      left: isFrozenLeft ? `${xOffset ?? 0}px` : undefined,
      lineHeight: height,
      order,
      overflow: 'hidden',
      paddingLeft: '8px',
      paddingRight: '8px',
      position: isFrozen ? 'sticky' : 'relative',
      right: isFrozenRight ? `${xOffset ?? 0}px` : undefined,
      textAlign: column.textAlign ?? 'left',
      textOverflow: column.disableEllipsis ? undefined : 'ellipsis',
      whiteSpace: column.disableEllipsis ? undefined : 'nowrap',
      width: `${width}px`,
      zIndex: isFrozen ? 1 : 0,
      ...sx,
    };
  }, [backgroundColor, column.disableEllipsis, column.frozen, column.textAlign, height, order, sx, theme.palette, width, xOffset]);

  return (
    <Box
      aria-sort={ariaSort}
      className={className}
      data-column-index={columnIndex}
      data-frozen={column.frozen ? 1 : 0}
      data-id={column.id}
      data-row-index={rowIndex ?? ''}
      onClick={onClick && enabled ? onTableCellClick : undefined}
      onMouseDown={isMovable && onCustomDrag ? onMouseDown : undefined}
      ref={ref}
      role={role ?? 'cell'}
      sx={getCellStyles()}
      tabIndex={tabIndex}
      title={title}
    >
      {children}
    </Box>
  );
};
