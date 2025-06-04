import type { StoreApi } from 'zustand';
import type { PropsWithChildren } from 'react';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export type TableStoreProviderProps<TData> = PropsWithChildren<{
  readonly store: StoreApi<TableStore<TData>>;
}>;

export const TableStoreProvider = <TData, >(
  props: TableStoreProviderProps<TData>,
) => {
  const { children, store } = props;
  return (
    <TableStoreContext.Provider value={store as StoreApi<TableStore<unknown>>}>
      {children}
    </TableStoreContext.Provider>
  );
};
