import type { UiCoreComponentsConfig } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';
import { createContext } from 'react';

import type { UiClientCommonContainer } from '../../classes/containers/UiClientCommonContainer';
import type { ConfigBase } from '../../models/config.models';

export type UiClientCommonConfig<TConfig extends ConfigBase = ConfigBase> = {
  config: TConfig;
  container: UiClientCommonContainer;
  uiCoreComponentsConfig: UiCoreComponentsConfig;
};

export const UiClientCommonConfigContext = createContext<UiClientCommonConfig>(null);
