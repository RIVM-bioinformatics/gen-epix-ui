import {
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type ChangeEvent,
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


export type TableCheckboxCellProps<TRowData> = {
  readonly cell: TableRowParams<TRowData>;
  readonly tableColumn: TableColumnSelectable<TRowData>;
};

export const TableCheckboxCell = <TRowData, >({
  cell,
  tableColumn,
}: TableCheckboxCellProps<TRowData>) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<TRowData>();
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
      name={idSelectorCallback(cell.row)}
      slotProps={{
        input: {
          'aria-label': t`Select row`,
        },
      }}
      sx={{
        padding: 0,
        marginTop: '-2px',
      }}
      disabled={tableColumn.isDisabled ? tableColumn.isDisabled(cell) : false}
      onClick={onClick}
      onChange={onChange}
    />
  );
};
