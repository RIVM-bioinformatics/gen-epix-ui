import {
  describe,
  expect,
  it,
} from 'vitest';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form.models';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { GeoFilter } from '../../../classes/filters/GeoFilter';
import { renderFormComponent } from '../../../test/lib';

import { GeoFilterField } from './GeoFilterField';

const createOptions = (count: number): AutoCompleteOption[] => Array.from({ length: count }, (_, index) => ({
  label: `Region ${index + 1}`,
  value: `region-${index + 1}`,
}));

const createFilter = (count: number): GeoFilter => new GeoFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'geo-filter',
  label: 'Geography',
  options: createOptions(count),
});

describe('GeoFilterField', () => {
  it('renders checkboxes when there are at most 5 options', async () => {
    const screen = await renderFormComponent(
      <GeoFilterField filter={createFilter(5)} />,
    );

    await expect.element(screen.getByRole('checkbox', { name: 'Region 1' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Region 5' })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Geography' })).not.toBeInTheDocument();
  });

  it('renders an autocomplete when there are more than 5 options', async () => {
    const screen = await renderFormComponent(
      <GeoFilterField filter={createFilter(6)} />, { form: { defaultValues: { 'geo-filter': [] } } },
    );

    await expect.element(screen.getByRole('combobox', { name: 'Geography' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Region 1' })).not.toBeInTheDocument();
  });
});
