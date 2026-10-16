import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { CoreComponentsConfigContext } from '@gen-epix/ui-core-components/context/CoreComponentsConfigContext';
import type { DependencyContainer } from 'tsyringe';

import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import type { ConfigBase } from '../../models/config.models';

import type { ClientCommonConfig } from './ClientCommonConfigContext';
import { ClientCommonConfigContext } from './ClientCommonConfigContext';


export type ClientCommonConfigContextProviderProps = PropsWithChildren<{
  readonly container: DependencyContainer;
}>;

export const ClientCommonConfigContextProvider = (
  props: ClientCommonConfigContextProviderProps,
) => {
  const { children, container } = props;
  const config = DependencyContainerUtil.resolveConfig<ConfigBase>(container);
  const coreComponentsConfig = useMemo<ClientCommonConfig['coreComponentsConfig']>(() => ({
    spinner: {
      defaultCircularProgressSize: config.spinner.DEFAULT_CIRCULAR_PROGRESS_SIZE,
      defaultTakingLongerTimeoutMs: config.spinner.DEFAULT_TAKING_LONGER_TIMEOUT_MS,
    },
  }), [config.spinner]);
  const uiClientCommonConfig = useMemo(() => ({ config, container, coreComponentsConfig }), [config, container, coreComponentsConfig]);

  return (
    <CoreComponentsConfigContext value={coreComponentsConfig}>
      <ClientCommonConfigContext value={uiClientCommonConfig}>
        {children}
      </ClientCommonConfigContext>
    </CoreComponentsConfigContext>
  );
};
