import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  page,
  userEvent,
} from 'vitest/browser';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import { DateFilter } from '../../../classes/filters/DateFilter';
import { GeoFilter } from '../../../classes/filters/GeoFilter';
import { MultiSelectFilter } from '../../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../../classes/filters/TextFilter';
import type { Filters } from '../../../models/filter.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderFormComponent } from '../../../test/lib';

import { TableFilter } from './TableFilter';

type TestFilter = Filters[number];

type TestRow = {
  id: string;
};

const FILTER_PRIORITY = 'priority';
const SELECT_MISSING_VALUES_LABEL = 'Select missing values';
const INCLUDE_MISSING_VALUES_LABEL = 'Include missing values';
const SELECT_MISSING_VALUES_TOOLTIP = 'When enabled, select only items with missing values.';
const INCLUDE_MISSING_VALUES_TOOLTIP = 'When enabled, include items with missing values alongside items matching the selected values.';

const createBaseKwArgs = (id: string, label: string) => ({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: FILTER_PRIORITY,
  id,
  label,
});

const FILTER_CASES: Array<{ createFilter: () => TestFilter; description: string; label: string }> = [
  {
    createFilter: () => new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    description: 'TextFilter',
    label: 'Search name',
  },
  {
    createFilter: () => new BooleanFilter(createBaseKwArgs('boolean-filter', 'Is active')),
    description: 'BooleanFilter',
    label: 'Is active',
  },
  {
    createFilter: () => new NumberRangeFilter({ ...createBaseKwArgs('number-filter', 'Age range'), max: 100, min: 0 }),
    description: 'NumberRangeFilter',
    label: 'Age range',
  },
  {
    createFilter: () => new MultiSelectFilter({
      ...createBaseKwArgs('multi-select-filter', 'Colors'),
      options: [{ label: 'Red', value: 'red' }],
    }),
    description: 'MultiSelectFilter',
    label: 'Colors',
  },
  {
    createFilter: () => new GeoFilter({
      ...createBaseKwArgs('geo-filter', 'Regions'),
      options: [{ label: 'Region A', value: 'region-a' }],
    }),
    description: 'GeoFilter',
    label: 'Regions',
  },
  {
    createFilter: () => new DateFilter({
      ...createBaseKwArgs('date-filter', 'Collected on'),
      dateParser: (value: string) => new Date(value),
      maxDate: new Date(2030, 0, 1),
      minDate: new Date(2000, 0, 1),
    }),
    description: 'DateFilter',
    label: 'Collected on',
  },
];

const renderTableFilter = async ({
  defaultValues,
  filter,
  showMissingValuesFilter = true,
}: {
  defaultValues?: Record<string, unknown>;
  filter: TestFilter;
  showMissingValuesFilter?: boolean;
}) => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'id',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
    showMissingValuesFilter,
  });
  return renderFormComponent(
    <TableStoreContextProvider store={store}>
      <TableFilter filter={filter} />
    </TableStoreContextProvider>,
    { form: { defaultValues } },
  );
};

describe('TableFilter', () => {
  it.each(FILTER_CASES)('renders the field for $description', async ({ createFilter, label }) => {
    const screen = await renderTableFilter({ filter: createFilter() });

    await expect.element(screen.getByText(label).first()).toBeInTheDocument();
  });

  it('does not render the missing-values checkbox when showMissingValuesFilter is disabled', async () => {
    const screen = await renderTableFilter({
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
      showMissingValuesFilter: false,
    });

    expect(screen.getByRole('checkbox').query()).toBeNull();
  });

  it('does not render the missing-values checkbox when the filter does not support missing values', async () => {
    const filter = new TextFilter(createBaseKwArgs('text-filter', 'Search name'));
    filter.supportsMissingValuesFilter = false;
    const screen = await renderTableFilter({ filter });

    expect(screen.getByRole('checkbox').query()).toBeNull();
  });

  it('labels the checkbox "Select missing values" while the filter has its initial value', async () => {
    const screen = await renderTableFilter({
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    });

    await expect.element(screen.getByText(SELECT_MISSING_VALUES_LABEL)).toBeInTheDocument();
    await expect.element(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('labels the checkbox "Include missing values" when the filter has a value', async () => {
    const screen = await renderTableFilter({
      defaultValues: { 'text-filter': 'alpha' },
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    });

    await expect.element(screen.getByText(INCLUDE_MISSING_VALUES_LABEL)).toBeInTheDocument();
    await expect.element(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('shows the tooltip for selecting missing values while the filter has its initial value', async () => {
    const screen = await renderTableFilter({
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    });

    await userEvent.hover(screen.getByText(SELECT_MISSING_VALUES_LABEL));

    await expect.element(page.getByRole('tooltip')).toHaveTextContent(SELECT_MISSING_VALUES_TOOLTIP);
  });

  it('shows the tooltip for including missing values when the filter has a value', async () => {
    const screen = await renderTableFilter({
      defaultValues: { 'text-filter': 'alpha' },
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    });

    await userEvent.hover(screen.getByText(INCLUDE_MISSING_VALUES_LABEL));

    await expect.element(page.getByRole('tooltip')).toHaveTextContent(INCLUDE_MISSING_VALUES_TOOLTIP);
  });

  it('reflects the filter includeMissingValues state in the checkbox', async () => {
    const filter = new TextFilter(createBaseKwArgs('text-filter', 'Search name'));
    filter.setIncludeMissingValues(true);
    const screen = await renderTableFilter({ filter });

    await expect.element(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles the checkbox when clicked', async () => {
    const screen = await renderTableFilter({
      filter: new TextFilter(createBaseKwArgs('text-filter', 'Search name')),
    });
    const checkbox = screen.getByRole('checkbox');

    await expect.element(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect.element(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect.element(checkbox).not.toBeChecked();
  });
});
