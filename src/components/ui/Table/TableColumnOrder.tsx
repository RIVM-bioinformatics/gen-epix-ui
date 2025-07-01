import type { ChangeEvent as ReactChangeEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Box,
  Checkbox,
  useTheme,
} from '@mui/material';
import type { UniqueIdentifier } from '@dnd-kit/core';

import { useTableStoreContext } from '../../../stores/tableStore';
import { SortableList } from '../SortableList/SortableList';
import { SortableListItem } from '../SortableList/SortableListItem';
import { SortableListItemDragHandle } from '../SortableList/SortableListItemDragHandle';
import type { TableColumn } from '../../../models/table';

type Item = {
  id: UniqueIdentifier;
  label: string;
  isChecked: boolean;
};


export const TableColumnOrder = () => {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);

  const tableStore = useTableStoreContext<unknown>();
  const columnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const columns = useStore(tableStore, useShallow((state) => state.columns));

  const onCheckedChange = useCallback((event: ReactChangeEvent<HTMLInputElement>) => {

    const itemId = event.target.getAttribute('data-id') as UniqueIdentifier;
    if (!itemId) {
      return;
    }
    const isChecked = event.target.checked;
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, isChecked };
        }
        return item;
      });
    });
  }, []);

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
          isChecked: columnSetting.isVisible,
        });
      }
    });
    setItems([checkedItems, ...unCheckedItems].flat());

  }, [columnSettings, columns]);

  const renderItem = useCallback((item: Item) => {
    return (
      <SortableListItem
        id={item.id}
        sx={{
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Checkbox
          checked={item.isChecked}
          onChange={onCheckedChange}
          size={'small'}
          slotProps={{
            input: {
              ...{ 'data-id': (item.id as string) },
            },
          }}
          sx={{
            padding: `0 ${theme.spacing(0.5)}`,
          }}
        />
        <Box flexGrow={1}>
          {item.label}
        </Box>
        <SortableListItemDragHandle />
      </SortableListItem>
    );
  }, [onCheckedChange, theme]);

  return (
    <Box sx={{
    }}
    >
      <SortableList<Item>
        items={items}
        onChange={setItems}
        renderItem={renderItem}
      />
    </Box>
  );
};
