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

import type {
  TableColumn,
  TableDragEvent,
  TableRowParams,
} from '../../../models/table';

export type TableCellProps<TRowData, TContext> = PropsWithChildren<{
  readonly ariaSort?: 'ascending' | 'descending' | 'other';
  readonly canDrag?: (event: ReactMouseEvent<HTMLDivElement>) => boolean;
  readonly className?: string;
  readonly column: TableColumn<TRowData, TContext>;
  readonly columnIndex: number;
  readonly enabled?: boolean;
  readonly height: string;
  readonly onClick?: (row: TableRowParams<TRowData, TContext>, event?: MouseEvent) => void;
  readonly onCustomDrag?: (event: TableDragEvent, column: TableColumn<TRowData, TContext>) => void;
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

export const TableCell = <TRowData, TContext>({
  ariaSort,
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
}: TableCellProps<TRowData, TContext>) => {
  const theme = useTheme();
  const onTableCellClick = useCallback((event: ReactMouseEvent) => {
    onClick({ id: column.id, row, rowIndex }, event.nativeEvent);
  }, [column.id, onClick, row, rowIndex]);
  const dragPositionRef = useRef<{ target: HTMLDivElement; x: number; y: number } | null>(null);

  const onMouseDown = useCallback((mouseDownEvent: ReactMouseEvent<HTMLDivElement>) => {
    if (!onCustomDrag || (canDrag && !canDrag(mouseDownEvent))) {
      return;
    }

    const target = mouseDownEvent.currentTarget as HTMLDivElement;
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


  const isMovable = column.isStatic !== true && column.frozen !== true;

  const getCellStyles = useCallback((): SxProps<Theme> => {
    return {
      background: column.frozen ? theme.palette.background.paper : undefined,
      boxSizing: 'border-box',
      left: column.frozen ? `${xOffset || '0'}px` : undefined,
      lineHeight: height,
      order,
      overflow: 'hidden',
      paddingLeft: '8px',
      paddingRight: '8px',
      position: column.frozen ? 'sticky' : 'relative',
      textAlign: column.textAlign ?? 'left',
      textOverflow: column.disableEllipsis ? undefined : 'ellipsis',
      whiteSpace: column.disableEllipsis ? undefined : 'nowrap',
      width: `${width}px`,
      zIndex: column.frozen ? 1 : 0,
      ...sx,
    };
  }, [column.disableEllipsis, column.frozen, column.textAlign, height, order, sx, theme.palette.background.paper, width, xOffset]);

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
