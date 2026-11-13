import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import type {
  ChangeEvent as ReactChangeEvent,
  ReactNode,
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
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { SortableOverlay } from './SortableOverlay';
import { SortableListItem } from './SortableListItem';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';


export interface SortableListBaseItem {
  id: UniqueIdentifier;
  isSelected: boolean;
  itemContent: ReactNode | string;
  label: string;
}

interface Props<T extends SortableListBaseItem> {
  readonly items: T[];
  onChange(items: T[]): void;
  renderHeaderContent?: () => ReactNode;
  renderItemContent(item: T): ReactNode;
}

export const SortableList = <T extends SortableListBaseItem>({
  items,
  onChange,
  renderHeaderContent,
  renderItemContent,
}: Props<T>) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [active, setActive] = useState<Active>(null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === active?.id),
    [active, items],
  );
  const getItemForId = useCallback(
    (id: UniqueIdentifier) => items.find((item) => item.id === id),
    [items],
  );
  const getItemPosition = useCallback(
    (id: UniqueIdentifier) => items.findIndex((item) => item.id === id) + 1,
    [items],
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
    const itemId = event.target.getAttribute('data-id');
    if (itemId === null) {
      return;
    }
    const isSelected = event.target.checked;
    onChange(items.map((item) => {
      if (String(item.id) === itemId) {
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
      >
        <Box role={'cell'}>
          <FormControlLabel
            control={(
              <Checkbox
                aria-label={t('Visibility for {{label}}', { label: item.label })}
                checked={item.isSelected}
                name={item.label}
                onChange={onCheckBoxChange}
                size={'small'}
                slotProps={{
                  input: {
                    ...{ 'data-id': (item.id as string) },
                  },
                }}
              />
            )}
            label={''}
            sx={{
              paddingLeft: theme.spacing(1),
            }}
          />
        </Box>
        {renderItemContent(item)}
        <Box
          role={'cell'}
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingRight: theme.spacing(1),
            width: '100%',
          }}
        >
          <SortableListItemDragHandle
            name={t('Drag handle for {{label}}', { label: item.label })}
          />
        </Box>
      </SortableListItem>
    );
  }, [onCheckBoxChange, renderItemContent, t, theme]);

  return (
    <DndContext
      accessibility={{
        announcements: {
          onDragCancel: ({ active: draggedItem }) => {
            const item = getItemForId(draggedItem.id);
            if (!item) {
              return;
            }
            return t('Reordering {{label}} cancelled. {{label}} returned to position {{position}} of {{count}}.', {
              count: items.length,
              label: item.label,
              position: getItemPosition(draggedItem.id),
            });
          },
          onDragEnd: ({ active: draggedItem, over }) => {
            const item = getItemForId(draggedItem.id);
            if (!item) {
              return;
            }
            if (!over) {
              return t('{{label}} returned to position {{position}} of {{count}}.', {
                count: items.length,
                label: item.label,
                position: getItemPosition(draggedItem.id),
              });
            }
            return t('{{label}} dropped at position {{position}} of {{count}}.', {
              count: items.length,
              label: item.label,
              position: getItemPosition(over.id),
            });
          },
          onDragOver: ({ active: draggedItem, over }) => {
            const item = getItemForId(draggedItem.id);
            if (!item || !over) {
              return;
            }
            return t('{{label}} moved to position {{position}} of {{count}}.', {
              count: items.length,
              label: item.label,
              position: getItemPosition(over.id),
            });
          },
          onDragStart: ({ active: draggedItem }) => {
            const item = getItemForId(draggedItem.id);
            if (!item) {
              return;
            }
            return t('Picked up {{label}}. Position {{position}} of {{count}}.', {
              count: items.length,
              label: item.label,
              position: getItemPosition(draggedItem.id),
            });
          },
        },
        screenReaderInstructions: {
          draggable: t('To reorder an item, focus its drag handle and press Space. Use arrow keys to move it. Press Space to drop, or Escape to cancel.'),
        },
      }}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <Box
        aria-label={t('Change column order and visibility')}
        role={'table'}
      >
        <Box
          role={'row'}
          sx={{
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'grid',
            gridTemplateColumns: '100px 1fr 100px',
            height: theme.spacing(5),
          }}
        >
          <Box
            component={'div'}
            role={'columnheader'}
            sx={{
              fontWeight: 'bold',
            }}
          >
            {t`Visible`}
          </Box>
          {renderHeaderContent ? renderHeaderContent() : (
            <Box
              component={'div'}
              role={'columnheader'}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {t`Column`}
            </Box>
          )}
          <Box
            aria-label={t`Reorder`}
            role={'columnheader'}
          />
        </Box>
        <SortableContext items={items}>
          <Box
            {...TestIdUtil.createAttributes('SortableList')}
            component={'ul'}
            role={'rowgroup'}
            sx={{
              gap: theme.spacing(0.5),
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {items.map((item) => renderItem(item))}
          </Box>
        </SortableContext>
      </Box>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  );
};
