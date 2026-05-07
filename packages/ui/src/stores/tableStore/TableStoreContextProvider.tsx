import type { StoreApi } from 'zustand';
import type { PropsWithChildren } from 'react';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export type TableStoreContextProviderProps<TData, TContext = null> = PropsWithChildren<{
  readonly store: StoreApi<TableStore<TData, TContext>>;
}>;

export const TableStoreContextProvider = <TData, TContext = null>(
  props: TableStoreContextProviderProps<TData, TContext>,
) => {
  const { children, store } = props;
  return (
    <TableStoreContext value={store as StoreApi<TableStore<unknown, unknown>>}>
      {children}
    </TableStoreContext>
  );
};
