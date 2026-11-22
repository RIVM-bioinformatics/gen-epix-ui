import {
  describe,
  expect,
  it,
} from 'vitest';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form.models';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { MultiSelectFilter } from '../../../classes/filters/MultiSelectFilter';
import { renderFormComponent } from '../../../test/lib';

import { MultiSelectFilterField } from './MultiSelectFilterField';

const createOptions = (count: number): AutoCompleteOption[] => Array.from({ length: count }, (_, index) => ({
  label: `Option ${index + 1}`,
  value: `option-${index + 1}`,
}));

const createFilter = (count: number, maxNumOptionsExpanded?: number): MultiSelectFilter => new MultiSelectFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'multi-select-filter',
  label: 'Categories',
  maxNumOptionsExpanded,
  options: createOptions(count),
});

describe('MultiSelectFilterField', () => {
  it('renders checkboxes when the option count is within the default expanded limit', async () => {
    const screen = await renderFormComponent(
      <MultiSelectFilterField filter={createFilter(5)} />,
    );

    await expect.element(screen.getByRole('checkbox', { name: 'Option 1' })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Categories' })).not.toBeInTheDocument();
  });

  it('renders an autocomplete when the option count exceeds the default expanded limit', async () => {
    const screen = await renderFormComponent(
      <MultiSelectFilterField filter={createFilter(6)} />, { form: { defaultValues: { 'multi-select-filter': [] } } },
    );

    await expect.element(screen.getByRole('combobox', { name: 'Categories' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Option 1' })).not.toBeInTheDocument();
  });

  it('honours a custom maxNumOptionsExpanded limit', async () => {
    const screen = await renderFormComponent(
      <MultiSelectFilterField filter={createFilter(3, 2)} />, { form: { defaultValues: { 'multi-select-filter': [] } } },
    );

    await expect.element(screen.getByRole('combobox', { name: 'Categories' })).toBeVisible();
  });

  it('renders checkboxes when the option count equals a custom maxNumOptionsExpanded limit', async () => {
    const screen = await renderFormComponent(
      <MultiSelectFilterField filter={createFilter(2, 2)} />,
    );

    await expect.element(screen.getByRole('checkbox', { name: 'Option 2' })).toBeVisible();
  });
});
