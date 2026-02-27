import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import { Checkbox } from '@mui/material';
import { useTranslation } from 'react-i18next';
import uniq from 'lodash/uniq';
import {
  useCallback,
  type ChangeEvent,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type {
  TableColumnParams,
  TableColumnSelectable,
} from '../../../models/table';
import { useTableStoreContext } from '../../../stores/tableStore';


export type TableCheckboxHeaderProps<TRowData> = {
  readonly tableColumnParams: TableColumnParams<TRowData>;
};

export const TableCheckboxHeader = <TRowData, >({ tableColumnParams }: TableCheckboxHeaderProps<TRowData>) => {
  const { t } = useTranslation();

  const column = tableColumnParams.column as TableColumnSelectable<TRowData>;

  const tableStore = useTableStoreContext<TRowData>();
  const idSelectorCallback = useStore(tableStore, useShallow((state) => state.idSelectorCallback));
  const selectedIds = useStore(tableStore, useShallow((state) => state.selectedIds));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));


  const enabledRows = column.isDisabled ? sortedData.filter(row => column.isDisabled({
    id: idSelectorCallback(row),
    row,
    rowIndex: sortedData.indexOf(row),
  }) === false) : sortedData;

  const isAllChecked = enabledRows.every(row => selectedIds.includes(idSelectorCallback(row)));
  const isSomeChecked = enabledRows.some(row => selectedIds.includes(idSelectorCallback(row)));

  const onChange = useCallback((_event: ChangeEvent<HTMLInputElement>) => {
    const visibleRowIds = enabledRows.map(r => idSelectorCallback(r));
    if (isAllChecked) {
      // all visible rows are selected, unselect all visible rows
      setSelectedIds(selectedIds.filter(s => !visibleRowIds.includes(s)));
    } else {
      // not all visible rows are selected, select them
      setSelectedIds(uniq([...selectedIds, ...visibleRowIds]));
    }
  }, [enabledRows, idSelectorCallback, isAllChecked, selectedIds, setSelectedIds]);

  return (
    <Checkbox
      checked={isSomeChecked}
      slotProps={{
        input: {
          'aria-label': t`Select all`,
        },
      }}
      checkedIcon={isAllChecked ? undefined : <IndeterminateCheckBoxIcon />}
      name={'select-all'}
      sx={{
        padding: 0,
        marginTop: '-2px',
      }}
      onChange={onChange}
    />
  );
};
