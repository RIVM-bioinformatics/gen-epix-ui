import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { createTableStore } from './tableStore';
import { TableStoreContextProvider } from './TableStoreContextProvider';
import { useTableStoreContext } from './useTableStoreContext';

type TestRow = {
  id: string;
};

const createTestStore = (defaultSortByField: string) => createTableStore<TestRow>({
  defaultSortByField,
  idSelectorCallback: (row) => row.id,
});

const StoreSortField = () => {
  const store = useTableStoreContext<TestRow>();
  return (
    <div>
      {`Sort field: ${store.getState().defaultSortByField}`}
    </div>
  );
};

describe('TableStoreContextProvider', () => {
  it('renders its children', async () => {
    const store = createTestStore('name');

    const screen = await renderComponent(
      <TableStoreContextProvider store={store}>
        <div>
          {'Table child'}
        </div>
      </TableStoreContextProvider>,
    );

    await expect.element(screen.getByText('Table child')).toBeInTheDocument();
  });

  it('provides the given store to descendants that use the table store context', async () => {
    const store = createTestStore('name');

    const screen = await renderComponent(
      <TableStoreContextProvider store={store}>
        <StoreSortField />
      </TableStoreContextProvider>,
    );

    await expect.element(screen.getByText('Sort field: name')).toBeInTheDocument();
  });
});
