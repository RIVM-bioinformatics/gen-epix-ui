import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { SortableListItemContextProvider } from './context/SortableListItemContextProvider';
import type { SortableListItemContextValue } from './context/SortableListItemContext';
import { SortableListItemDragHandle } from './SortableListItemDragHandle';

const DRAG_HANDLE_TEST_ID = 'SortableListItemDragHandle';

describe('SortableListItemDragHandle', () => {
  it('renders a button labelled by the name prop when no sortable item context is provided', async () => {
    const screen = await renderComponent(
      <SortableListItemDragHandle name={'Reorder row'} />,
    );

    const handle = screen.getByRole('button', { name: 'Reorder row' });
    await expect.element(handle).toBeVisible();
    await expect.element(handle).toHaveAttribute('data-testid', DRAG_HANDLE_TEST_ID);
    await expect.element(handle).toHaveAttribute('type', 'button');
    await expect.element(handle).toHaveAttribute('aria-label', 'Reorder row');
    await expect.element(handle).toHaveAttribute('name', 'Reorder row');
    await expect.element(handle).not.toHaveAttribute('aria-roledescription');
    await expect.element(handle).not.toHaveAttribute('aria-describedby');
  });

  it('applies the attributes, listeners and ref from the sortable item context', async () => {
    const onHandleClick = vi.fn();
    const ref = vi.fn();
    const value: SortableListItemContextValue = {
      attributes: {
        'aria-describedby': 'DndDescribedBy-0',
        'aria-disabled': false,
        'aria-pressed': false,
        'aria-roledescription': 'sortable',
        role: 'button',
        tabIndex: 0,
      },
      listeners: {
        onClick: onHandleClick,
      },
      ref,
    };

    const screen = await renderComponent(
      <SortableListItemContextProvider value={value}>
        <SortableListItemDragHandle name={'Move Alpha'} />
      </SortableListItemContextProvider>,
    );

    const handle = screen.getByRole('button', { name: 'Move Alpha' });
    await expect.element(handle).toHaveAttribute('aria-roledescription', 'sortable');
    await expect.element(handle).toHaveAttribute('aria-describedby', 'DndDescribedBy-0');
    await expect.element(handle).toHaveAttribute('aria-disabled', 'false');
    await expect.element(handle).toHaveAttribute('tabindex', '0');
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));

    await handle.click();
    expect(onHandleClick).toHaveBeenCalledTimes(1);
  });
});
