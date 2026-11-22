import {
  describe,
  expect,
  it,
} from 'vitest';
import { Box } from '@mui/material';
import { use } from 'react';

import { renderComponent } from '../../../../test/lib';

import { SortableListItemContext } from './SortableListItemContext';
import type { SortableListItemContextValue } from './SortableListItemContext';

const ContextProbe = () => {
  const value = use(SortableListItemContext);

  return (
    <Box>
      {`attributes: ${value.attributes === undefined ? 'none' : 'set'}, listeners: ${value.listeners === undefined ? 'none' : 'set'}, ref: ${value.ref === undefined ? 'none' : 'set'}`}
    </Box>
  );
};

describe('SortableListItemContext', () => {
  it('provides an empty value to consumers rendered outside a provider', async () => {
    const screen = await renderComponent(
      <ContextProbe />,
    );

    await expect.element(screen.getByText('attributes: none, listeners: none, ref: none')).toBeVisible();
  });

  it('provides the value of the nearest context provider to its consumers', async () => {
    const value: SortableListItemContextValue = {
      attributes: {
        'aria-describedby': 'DndDescribedBy-0',
        'aria-disabled': false,
        'aria-pressed': false,
        'aria-roledescription': 'sortable',
        role: 'button',
        tabIndex: 0,
      },
      listeners: {},
      ref: () => undefined,
    };

    const screen = await renderComponent(
      <SortableListItemContext value={value}>
        <ContextProbe />
      </SortableListItemContext>,
    );

    await expect.element(screen.getByText('attributes: set, listeners: set, ref: set')).toBeVisible();
  });
});
