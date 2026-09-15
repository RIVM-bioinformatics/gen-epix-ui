import { createContext } from 'react';

export type UiCoreComponentsConfig = {
  spinner: {
    defaultCircularProgressSize: number | string;
    defaultTakingLongerTimeoutMs: number;
  };
};

export const UiCoreComponentsConfigContext = createContext<UiCoreComponentsConfig>(null);
