import { createStore } from 'zustand';

import type { Outage } from '../../api';
import type { CategorizedOutages } from '../../models/outage';

export interface OutagesStoreState {
  visibleOutages: Outage[];
  activeOutages: Outage[];
  soonActiveOutages: Outage[];
}

export interface OutagesStoreActions {
  setCategorizedOutages: (categorizedOutages: CategorizedOutages) => void;
}

export type OutagesStore = OutagesStoreState & OutagesStoreActions;

const createOutagesStoreDefaultState: () => OutagesStoreState = () => ({
  visibleOutages: [],
  activeOutages: [],
  soonActiveOutages: [],
});

export const outagesStore = createStore<OutagesStore>()((set) => {
  return {
    ...createOutagesStoreDefaultState(),
    setCategorizedOutages: (categorizedOutages: CategorizedOutages) => {
      set(categorizedOutages);
    },
  };
});
