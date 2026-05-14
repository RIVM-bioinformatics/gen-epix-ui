import { Button } from '@mui/material';
import { useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import type {
  TableColumnReadableIndex,
  TableRowParams,
} from '../../../models/table';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';

export type TableReadableIndexCellProps<TRowData, TDataContext> = {
  readonly cell: TableRowParams<TRowData, TDataContext>;
  readonly getRowName?: (row: TRowData) => string;
  readonly onReadableIndexClick: (row: TRowData) => void;
  readonly tableColumn: TableColumnReadableIndex<TRowData, TDataContext>;
};

export const TableReadableIndexCell = <TRowData, TDataContext>({
  cell,
  getRowName,
  onReadableIndexClick,
  tableColumn,
}: TableReadableIndexCellProps<TRowData, TDataContext>) => {
  const onClick = useCallback((event: ReactMouseEvent) => {
    if (onReadableIndexClick) {
      if (!getRowName) {
        throw new Error('getRowName is required when onReadableIndexClick is provided');
      }
      if (ConfigManager.getInstance().config.enablePageEvents) {
        PageEventBusManager.getInstance().emit('click', {
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
