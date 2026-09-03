import type { UiCoreComponentsConfig } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';
import { createContext } from 'react';


export type UiClientCommonConfig = {
  uiCoreComponentsConfig: UiCoreComponentsConfig;
};

export const UiClientCommonConfigContext = createContext<UiClientCommonConfig>(null);
