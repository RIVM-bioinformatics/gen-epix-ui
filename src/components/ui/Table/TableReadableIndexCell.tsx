import { Button } from '@mui/material';
import {
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import type {
  TableColumnReadableIndex,
  TableRowParams,
} from '../../../models/table';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';

export type TableReadableIndexCellProps<TRowData> = {
  readonly tableColumn: TableColumnReadableIndex<TRowData>;
  readonly cell: TableRowParams<TRowData>;
  readonly onReadableIndexClick: (row: TRowData) => void;
  readonly getRowName?: (row: TRowData) => string;
};

export const TableReadableIndexCell = <TRowData, >({
  tableColumn,
  cell,
  onReadableIndexClick,
  getRowName,
}: TableReadableIndexCellProps<TRowData>) => {
  const onClick = useCallback((event: ReactMouseEvent) => {
    if (onReadableIndexClick) {
      if (!getRowName) {
        throw new Error('getRowName is required when onReadableIndexClick is provided');
      }
      if (ConfigManager.instance.config.enablePageEvents) {
        PageEventBusManager.instance.emit('click', {
          label: getRowName(cell.row),
          type: 'table-row-index',
        });
      }
      event.preventDefault();
      event.stopPropagation();
      onReadableIndexClick(cell.row);
    }
  }, [getRowName, onReadableIndexClick, cell.row]);

  if (!onReadableIndexClick) {
    return cell.rowIndex + 1;
  }

  return (
    <Button
      variant={'text'}
      size={'small'}
      aria-label={tableColumn.getAriaLabel(cell)}
      color={'primary'}
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 'unset',
        padding: 0,
      }}
      onClick={onClick}
    >
      {cell.rowIndex + 1}
    </Button>
  );
};
