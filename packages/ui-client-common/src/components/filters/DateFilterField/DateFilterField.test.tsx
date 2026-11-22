import {
  describe,
  expect,
  it,
} from 'vitest';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { DateFilter } from '../../../classes/filters/DateFilter';
import { renderFormComponent } from '../../../test/lib';

import { DateFilterField } from './DateFilterField';

describe('DateFilterField', () => {
  it('renders a date range picker with the filter label', async () => {
    const filter = new DateFilter({
      dateFormat: DATE_FORMAT.DATE,
      dateParser: (value: string) => new Date(`${value}T12:00:00.000Z`),
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: 'priority',
      id: 'date-filter',
      label: 'Sample date',
      maxDate: new Date('2025-12-31T12:00:00.000Z'),
      minDate: new Date('2020-01-01T12:00:00.000Z'),
    });
    const screen = await renderFormComponent(
      <DateFilterField filter={filter} />,
    );

    await expect.element(screen.getByRole('group', { name: 'From' })).toBeVisible();
    await expect.element(screen.getByRole('group', { name: 'To' })).toBeVisible();
  });
});
