import {
  describe,
  expect,
  it,
} from 'vitest';
import { page } from 'vitest/browser';

import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableHeader } from './TableHeader';

type TestRow = {
  id: string;
  name: string;
};

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

const rows: TestRow[] = [
  { id: 'row-0', name: 'Name 0' },
  { id: 'row-1', name: 'Name 1' },
];

const renderHeader = async (props: { header?: string; headerComponent?: 'h2' | 'p'; headerVariant?: 'body1' | 'h4'; showTableMenu?: boolean } = {}) => {
  const store = await createStore(rows);
  return renderComponent(
    <TableStoreContextProvider store={store}>
      <TableHeader
        header={props.header}
        headerComponent={props.headerComponent}
        headerVariant={props.headerVariant}
        showTableMenu={props.showTableMenu}
      />
    </TableStoreContextProvider>,
  );
};

describe('TableHeader', () => {
  it('should show the caption and the table menu by default', async () => {
    await renderHeader({ header: 'Patients' });

    await expect.element(page.getByRole('heading', { exact: true, level: 3, name: 'Patients (2)' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Columns' })).toBeVisible();
  });

  it('should render the caption with the given component', async () => {
    await renderHeader({ header: 'Patients', headerComponent: 'h2' });

    await expect.element(page.getByRole('heading', { exact: true, level: 2, name: 'Patients (2)' })).toBeVisible();
  });

  it('should render the caption with the given variant', async () => {
    await renderHeader({ header: 'Patients', headerComponent: 'p', headerVariant: 'body1' });

    await expect.element(page.getByText('Patients (2)', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Patients (2)' })).not.toBeInTheDocument();
  });

  it('should not render the caption when there is no header', async () => {
    await renderHeader();

    await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Columns' })).toBeVisible();
  });

  it('should not render the table menu when showTableMenu is false', async () => {
    await renderHeader({ header: 'Patients', showTableMenu: false });

    await expect.element(page.getByRole('heading', { exact: true, level: 3, name: 'Patients (2)' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('should render nothing but the menu when there is no header and showTableMenu is false', async () => {
    await renderHeader({ showTableMenu: false });

    await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });
});
