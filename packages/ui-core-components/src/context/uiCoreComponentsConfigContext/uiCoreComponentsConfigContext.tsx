import { createContext } from 'react';

export type UiCoreComponentsConfig = {
  defaultCircularProgressSize: number;
  defaultTakingLongerTimeoutMs: number;
};

export const UiCoreComponentsConfigContext = createContext<UiCoreComponentsConfig>(null);
