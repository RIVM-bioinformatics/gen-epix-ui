import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { AutocompleteSelectAllContextData } from '../../../models/form.models';
import { renderComponent } from '../../../test/lib';

import { AutocompleteSelectAllContext } from './AutocompleteSelectAllContext';
import { AutocompleteSelectAllPaper } from './AutocompleteSelectAllPaper';

describe('AutocompleteSelectAllPaper', () => {
  it('renders children without select controls when no context is provided', async () => {
    const screen = await renderComponent(
      <AutocompleteSelectAllPaper>
        {'Options'}
      </AutocompleteSelectAllPaper>,
    );

    await expect.element(screen.getByText('Options')).toBeVisible();
    await expect.element(screen.getByText('Select all')).not.toBeInTheDocument();
  });

  it('shows an indeterminate checkbox and requests selection of all enabled values', async () => {
    const currentValues = ['selected', 'disabled'];
    const handleSelectAll = vi.fn();
    const context: AutocompleteSelectAllContextData = {
      currentValues,
      enabledOptionValues: ['selected', 'available'],
      handleSelectAll,
      selectAllLabel: 'Select all',
    };
    const screen = await renderComponent(
      <AutocompleteSelectAllContext value={context}>
        <AutocompleteSelectAllPaper>
          {'Options'}
        </AutocompleteSelectAllPaper>
      </AutocompleteSelectAllContext>,
    );
    const checkbox = screen.getByRole('checkbox');

    await expect.element(checkbox).toHaveAttribute('data-indeterminate', 'true');
    await screen.getByText('Select all').click();

    expect(handleSelectAll).toHaveBeenCalledWith(false, currentValues);
  });

  it('requests deselection when every enabled value is selected', async () => {
    const currentValues = ['first', 'second'];
    const handleSelectAll = vi.fn();
    const context: AutocompleteSelectAllContextData = {
      currentValues,
      enabledOptionValues: ['first', 'second'],
      handleSelectAll,
      selectAllLabel: 'Select all',
    };
    const screen = await renderComponent(
      <AutocompleteSelectAllContext value={context}>
        <AutocompleteSelectAllPaper>
          {'Options'}
        </AutocompleteSelectAllPaper>
      </AutocompleteSelectAllContext>,
    );
    const checkbox = screen.getByRole('checkbox');

    await expect.element(checkbox).toBeChecked();
    await screen.getByText('Select all').click();

    expect(handleSelectAll).toHaveBeenCalledWith(true, currentValues);
  });

  it('keeps the checkbox unchecked when there are no enabled values', async () => {
    const currentValues = ['disabled'];
    const handleSelectAll = vi.fn();
    const context: AutocompleteSelectAllContextData = {
      currentValues,
      enabledOptionValues: [],
      handleSelectAll,
      selectAllLabel: 'Select all',
    };
    const screen = await renderComponent(
      <AutocompleteSelectAllContext value={context}>
        <AutocompleteSelectAllPaper>
          {'Options'}
        </AutocompleteSelectAllPaper>
      </AutocompleteSelectAllContext>,
    );

    await expect.element(screen.getByRole('checkbox')).not.toBeChecked();
    await screen.getByText('Select all').click();

    expect(handleSelectAll).toHaveBeenCalledWith(false, currentValues);
  });
});
