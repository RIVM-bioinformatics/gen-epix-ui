import { Button } from '@mui/material';
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
} from 'react';

import type {
  TableColumnReadableIndex,
  TableRowParams,
} from '../../../models/table';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';

export type TableReadableIndexCellProps<TRowData> = {
  readonly cell: TableRowParams<TRowData>;
  readonly getRowName?: (row: TRowData) => string;
  readonly onReadableIndexClick: (row: TRowData) => void;
  readonly tableColumn: TableColumnReadableIndex<TRowData>;
};

export const TableReadableIndexCell = <TRowData, >({
  cell,
  getRowName,
  onReadableIndexClick,
  tableColumn,
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
      aria-label={tableColumn.getAriaLabel(cell)}
      color={'primary'}
      onClick={onClick}
      size={'small'}
      sx={{
        height: '100%',
        minWidth: 'unset',
        padding: 0,
        width: '100%',
      }}
      variant={'text'}
    >
      {cell.rowIndex + 1}
    </Button>
  );
};
