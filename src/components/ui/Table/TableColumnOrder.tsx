import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  PropsWithChildren,
  Ref,
} from 'react';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  DragEndEvent,
  DraggableAttributes,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { Box } from '@mui/system';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Card } from '@mui/material';

import { useTableStoreContext } from '../../../stores/tableStore';
import type { TableColumnDimension } from '../../../models/table';


const PLACEHOLDER_COLUMN_ID = 'PLACEHOLDER';

type ItemProps = PropsWithChildren<{
  readonly ref?: Ref<HTMLDivElement>;
  readonly attributes?: DraggableAttributes;
  readonly listeners?: SyntheticListenerMap;
  readonly style?: { transform: string; transition: string };
}>;

const Item = ({ attributes, listeners, children, style, ref }: ItemProps) => {
  console.log(style);
  return (
    <Card
      {...attributes}
      {...listeners}
      component={'div'}
      ref={ref}
      style={style}
      sx={{
        padding: '8px',
        marginBottom: '4px',
      }}
    >
      {children}
    </Card>
  );
};

type SortableItemProps = {
  readonly id: UniqueIdentifier;
};

const SortableItem = ({ id }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Item
      attributes={attributes}
      listeners={listeners}
      ref={setNodeRef}
      style={style}
    >
      {id}
    </Item>
  );
};


export const TableColumnOrder = () => {
  const [t] = useTranslation();

  const tableStore = useTableStoreContext<unknown>();
  const columnDimensionsFromStore = useStore(tableStore, useShallow((state) => state.columnDimensions));
  const columnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const columns = useStore(tableStore, useShallow((state) => state.columns));
  const [activeId, setActiveId] = useState<UniqueIdentifier>(null);
  const [items, setItems] = useState<string[]>(['1', '2', '3']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;

    setActiveId(active.id);
  }, [setActiveId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((x) => {
        const oldIndex = x.indexOf(active.id as string);
        const newIndex = x.indexOf(over.id as string);

        return arrayMove(x, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }, []);

  const columnDimensions = useMemo<TableColumnDimension[]>(() => {
    if (columnDimensionsFromStore.length) {
      return columnDimensionsFromStore;
    }
    return [{
      columnIds: columns.map((column) => column.id),
      id: PLACEHOLDER_COLUMN_ID,
      label: t`Columns`,
    }];
  }, [columnDimensionsFromStore, columns, t]);

  console.log({ columnDimensions, columns, columnSettings });

  return (
    <Box sx={{
      height: '500px',
    }}
    >
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={items}
          strategy={verticalListSortingStrategy}
        >
          {items.map(id => (
            <SortableItem
              id={id}
              key={id}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <Item>
              {activeId}
            </Item>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};
