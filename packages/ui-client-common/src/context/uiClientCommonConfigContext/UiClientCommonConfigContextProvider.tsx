import type { PropsWithChildren } from 'react';
import { UiCoreComponentsConfigContext } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';

import type { UiClientCommonConfig } from './UiClientCommonConfigContext';
import { UiClientCommonConfigContext } from './UiClientCommonConfigContext';


export type UiClientCommonConfigContextProviderProps = PropsWithChildren<{
  readonly config: UiClientCommonConfig;
}>;

export const UiClientCommonConfigContextProvider = (
  props: UiClientCommonConfigContextProviderProps,
) => {
  const { children, config } = props;
  return (
    <UiCoreComponentsConfigContext value={config.uiCoreComponentsConfig}>
      <UiClientCommonConfigContext value={config}>
        {children}
      </UiClientCommonConfigContext>
    </UiCoreComponentsConfigContext>
  );
};
