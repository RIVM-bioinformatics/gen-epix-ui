import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { UniqueIdentifier } from '@dnd-kit/core';

import { TestIdUtil } from '../../../utils/TestIdUtil';
import { withDialog } from '../../../hoc/withDialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import type {
  TableColumn,
  TableColumnSettings,
} from '../../../models/table';
import { SortableList } from '../SortableList/SortableList';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TableUtil } from '../../../utils/TableUtil';


export interface TableColumnOrderDialogOpenProps {
  //
}

export interface TableColumnOrderDialogProps extends WithDialogRenderProps<TableColumnOrderDialogOpenProps> {
  //
}

export type TableColumnOrderDialogRefMethods = WithDialogRefMethods<TableColumnOrderDialogProps, TableColumnOrderDialogOpenProps>;


type Item = {
  id: UniqueIdentifier;
  label: string;
  isSelected: boolean;
};

export const TableColumnOrderDialog = withDialog<TableColumnOrderDialogProps, TableColumnOrderDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
  }: TableColumnOrderDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const [items, setItems] = useState<Item[]>([]);

  const tableStore = useTableStoreContext<unknown>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const tableColumnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));

  const columnsMap = useMemo(() => {
    const map = new Map<string, TableColumn<unknown>>();
    tableColumns.forEach((column) => {
      map.set(column.id, column);
    });
    return map;
  }, [tableColumns]);

  const updateItems = useCallback((columnSettings: TableColumnSettings[]) => {
    const newItems: Item[] = [];
    columnSettings.forEach(columnSetting => {
      const column = columnsMap.get(columnSetting.id);
      if (column && !column.isStatic && !column.frozen) {
        newItems.push({
          id: column.id,
          label: column.headerName,
          isSelected: columnSetting.isVisible,
        });
      }
    });
    setItems(newItems);
  }, [columnsMap]);

  useEffect(() => {
    updateItems(tableColumnSettings);
  }, [tableColumnSettings, updateItems]);

  const onReset = useCallback(() => {
    updateItems(TableUtil.createInitialColumnSettings(tableColumns));
  }, [tableColumns, updateItems]);


  useEffect(() => {
    onTitleChange(t`Change column order`);
  }, [onTitleChange, t]);

  const onSave = useCallback(() => {
    emitTableEvent('columnVisibilityChange', [...tableColumns.filter(c => c.isStatic).map(c => c.id), ...items.filter((item) => item.isSelected).map((item) => item.id.toString())]);
    emitTableEvent('columnOrderChange', items.map((item) => item.id.toString()));
    onClose();
  }, [tableColumns, emitTableEvent, items, onClose]);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Close`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-reset'),
          color: 'primary',
          autoFocus: true,
          onClick: onReset,
          variant: 'outlined',
          label: t`Reset`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-save'),
          color: 'secondary',
          autoFocus: true,
          onClick: onSave,
          variant: 'contained',
          label: t`Save`,
        },
      ],
    );
  }, [onActionsChange, onClose, onReset, onSave, t]);

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
}, {
  testId: 'TableColumnOrderDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
