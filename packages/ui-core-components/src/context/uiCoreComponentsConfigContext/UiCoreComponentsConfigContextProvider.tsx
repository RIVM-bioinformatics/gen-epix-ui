import type { PropsWithChildren } from 'react';

import type { UiCoreComponentsConfig } from './uiCoreComponentsConfigContext';
import { UiCoreComponentsConfigContext } from './uiCoreComponentsConfigContext';


export type UiCoreComponentsContextProviderProps = PropsWithChildren<{
  readonly config: UiCoreComponentsConfig;
}>;

export const UiCoreComponentsContextProvider = (
  props: UiCoreComponentsContextProviderProps,
) => {
  const { children, config } = props;
  return (
    <UiCoreComponentsConfigContext value={config}>
      {children}
    </UiCoreComponentsConfigContext>
  );
};
