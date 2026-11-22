import {
  describe,
  expect,
  it,
} from 'vitest';
import type { StoreApi } from 'zustand';

import { renderComponent } from '../../test/lib';

import { createTableStore } from './tableStore';
import type { TableStore } from './tableStore';
import { TableStoreContextProvider } from './TableStoreContextProvider';
import { useTableStoreContext } from './useTableStoreContext';

type TestRow = {
  id: string;
};

const StoreProbe = () => {
  const store: null | StoreApi<TableStore<TestRow>> = useTableStoreContext<TestRow>();
  return (
    <div>
      {store ? `Sort field: ${store.getState().defaultSortByField}` : 'No table store'}
    </div>
  );
};

describe('useTableStoreContext', () => {
  it('returns the store of the nearest TableStoreContextProvider', async () => {
    const store = createTableStore<TestRow>({
      defaultSortByField: 'name',
      idSelectorCallback: (row) => row.id,
    });

    const screen = await renderComponent(
      <TableStoreContextProvider store={store}>
        <StoreProbe />
      </TableStoreContextProvider>,
    );

    await expect.element(screen.getByText('Sort field: name')).toBeInTheDocument();
  });

  it('returns null when no TableStoreContextProvider is above the caller', async () => {
    const screen = await renderComponent(
      <StoreProbe />,
    );

    await expect.element(screen.getByText('No table store')).toBeInTheDocument();
  });
});
