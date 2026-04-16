import { createStore } from 'zustand';
import type { CaseDbOutage } from '@gen-epix/api-casedb';

import type { CategorizedOutages } from '../../models/outage';

export type OutagesStore = OutagesStoreActions & OutagesStoreState;

export interface OutagesStoreActions {
  setCategorizedOutages: (categorizedOutages: CategorizedOutages) => void;
}

export interface OutagesStoreState {
  activeOutages: CaseDbOutage[];
  soonActiveOutages: CaseDbOutage[];
  visibleOutages: CaseDbOutage[];
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
