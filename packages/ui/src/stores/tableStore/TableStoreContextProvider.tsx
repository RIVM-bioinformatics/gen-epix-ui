import type { StoreApi } from 'zustand';
import type { PropsWithChildren } from 'react';

import type { TableStore } from './tableStore';
import { TableStoreContext } from './TableStoreContext';

export type TableStoreContextProviderProps<TData, TDataContext = null> = PropsWithChildren<{
  readonly store: StoreApi<TableStore<TData, TDataContext>>;
}>;

export const TableStoreContextProvider = <TData, TDataContext = null>(
  props: TableStoreContextProviderProps<TData, TDataContext>,
) => {
  const { children, store } = props;
  return (
    <TableStoreContext value={store as StoreApi<TableStore<unknown, unknown>>}>
      {children}
    </TableStoreContext>
  );
};
