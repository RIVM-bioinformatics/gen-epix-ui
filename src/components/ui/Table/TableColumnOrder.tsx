import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Box } from '@mui/material';
import type { UniqueIdentifier } from '@dnd-kit/core';

import { useTableStoreContext } from '../../../stores/tableStore';
import { SortableList } from '../SortableList/SortableList';
import type { TableColumn } from '../../../models/table';

type Item = {
  id: UniqueIdentifier;
  label: string;
  isSelected: boolean;
};

export const TableColumnOrder = () => {
  const [items, setItems] = useState<Item[]>([]);

  const tableStore = useTableStoreContext<unknown>();
  const columnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const columns = useStore(tableStore, useShallow((state) => state.columns));

  useEffect(() => {
    const checkedItems: Item[] = [];
    const unCheckedItems: Item[] = [];
    const columnsMap = new Map<string, TableColumn<unknown>>();
    columns.forEach((column) => {
      columnsMap.set(column.id, column);
    });

    columnSettings.forEach(columnSetting => {
      const column = columnsMap.get(columnSetting.id);
      if (column && !column.isStatic && !column.frozen) {
        (columnSetting.isVisible ? checkedItems : unCheckedItems).push({
          id: column.id,
          label: column.headerName,
          isSelected: columnSetting.isVisible,
        });
      }
    });
    setItems([checkedItems, ...unCheckedItems].flat());

  }, [columnSettings, columns]);

  const onSortableListChange = useCallback((newItems: Item[]) => {
    setItems(newItems);
  }, []);

  const renderItem = useCallback((item: Item) => item.label, []);

  return (
    <Box sx={{
    }}
    >
      <SortableList<Item>
        items={items}
        onChange={onSortableListChange}
        renderItem={renderItem}
      />
    </Box>
  );
};
