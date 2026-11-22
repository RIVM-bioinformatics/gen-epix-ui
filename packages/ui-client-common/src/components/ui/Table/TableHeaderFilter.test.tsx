import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../../classes/filters/TextFilter';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableHeaderFilter } from './TableHeaderFilter';

type TestRow = {
  id: string;
  name: string;
};

const createRows = (count: number): TestRow[] => Array.from({ length: count }, (_, index) => ({
  id: `row-${index}`,
  name: `Name ${index}`,
}));

const createStore = async ({ showMissingValuesFilter = false }: { showMissingValuesFilter?: boolean } = {}) => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'name',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
    showMissingValuesFilter,
  });
  store.getState().setColumns([
    {
      headerName: 'Name',
      id: 'name',
      isInitiallyVisible: true,
      type: 'text',
      valueGetter: ({ row }) => row.name,
    },
  ]);
  store.getState().setBaseData(createRows(3));
  await store.getState().initialize(new AbortController().signal);

  const nameFilter = new TextFilter({
    filterMode: FILTER_MODE.FRONTEND,
    filterPriority: DEFAULT_FILTER_GROUP,
    id: 'name',
    label: 'Name',
  });
  store.getState().setFilters([nameFilter], [], [DEFAULT_FILTER_GROUP]);
  return { nameFilter, store };
};

const renderTableHeaderFilter = async (
  store: Awaited<ReturnType<typeof createStore>>['store'],
  nameFilter: TextFilter,
  onFilterChange = vi.fn(),
) => {
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <TableHeaderFilter<TestRow, unknown>
        filter={nameFilter}
        onFilterChange={onFilterChange}
      />
    </TableStoreContextProvider>,
  );
  return onFilterChange;
};

const getTextbox = () => page.getByRole('textbox', { exact: true, name: 'Name' });
const getApplyButton = () => page.getByRole('button', { exact: true, name: 'Apply' });
const getRemoveButton = () => page.getByRole('button', { exact: true, name: 'Remove filter' });
// The tooltip title is exposed as the checkbox accessible name while the filter value is initial.
const getMissingValuesCheckbox = () => page.getByRole('checkbox', { exact: true, name: 'When enabled, select only items with missing values.' });

describe('TableHeaderFilter', () => {
  it('should render the filter field labelled with the filter label', async () => {
    const { nameFilter, store } = await createStore();
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getTextbox()).toBeVisible();
  });

  it('should not render the missing values checkbox when the table does not show it', async () => {
    const { nameFilter, store } = await createStore({ showMissingValuesFilter: false });
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getTextbox()).toBeVisible();
    expect(getMissingValuesCheckbox().query()).toBeNull();
  });

  it('should render the missing values checkbox when the table shows it', async () => {
    const { nameFilter, store } = await createStore({ showMissingValuesFilter: true });
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getMissingValuesCheckbox()).toBeVisible();
    await expect.element(getMissingValuesCheckbox()).not.toBeChecked();
  });

  it('should disable Remove filter when no filter is active', async () => {
    const { nameFilter, store } = await createStore();
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getRemoveButton()).toBeDisabled();
  });

  it('should enable Remove filter when a filter value is active', async () => {
    const { nameFilter, store } = await createStore();
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 1' });
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getRemoveButton()).toBeEnabled();
  });

  it('should disable Apply until the form is changed', async () => {
    const { nameFilter, store } = await createStore();
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 1' });
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getApplyButton()).toBeDisabled();

    await getTextbox().fill('Name 2');

    await expect.element(getApplyButton()).toBeEnabled();
  });

  it('should apply the entered value and call onFilterChange', async () => {
    const { nameFilter, store } = await createStore();
    const onFilterChange = await renderTableHeaderFilter(store, nameFilter);

    await getTextbox().fill('Name 1');
    await getApplyButton().click();

    await expect.poll(() => nameFilter.filterValue).toBe('Name 1');
    await expect.poll(() => onFilterChange).toHaveBeenCalledTimes(1);
    expect(nameFilter.includeMissingValues).toBe(false);
  });

  it('should apply the entered value with missing values excluded when the checkbox is unchecked', async () => {
    const { nameFilter, store } = await createStore({ showMissingValuesFilter: true });
    nameFilter.includeMissingValues = true;
    const onFilterChange = await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getMissingValuesCheckbox()).toBeChecked();
    await getMissingValuesCheckbox().click();
    await expect.element(getMissingValuesCheckbox()).not.toBeChecked();
    await getTextbox().fill('Name 1');
    await getApplyButton().click();

    await expect.poll(() => nameFilter.filterValue).toBe('Name 1');
    await expect.poll(() => onFilterChange).toHaveBeenCalledTimes(1);
    expect(nameFilter.includeMissingValues).toBe(false);
  });

  it('should apply missing values when the checkbox is checked', async () => {
    const { nameFilter, store } = await createStore({ showMissingValuesFilter: true });
    const onFilterChange = await renderTableHeaderFilter(store, nameFilter);

    await getMissingValuesCheckbox().click();
    await expect.element(getMissingValuesCheckbox()).toBeChecked();
    await expect.element(getApplyButton()).toBeEnabled();
    await getApplyButton().click();

    await expect.poll(() => nameFilter.includeMissingValues).toBe(true);
    await expect.poll(() => onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('should remove the filter and call onFilterChange', async () => {
    const { nameFilter, store } = await createStore();
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 1' });
    const onFilterChange = await renderTableHeaderFilter(store, nameFilter);

    await getRemoveButton().click();

    await expect.poll(() => nameFilter.filterValue).toBe('');
    await expect.poll(() => onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('should remove the filter and reset missing values when the table shows them', async () => {
    const { nameFilter, store } = await createStore({ showMissingValuesFilter: true });
    await store.getState().setFilterValue(nameFilter.id, 'Name 1', true);
    const onFilterChange = await renderTableHeaderFilter(store, nameFilter);

    await getRemoveButton().click();

    await expect.poll(() => nameFilter.filterValue).toBe('');
    await expect.poll(() => nameFilter.includeMissingValues).toBe(false);
    await expect.poll(() => onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('should show an empty value when the filter value is undefined', async () => {
    const { nameFilter, store } = await createStore();
    nameFilter.filterValue = undefined;
    await renderTableHeaderFilter(store, nameFilter);

    await expect.element(getTextbox()).toHaveValue('');
  });
});
