import {
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
} from 'react';
import { Checkbox } from '@mui/material';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';

import { useTableStoreContext } from '../../../stores/tableStore';
import type {
  TableColumnSelectable,
  TableRowParams,
} from '../../../models/table';


export type TableCheckboxCellProps<TRowData, TContext> = {
  readonly cell: TableRowParams<TRowData, TContext>;
  readonly tableColumn: TableColumnSelectable<TRowData, TContext>;
};

export const TableCheckboxCell = <TRowData, TContext>({
  cell,
  tableColumn,
}: TableCheckboxCellProps<TRowData, TContext>) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<TRowData, TContext>();
  const idSelectorCallback = useStore(tableStore, useShallow((state) => state.idSelectorCallback));
  const selectedIds = useStore(tableStore, useShallow((state) => state.selectedIds));
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));

  const id = idSelectorCallback(cell.row);
  const onClick = useCallback((event: ReactMouseEvent) => {
    event.stopPropagation();
  }, []);

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const rowId = event.target.getAttribute('name');
    if (checked && !selectedIds.includes(rowId)) {
      setSelectedIds([...selectedIds, rowId]);
    } else if (!checked) {
      setSelectedIds([...selectedIds].filter(x => x !== rowId));
    }
  }, [selectedIds, setSelectedIds]);

  return (
    <Checkbox
      checked={selectedIds.includes(id)}
      disabled={tableColumn.isDisabled ? tableColumn.isDisabled(cell) : false}
      name={idSelectorCallback(cell.row)}
      onChange={onChange}
      onClick={onClick}
      slotProps={{
        input: {
          'aria-label': t`Select row`,
        },
      }}
      sx={{
        marginTop: '-2px',
        padding: 0,
      }}
    />
  );
};
