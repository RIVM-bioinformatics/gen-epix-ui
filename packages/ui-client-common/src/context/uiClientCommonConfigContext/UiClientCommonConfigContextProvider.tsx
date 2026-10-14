import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { UiCoreComponentsConfigContext } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';

import type { UiClientCommonContainer } from '../../classes/containers/UiClientCommonContainer';
import { resolveConfig } from '../../classes/containers/UiClientCommonContainer';
import type { ConfigBase } from '../../models/config.models';

import type { UiClientCommonConfig } from './UiClientCommonConfigContext';
import { UiClientCommonConfigContext } from './UiClientCommonConfigContext';


export type UiClientCommonConfigContextProviderProps = PropsWithChildren<{
  readonly container: UiClientCommonContainer;
}>;

export const UiClientCommonConfigContextProvider = (
  props: UiClientCommonConfigContextProviderProps,
) => {
  const { children, container } = props;
  const config = resolveConfig<ConfigBase>(container);
  const uiCoreComponentsConfig = useMemo<UiClientCommonConfig['uiCoreComponentsConfig']>(() => ({
    spinner: {
      defaultCircularProgressSize: config.spinner.DEFAULT_CIRCULAR_PROGRESS_SIZE,
      defaultTakingLongerTimeoutMs: config.spinner.DEFAULT_TAKING_LONGER_TIMEOUT_MS,
    },
  }), [config.spinner]);
  const uiClientCommonConfig = useMemo(() => ({ config, container, uiCoreComponentsConfig }), [config, container, uiCoreComponentsConfig]);

  return (
    <UiCoreComponentsConfigContext value={uiCoreComponentsConfig}>
      <UiClientCommonConfigContext value={uiClientCommonConfig}>
        {children}
      </UiClientCommonConfigContext>
    </UiCoreComponentsConfigContext>
  );
};
