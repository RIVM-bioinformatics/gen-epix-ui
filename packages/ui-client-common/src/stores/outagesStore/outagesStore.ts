import { createStore } from 'zustand';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import type { CategorizedOutages } from '../../models/outage';

export type OutagesStore = OutagesStoreActions & OutagesStoreState;

export interface OutagesStoreActions {
  setCategorizedOutages: (categorizedOutages: CategorizedOutages) => void;
}

export interface OutagesStoreState {
  activeOutages: CommonDbOutage[];
  soonActiveOutages: CommonDbOutage[];
  visibleOutages: CommonDbOutage[];
}

const createOutagesStoreDefaultState: () => OutagesStoreState = () => ({
  activeOutages: [],
  soonActiveOutages: [],
  visibleOutages: [],
});

export const outagesStore = createStore<OutagesStore>()((set) => {
  return {
    ...createOutagesStoreDefaultState(),
    setCategorizedOutages: (categorizedOutages: CategorizedOutages) => {
      set(categorizedOutages);
    },
  };
});
