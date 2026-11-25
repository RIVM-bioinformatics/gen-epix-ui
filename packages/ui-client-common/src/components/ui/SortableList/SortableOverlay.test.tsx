import {
  describe,
  expect,
  it,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  DndContext,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import {
  useCallback,
  useState,
} from 'react';

import { renderComponent } from '../../../test/lib';

import { SortableListItem } from './SortableListItem';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';
import { SortableOverlay } from './SortableOverlay';

type TestItem = {
  readonly id: string;
  readonly label: string;
};

const ITEMS: TestItem[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
];
const ITEM_IDS = ITEMS.map((item) => item.id);

const SortableOverlayFixture = () => {
  const [draggedLabel, setDraggedLabel] = useState<string | undefined>(undefined);
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const draggedItem = ITEMS.find((item) => item.id === event.active.id);
    setDraggedLabel(draggedItem?.label);
  }, []);
  const onDragEnd = useCallback(() => {
    setDraggedLabel(undefined);
  }, []);

  return (
    <DndContext
      onDragCancel={onDragEnd}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <SortableContext items={ITEM_IDS}>
        <Box
          component={'ul'}
          sx={{ margin: 0, padding: 0 }}
        >
          {ITEMS.map((item) => (
            <SortableListItem
              id={item.id}
              key={item.id}
            >
              <SortableListItemDragHandle name={item.label} />
              <span>
                {`${item.label} content`}
              </span>
            </SortableListItem>
          ))}
        </Box>
      </SortableContext>
      <SortableOverlay>
        {draggedLabel === undefined
          ? null
          : (
            <Box>
              {`Dragging ${draggedLabel}`}
            </Box>
          )}
      </SortableOverlay>
    </DndContext>
  );
};

const focusHandle = (screen: Awaited<ReturnType<typeof renderComponent>>, label: string) => {
  (screen.getByRole('button', { name: label }).element() as HTMLElement).focus();
};

describe('SortableOverlay', () => {
  it('renders the dragged item content above the list while a keyboard drag is active', async () => {
    const screen = await renderComponent(
      <SortableOverlayFixture />,
    );

    await expect.element(screen.getByText('Dragging Alpha')).not.toBeInTheDocument();

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');

    const overlayContent = screen.getByText('Dragging Alpha');
    await expect.element(overlayContent).toBeVisible();

    const overlayWrapper = (overlayContent.element() as HTMLElement).parentElement;
    const overlayStyle = window.getComputedStyle(overlayWrapper);
    expect(overlayStyle.zIndex).toBe('1000');
    expect(overlayStyle.opacity).toBe('1');
  });

  it('shows the content of the item that is being dragged', async () => {
    const screen = await renderComponent(
      <SortableOverlayFixture />,
    );

    focusHandle(screen, 'Beta');
    await userEvent.keyboard(' ');

    await expect.element(screen.getByText('Dragging Beta')).toBeVisible();
    await expect.element(screen.getByText('Dragging Alpha')).not.toBeInTheDocument();
  });

  it('removes the overlay content when the drag is cancelled with Escape', async () => {
    const screen = await renderComponent(
      <SortableOverlayFixture />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await expect.element(screen.getByText('Dragging Alpha')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByText('Dragging Alpha')).not.toBeInTheDocument();
  });

  it('removes the overlay content when the dragged item is dropped', async () => {
    const screen = await renderComponent(
      <SortableOverlayFixture />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await expect.element(screen.getByText('Dragging Alpha')).toBeVisible();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');

    await expect.element(screen.getByText('Dragging Alpha')).not.toBeInTheDocument();
  });
});
