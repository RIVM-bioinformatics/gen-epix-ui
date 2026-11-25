import {
  describe,
  expect,
  it,
} from 'vitest';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../../classes/filters/TextFilter';
import { renderFormComponent } from '../../../test/lib';

import { TextFilterField } from './TextFilterField';

describe('TextFilterField', () => {
  it('renders a text field with the filter label', async () => {
    const filter = new TextFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: 'priority',
      id: 'text-filter',
      label: 'Search name',
    });
    const screen = await renderFormComponent(
      <TextFilterField filter={filter} />,
    );

    await expect.element(screen.getByRole('textbox', { name: 'Search name' })).toBeVisible();
  });
});
