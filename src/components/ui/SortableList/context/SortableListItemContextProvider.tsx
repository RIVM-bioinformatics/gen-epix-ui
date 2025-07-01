import type { PropsWithChildren } from 'react';

import type { SortableListItemContextValue } from './SortableListItemContext';
import { SortableListItemContext } from './SortableListItemContext';

export type SortableListItemContextProviderProps = PropsWithChildren<{
  readonly value: SortableListItemContextValue;
}>;

export const SortableListItemContextProvider = (
  props: SortableListItemContextProviderProps,
) => {
  const { children, value } = props;
  return (
    <SortableListItemContext.Provider value={value}>
      {children}
    </SortableListItemContext.Provider>
  );
};
