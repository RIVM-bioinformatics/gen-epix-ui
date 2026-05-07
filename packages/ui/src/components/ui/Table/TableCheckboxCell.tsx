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


export type TableCheckboxCellProps<TRowData, TDataContext = null> = {
  readonly cell: TableRowParams<TRowData, TDataContext>;
  readonly tableColumn: TableColumnSelectable<TRowData, TDataContext>;
};

export const TableCheckboxCell = <TRowData, TDataContext = null>({
  cell,
  tableColumn,
}: TableCheckboxCellProps<TRowData, TDataContext>) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<TRowData, TDataContext>();
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
