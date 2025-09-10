import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  type ChangeEvent as ReactChangeEvent,
} from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  Active,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Box,
  Checkbox,
  useTheme,
} from '@mui/material';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { SortableOverlay } from './SortableOverlay';
import { SortableListItem } from './SortableListItem';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';


interface BaseItem {
  id: UniqueIdentifier;
  label: string;
  isSelected: boolean;
}

interface Props<T extends BaseItem> {
  readonly items: T[];
  onChange(items: T[]): void;
  renderItemContent(item: T): ReactNode;
}

export const SortableList = <T extends BaseItem>({
  items,
  onChange,
  renderItemContent,
}: Props<T>) => {
  const theme = useTheme();
  const [active, setActive] = useState<Active | null>(null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === active?.id),
    [active, items],
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragCancel = useCallback(() => {
    setActive(null);
  }, []);

  const onDragEnd = useCallback(({ active: item, over }: DragEndEvent) => {
    if (over && item.id !== over?.id) {
      const activeIndex = items.findIndex(({ id }) => id === item.id);
      const overIndex = items.findIndex(({ id }) => id === over.id);

      onChange(arrayMove(items, activeIndex, overIndex));
    }
    setActive(null);
  }, [items, onChange]);

  const onDragStart = useCallback(({ active: item }: DragStartEvent) => {
    setActive(item);
  }, []);

  const onCheckBoxChange = useCallback((event: ReactChangeEvent<HTMLInputElement>) => {
    const itemId = event.target.getAttribute('data-id') as UniqueIdentifier;
    if (!itemId) {
      return;
    }
    const isSelected = event.target.checked;
    onChange(items.map((item) => {
      if (item.id === itemId) {
        return { ...item, isSelected };
      }
      return item;
    }));
  }, [onChange, items]);

  const renderItem = useCallback((item: T) => {
    return (
      <SortableListItem
        key={item.id}
        id={item.id}
        sx={{
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Checkbox
          checked={item.isSelected}
          size={'small'}
          slotProps={{
            input: {
              ...{ 'data-id': (item.id as string) },
            },
          }}
          sx={{
            padding: `0 ${theme.spacing(0.5)}`,
          }}
          onChange={onCheckBoxChange}
        />
        <Box flexGrow={1}>
          {renderItemContent(item)}
        </Box>
        <SortableListItemDragHandle />
      </SortableListItem>
    );
  }, [onCheckBoxChange, renderItemContent, theme]);

  return (
    <DndContext
      sensors={sensors}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <SortableContext items={items}>
        <Box
          {...TestIdUtil.createAttributes('SortableList')}
          component={'ul'}
          role={'application'}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(0.5),
            padding: 0,
            listStyle: 'none',
          }}
        >
          {items.map((item) => renderItem(item))}
        </Box>
      </SortableContext>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  );
};
