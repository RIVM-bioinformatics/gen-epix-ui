import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../../test/lib';
import { SortableListItemDragHandle } from '../SortableListItemDragHandle';

import type { SortableListItemContextValue } from './SortableListItemContext';
import { SortableListItemContextProvider } from './SortableListItemContextProvider';

const createValue = (
  roleDescription: string,
  ref: (node: HTMLElement | null) => void,
  onHandleClick: () => void,
): SortableListItemContextValue => ({
  attributes: {
    'aria-describedby': 'DndDescribedBy-0',
    'aria-disabled': false,
    'aria-pressed': false,
    'aria-roledescription': roleDescription,
    role: 'button',
    tabIndex: 0,
  },
  listeners: {
    onClick: onHandleClick,
  },
  ref,
});

describe('SortableListItemContextProvider', () => {
  it('passes the attributes, listeners and ref of its value to the descendant drag handle', async () => {
    const ref = vi.fn();
    const onHandleClick = vi.fn();

    const screen = await renderComponent(
      <SortableListItemContextProvider value={createValue('draggable item', ref, onHandleClick)}>
        <SortableListItemDragHandle name={'Move Alpha'} />
      </SortableListItemContextProvider>,
    );

    const handle = screen.getByRole('button', { name: 'Move Alpha' });
    await expect.element(handle).toHaveAttribute('aria-roledescription', 'draggable item');
    await expect.element(handle).toHaveAttribute('aria-describedby', 'DndDescribedBy-0');
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));

    await handle.click();
    expect(onHandleClick).toHaveBeenCalledTimes(1);
  });

  it('updates the descendant drag handle when a new value is provided', async () => {
    const initialRef = vi.fn();
    const updatedRef = vi.fn();
    const onInitialClick = vi.fn();
    const onUpdatedClick = vi.fn();

    const screen = await renderComponent(
      <SortableListItemContextProvider value={createValue('initial item', initialRef, onInitialClick)}>
        <SortableListItemDragHandle name={'Move Beta'} />
      </SortableListItemContextProvider>,
    );

    await expect.element(screen.getByRole('button', { name: 'Move Beta' })).toHaveAttribute('aria-roledescription', 'initial item');

    await screen.rerender(
      <SortableListItemContextProvider value={createValue('updated item', updatedRef, onUpdatedClick)}>
        <SortableListItemDragHandle name={'Move Beta'} />
      </SortableListItemContextProvider>,
    );

    const handle = screen.getByRole('button', { name: 'Move Beta' });
    await expect.element(handle).toHaveAttribute('aria-roledescription', 'updated item');
    expect(updatedRef).toHaveBeenCalledWith(expect.any(HTMLElement));

    await handle.click();
    expect(onUpdatedClick).toHaveBeenCalledTimes(1);
    expect(onInitialClick).not.toHaveBeenCalled();
  });
});
