import type { UiCoreComponentsConfig } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';
import { createContext } from 'react';
import type { DependencyContainer } from 'tsyringe';

import type { ConfigBase } from '../../models/config.models';

export type UiClientCommonConfig<TConfig extends ConfigBase = ConfigBase> = {
  config: TConfig;
  container: DependencyContainer;
  uiCoreComponentsConfig: UiCoreComponentsConfig;
};

export const UiClientCommonConfigContext = createContext<UiClientCommonConfig>(null);
