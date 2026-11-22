import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Box } from '@mui/material';

import { renderComponent } from '../../../../test/lib';

import { SortableListItemContextProvider } from './SortableListItemContextProvider';
import type { SortableListItemContextValue } from './SortableListItemContext';
import { useSortableListItemContext } from './useSortableListItemContext';

const ContextProbe = () => {
  const { attributes, listeners, ref } = useSortableListItemContext();

  return (
    <Box ref={ref}>
      {`attributes: ${attributes === undefined ? 'none' : 'set'}, listeners: ${listeners === undefined ? 'none' : 'set'}, ref: ${ref === undefined ? 'none' : 'set'}`}
    </Box>
  );
};

const createValue = (
  roleDescription: string,
  ref: (node: HTMLElement | null) => void,
): SortableListItemContextValue => ({
  attributes: {
    'aria-describedby': 'DndDescribedBy-0',
    'aria-disabled': false,
    'aria-pressed': false,
    'aria-roledescription': roleDescription,
    role: 'button',
    tabIndex: 0,
  },
  listeners: {},
  ref,
});

describe('useSortableListItemContext', () => {
  it('returns an empty value when used outside a provider', async () => {
    const screen = await renderComponent(
      <ContextProbe />,
    );

    await expect.element(screen.getByText('attributes: none, listeners: none, ref: none')).toBeVisible();
  });

  it('returns the value of the nearest provider and attaches its ref to the rendered element', async () => {
    const ref = vi.fn();

    const screen = await renderComponent(
      <SortableListItemContextProvider value={createValue('draggable item', ref)}>
        <ContextProbe />
      </SortableListItemContextProvider>,
    );

    await expect.element(screen.getByText('attributes: set, listeners: set, ref: set')).toBeVisible();
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it('returns the value of the innermost provider when providers are nested', async () => {
    const outerRef = vi.fn();
    const innerRef = vi.fn();

    const screen = await renderComponent(
      <SortableListItemContextProvider value={createValue('outer item', outerRef)}>
        <SortableListItemContextProvider value={createValue('inner item', innerRef)}>
          <ContextProbe />
        </SortableListItemContextProvider>
      </SortableListItemContextProvider>,
    );

    await expect.element(screen.getByText('attributes: set, listeners: set, ref: set')).toBeVisible();
    expect(innerRef).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(outerRef).not.toHaveBeenCalled();
  });

  it('returns the updated value after the provider value changes', async () => {
    const initialRef = vi.fn();
    const updatedRef = vi.fn();

    const screen = await renderComponent(
      <SortableListItemContextProvider value={createValue('initial item', initialRef)}>
        <ContextProbe />
      </SortableListItemContextProvider>,
    );

    expect(initialRef).toHaveBeenCalledWith(expect.any(HTMLElement));

    await screen.rerender(
      <SortableListItemContextProvider value={createValue('updated item', updatedRef)}>
        <ContextProbe />
      </SortableListItemContextProvider>,
    );

    await expect.element(screen.getByText('attributes: set, listeners: set, ref: set')).toBeVisible();
    expect(updatedRef).toHaveBeenCalledWith(expect.any(HTMLElement));
  });
});
