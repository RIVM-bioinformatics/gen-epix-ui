import {
  describe,
  expect,
  it,
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

import { TableCaption } from './TableCaption';

type TestRow = {
  id: string;
  name: string;
};

const createRows = (count: number): TestRow[] => Array.from({ length: count }, (_, index) => ({
  id: `row-${index}`,
  name: `Name ${index}`,
}));

const createStore = async (rows: TestRow[]) => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'name',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
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
  store.getState().setBaseData(rows);
  await store.getState().initialize(new AbortController().signal);
  return store;
};

const renderCaption = async (
  store: Awaited<ReturnType<typeof createStore>>,
  props: { caption?: string; component?: 'h3' | 'p'; variant?: 'body1' | 'h2' } = {},
) => renderComponent(
  <TableStoreContextProvider store={store}>
    <TableCaption<TestRow>
      caption={props.caption}
      component={props.component}
      variant={props.variant ?? 'h2'}
    />
  </TableStoreContextProvider>,
);

describe('TableCaption', () => {
  it('should show the caption alone when there is no data', async () => {
    const store = await createStore([]);
    await renderCaption(store, { caption: 'Patients' });

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Patients' })).toBeVisible();
  });

  it('should fall back to "Items" when there is no data and no caption', async () => {
    const store = await createStore([]);
    await renderCaption(store);

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Items' })).toBeVisible();
  });

  it('should show the total count when all rows are shown', async () => {
    const store = await createStore(createRows(3));
    await renderCaption(store, { caption: 'Patients' });

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Patients (3)' })).toBeVisible();
  });

  it('should fall back to "Items" for the count when there is no caption', async () => {
    const store = await createStore(createRows(2));
    await renderCaption(store);

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Items (2)' })).toBeVisible();
  });

  it('should show the filtered count and total when only some rows are shown', async () => {
    const store = await createStore(createRows(3));
    await renderCaption(store, { caption: 'Patients' });
    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Patients (3)' })).toBeVisible();

    const nameFilter = new TextFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      id: 'name',
      label: 'name',
    });
    store.getState().setFilters([nameFilter], [], [DEFAULT_FILTER_GROUP]);
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 1' });

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Patients (1 of 3)' })).toBeVisible();
  });

  it('should fall back to "Items" for the filtered count when there is no caption', async () => {
    const store = await createStore(createRows(3));
    await renderCaption(store);

    const nameFilter = new TextFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      id: 'name',
      label: 'name',
    });
    store.getState().setFilters([nameFilter], [], [DEFAULT_FILTER_GROUP]);
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 2' });

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Items (1 of 3)' })).toBeVisible();
  });

  it('should render the caption with the given component and variant', async () => {
    const store = await createStore([]);
    await renderCaption(store, { caption: 'Patients', component: 'h3', variant: 'body1' });

    const captionElement = page.getByRole('heading', { exact: true, level: 3, name: 'Patients' }).element();
    expect(captionElement.tagName).toBe('H3');
    expect(captionElement.classList.contains('MuiTypography-body1')).toBe(true);
  });
});
