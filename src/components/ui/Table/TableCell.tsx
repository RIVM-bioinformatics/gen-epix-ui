import {
  useTheme,
  Box,
} from '@mui/material';
import type {
  ForwardedRef,
  MouseEvent as ReactMouseEvent,
  AriaRole,
  PropsWithChildren,
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

export type TableCellProps<TRowData> = PropsWithChildren<{
  readonly className?: string;
  readonly column: TableColumn<TRowData>;
  readonly columnIndex: number;
  readonly draggable?: boolean;
  readonly enabled?: boolean;
  readonly height: string;
  readonly onClick?: (row: TableRowParams<TRowData>, event?: MouseEvent) => void;
  readonly role?: AriaRole;
  readonly row?: TRowData;
  readonly rowIndex?: number;
  readonly sx?: SxProps<Theme>;
  readonly title?: string;
  readonly width: number;
  readonly xOffset?: number;
  readonly onCustomDrag?: (event: TableDragEvent, column: TableColumn<TRowData>) => void;
  readonly order: number;
  readonly ref?: ForwardedRef<TableCellRef>;
}>;

export type TableCellRef = HTMLDivElement;

export const TableCell = <TRowData, >({
  children,
  className,
  column,
  columnIndex,
  draggable,
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
  title,
  width,
  xOffset,
}: TableCellProps<TRowData>) => {
  const theme = useTheme();
  const onTableCellClick = useCallback((event: ReactMouseEvent) => {
    onClick({ row, id: column.id, rowIndex }, event.nativeEvent);
  }, [column.id, onClick, row, rowIndex]);
  const dragPosition = useRef<{ x: number; y: number; target: HTMLDivElement } | null>(null);

  const onMouseDown = useCallback((mouseDownEvent: ReactMouseEvent<HTMLDivElement>) => {
    if (!onCustomDrag || !draggable) {
      return;
    }

    const target = mouseDownEvent.currentTarget as HTMLDivElement;
    const elementWidth = target.getBoundingClientRect().width;
    const elementOffsetX = mouseDownEvent.clientX - target.getBoundingClientRect().left;

    const eventBase = {
      target, elementOffsetX, elementWidth,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragPosition.current) {
        dragPosition.current = { x: mouseDownEvent.clientX, y: mouseDownEvent.clientY, target };
        onCustomDrag({ deltaX: 0, deltaY: 0, clientX: mouseDownEvent.clientX, clientY: mouseDownEvent.clientY, type: 'start', ...eventBase }, column);
      }

      const deltaX = moveEvent.clientX - dragPosition.current.x;
      const deltaY = moveEvent.clientY - dragPosition.current.y;
      onCustomDrag({ deltaX, deltaY, clientX: moveEvent.clientX, clientY: moveEvent.clientY, type: 'move', ...eventBase }, column);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      if (dragPosition.current) {
        const deltaX = upEvent.clientX - dragPosition.current.x;
        const deltaY = upEvent.clientY - dragPosition.current.y;
        onCustomDrag({ deltaX, deltaY, clientX: upEvent.clientX, clientY: upEvent.clientY, type: 'end', ...eventBase }, column);
      }
      dragPosition.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mouseup', onMouseUp, {
      once: true,
    });
    document.addEventListener('mousemove', onMouseMove);
  }, [onCustomDrag, draggable, column]);


  const isMovable = column.isStatic !== true && column.frozen !== true;

  const getCellStyles = useCallback((): SxProps<Theme> => {
    return {
      overflow: 'hidden',
      whiteSpace: column.disableEllipsis ? undefined : 'nowrap',
      textOverflow: column.disableEllipsis ? undefined : 'ellipsis',
      width: `${width}px`,
      textAlign: column.textAlign ?? 'left',
      lineHeight: height,
      position: column.frozen ? 'sticky' : 'relative',
      background: column.frozen ? theme.palette.background.paper : undefined,
      zIndex: column.frozen ? 1 : 0,
      left: column.frozen ? `${xOffset || '0'}px` : undefined,
      paddingRight: '8px',
      paddingLeft: '8px',
      boxSizing: 'border-box',
      order,
      ...sx,
    };
  }, [column.disableEllipsis, column.frozen, column.textAlign, height, order, sx, theme.palette.background.paper, width, xOffset]);

  return (
    <Box
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
      title={title}
    >
      {children}
    </Box>
  );
};
