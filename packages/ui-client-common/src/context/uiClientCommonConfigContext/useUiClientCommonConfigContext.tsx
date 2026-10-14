import { use } from 'react';

import type { ConfigBase } from '../../models/config.models';

import type { UiClientCommonConfig } from './UiClientCommonConfigContext';
import { UiClientCommonConfigContext } from './UiClientCommonConfigContext';

export const useUiClientCommonConfigContext = <TConfig extends ConfigBase = ConfigBase>(): UiClientCommonConfig<TConfig> => {
  const config = use(UiClientCommonConfigContext);
  if (!config) {
    throw new Error('UiClientCommonConfigContext is not available');
  }
  return config as UiClientCommonConfig<TConfig>;
};
