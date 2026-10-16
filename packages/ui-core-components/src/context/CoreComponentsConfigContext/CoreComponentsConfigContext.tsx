import { createContext } from 'react';

export type CoreComponentsConfig = {
  spinner: {
    defaultCircularProgressSize: number | string;
    defaultTakingLongerTimeoutMs: number;
  };
};

export const CoreComponentsConfigContext = createContext<CoreComponentsConfig>(null);
