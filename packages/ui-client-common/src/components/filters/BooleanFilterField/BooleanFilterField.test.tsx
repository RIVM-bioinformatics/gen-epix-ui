import {
  describe,
  expect,
  it,
} from 'vitest';

import { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { renderFormComponent } from '../../../test/lib';

import { BooleanFilterField } from './BooleanFilterField';

const createFilter = (): BooleanFilter => new BooleanFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'boolean-filter',
  label: 'Is active',
});

describe('BooleanFilterField', () => {
  it('renders a select with the filter label', async () => {
    const screen = await renderFormComponent(
      <BooleanFilterField filter={createFilter()} />,
    );

    await expect.element(screen.getByRole('combobox', { name: 'Is active' })).toBeVisible();
  });

  it('offers Yes and No as options', async () => {
    const screen = await renderFormComponent(
      <BooleanFilterField filter={createFilter()} />,
    );

    await screen.getByRole('combobox', { name: 'Is active' }).click();

    await expect.element(screen.getByRole('option', { name: 'Yes' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'No' })).toBeVisible();
  });
});
