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
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';

import { renderComponent } from '../../../test/lib';

import { SortableListItem } from './SortableListItem';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';

type TestItem = {
  readonly id: string;
  readonly label: string;
};

const ITEMS: TestItem[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
];
const ITEM_IDS = ITEMS.map((item) => item.id);
const ITEM_TEST_ID = 'SortableListItem';

type SortableListItemFixtureProps = {
  readonly sx?: SxProps;
};

const SortableListItemFixture = ({ sx }: SortableListItemFixtureProps) => {
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext sensors={sensors}>
      <SortableContext items={ITEM_IDS}>
        <Box
          component={'ul'}
          sx={{ margin: 0, padding: 0 }}
        >
          {ITEMS.map((item) => (
            <SortableListItem
              id={item.id}
              key={item.id}
              sx={sx}
            >
              <SortableListItemDragHandle name={item.label} />
              <span>
                {`${item.label} content`}
              </span>
            </SortableListItem>
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

type TestScreen = Awaited<ReturnType<typeof renderComponent>>;

const getItem = (screen: TestScreen, index: number) => screen.getByTestId(ITEM_TEST_ID).nth(index);

const focusHandle = (screen: TestScreen, label: string) => {
  (screen.getByRole('button', { name: label }).element() as HTMLElement).focus();
};

describe('SortableListItem', () => {
  it('renders a row per item with its id test attribute, content and drag handle', async () => {
    const screen = await renderComponent(
      <SortableListItemFixture />,
    );

    await expect.element(getItem(screen, 0)).toHaveAttribute('data-testid-prop-id', 'alpha');
    await expect.element(getItem(screen, 1)).toHaveAttribute('data-testid-prop-id', 'beta');
    await expect.element(screen.getByRole('row').nth(0)).toBeVisible();
    await expect.element(screen.getByText('Alpha content')).toBeVisible();
    await expect.element(screen.getByText('Beta content')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Alpha' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Beta' })).toBeVisible();
  });

  it('renders without a custom style override and without the dragging highlight when no item is dragged', async () => {
    const screen = await renderComponent(
      <SortableListItemFixture />,
    );

    await expect.element(getItem(screen, 0)).toHaveStyle({
      display: 'grid',
      outlineStyle: 'none',
      position: 'static',
      zIndex: 'auto',
    });
  });

  it('merges a custom sx override with the base item styles', async () => {
    const screen = await renderComponent(
      <SortableListItemFixture sx={{ paddingTop: '7px' }} />,
    );

    await expect.element(getItem(screen, 0)).toHaveStyle({
      display: 'grid',
      paddingTop: '7px',
    });
    await expect.element(getItem(screen, 1)).toHaveStyle({
      display: 'grid',
      paddingTop: '7px',
    });
  });

  it('highlights only the item being dragged and removes the highlight when the drag is cancelled', async () => {
    const screen = await renderComponent(
      <SortableListItemFixture />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');

    await expect.element(getItem(screen, 0)).toHaveStyle({
      outlineOffset: '-2px',
      outlineStyle: 'solid',
      position: 'relative',
      zIndex: '1',
    });
    await expect.element(getItem(screen, 1)).toHaveStyle({
      outlineStyle: 'none',
      position: 'static',
      zIndex: 'auto',
    });

    await userEvent.keyboard('{Escape}');

    await expect.element(getItem(screen, 0)).toHaveStyle({
      outlineStyle: 'none',
      position: 'static',
      zIndex: 'auto',
    });
  });
});
