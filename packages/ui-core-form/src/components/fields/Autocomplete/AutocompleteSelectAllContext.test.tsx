import { use } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { AutocompleteSelectAllContextData } from '../../../models/form.models';
import { renderComponent } from '../../../test/lib';

import { AutocompleteSelectAllContext } from './AutocompleteSelectAllContext';

const ContextProbe = () => {
  const context = use(AutocompleteSelectAllContext);

  return (
    <div>
      {context ? `Selectable: ${context.enabledOptionValues.join(',')}` : 'No select all context'}
    </div>
  );
};

describe('AutocompleteSelectAllContext', () => {
  it('provides null when no provider is present', async () => {
    const screen = await renderComponent(
      <ContextProbe />,
    );

    await expect.element(screen.getByText('No select all context')).toBeVisible();
  });

  it('provides the given value to consumers', async () => {
    const context: AutocompleteSelectAllContextData = {
      currentValues: ['first'],
      enabledOptionValues: ['first', 'second'],
      handleSelectAll: vi.fn(),
      selectAllLabel: 'Select all',
    };
    const screen = await renderComponent(
      <AutocompleteSelectAllContext value={context}>
        <ContextProbe />
      </AutocompleteSelectAllContext>,
    );

    await expect.element(screen.getByText('Selectable: first,second')).toBeVisible();
  });

  it('lets a nested provider override the outer value', async () => {
    const outerContext: AutocompleteSelectAllContextData = {
      currentValues: [],
      enabledOptionValues: ['outer'],
      handleSelectAll: vi.fn(),
      selectAllLabel: 'Select all',
    };
    const innerContext: AutocompleteSelectAllContextData = {
      currentValues: [],
      enabledOptionValues: ['inner'],
      handleSelectAll: vi.fn(),
      selectAllLabel: 'Select all',
    };
    const screen = await renderComponent(
      <AutocompleteSelectAllContext value={outerContext}>
        <AutocompleteSelectAllContext value={innerContext}>
          <ContextProbe />
        </AutocompleteSelectAllContext>
      </AutocompleteSelectAllContext>,
    );

    await expect.element(screen.getByText('Selectable: inner')).toBeVisible();
  });
});
