import {
  describe,
  expect,
  it,
} from 'vitest';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { NumberRangeFilter } from '../../../classes/filters/NumberRangeFilter';
import { renderFormComponent } from '../../../test/lib';

import { NumberRangeFilterField } from './NumberRangeFilterField';

describe('NumberRangeFilterField', () => {
  it('renders a number range input with the filter label', async () => {
    const filter = new NumberRangeFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: 'priority',
      id: 'number-range-filter',
      label: 'Age range',
      max: 100,
      min: 0,
    });
    const screen = await renderFormComponent(
      <NumberRangeFilterField filter={filter} />,
    );

    await expect.element(screen.getByText('Age range').first()).toBeVisible();
    await expect.element(screen.getByRole('slider', { name: 'Value' }).first()).toBeVisible();
  });
});
