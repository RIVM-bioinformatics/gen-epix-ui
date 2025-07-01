import {
  Fragment,
  useCallback,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
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
  useTheme,
} from '@mui/material';

import { SortableOverlay } from './SortableOverlay';


interface BaseItem {
  id: UniqueIdentifier;
}

interface Props<T extends BaseItem> {
  readonly items: T[];
  onChange(items: T[]): void;
  renderItem(item: T): ReactNode;
}

export const SortableList = <T extends BaseItem>({
  items,
  onChange,
  renderItem,
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

  return (
    <DndContext
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <SortableContext items={items}>
        <Box
          component={'ul'}
          role="application"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(0.5),
            padding: 0,
            listStyle: 'none',
          }}
        >
          {items.map((item) => (
            <Fragment key={item.id}>{renderItem(item)}</Fragment>
          ))}
        </Box>
      </SortableContext>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  );
};
