import { useContext } from 'react';

import { SortableListItemContext } from './SortableListItemContext';

export const useTableStoreContext = () => useContext(SortableListItemContext);
