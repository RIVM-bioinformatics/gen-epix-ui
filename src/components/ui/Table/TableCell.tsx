import {
  useTheme,
  Box,
} from '@mui/material';
import type {
  ForwardedRef,
  MouseEvent as ReactMouseEvent,
  AriaRole,
  PropsWithChildren,
  DragEvent,
} from 'react';
import { useCallback } from 'react';
import type {
  SxProps,
  Theme,
} from '@mui/material';

import type {
  TableColumn,
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

  readonly onDragStart?: (event: DragEvent<HTMLDivElement>, column: TableColumn<TRowData>) => void;
  readonly onDragEnd?: (event: DragEvent<HTMLDivElement>, column: TableColumn<TRowData>) => void;
  readonly onDragCapture?: (event: DragEvent<HTMLDivElement>, column: TableColumn<TRowData>) => void;
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
  role,
  row,
  rowIndex,
  sx,
  title,
  width,
  xOffset,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  onDragCapture: onDragCaptureProp,
  order,
  ref,
}: TableCellProps<TRowData>) => {
  const theme = useTheme();
  const onTableCellClick = useCallback((event: ReactMouseEvent) => {
    onClick({ row, id: column.id, rowIndex }, event.nativeEvent);
  }, [column.id, onClick, row, rowIndex]);

  const onDragCapture = useCallback((event: DragEvent<HTMLDivElement>) => {
    onDragCaptureProp(event, column);
  }, [onDragCaptureProp, column]);

  const onDragEnd = useCallback((event: DragEvent<HTMLDivElement>) => {
    onDragEndProp(event, column);
  }, [onDragEndProp, column]);

  const onDragStart = useCallback((event: DragEvent<HTMLDivElement>) => {
    onDragStartProp(event, column);
  }, [onDragStartProp, column]);

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
      draggable={draggable}
      onClick={onClick && enabled ? onTableCellClick : undefined}
      onDragCapture={isMovable && onDragCaptureProp ? onDragCapture : undefined}
      onDragEnd={isMovable && onDragEndProp ? onDragEnd : undefined}
      onDragStart={isMovable && onDragStartProp ? onDragStart : undefined}
      ref={ref}
      role={role ?? 'cell'}
      sx={getCellStyles()}
      title={title}
    >
      {children}
    </Box>
  );
};
