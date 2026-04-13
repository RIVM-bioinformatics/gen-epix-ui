import {
  type ChangeEvent as ReactChangeEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { SortableOverlay } from './SortableOverlay';
import { SortableListItem } from './SortableListItem';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';


interface BaseItem {
  id: UniqueIdentifier;
  isSelected: boolean;
  label: string;
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
  const { t } = useTranslation();
  const [active, setActive] = useState<Active>(null);
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
        id={item.id}
        key={item.id}
        sx={{
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <FormControlLabel
          control={(
            <Checkbox
              checked={item.isSelected}
              onChange={onCheckBoxChange}
              size={'small'}
              slotProps={{
                input: {
                  ...{ 'data-id': (item.id as string) },
                },
              }}
            />
          )}
          label={renderItemContent(item)}
          sx={{
            flexGrow: 1,
            paddingLeft: theme.spacing(1),
          }}
        />
        <SortableListItemDragHandle
          name={t('Drag handle for {{label}}', { label: item.label })}
        />
      </SortableListItem>
    );
  }, [onCheckBoxChange, renderItemContent, t, theme]);

  return (
    <DndContext
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <SortableContext items={items}>
        <FormGroup>
          <Box
            {...TestIdUtil.createAttributes('SortableList')}
            component={'ul'}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing(0.5),
              listStyle: 'none',
              padding: 0,
            }}
          >
            {items.map((item) => renderItem(item))}
          </Box>
        </FormGroup>
      </SortableContext>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  );
};
