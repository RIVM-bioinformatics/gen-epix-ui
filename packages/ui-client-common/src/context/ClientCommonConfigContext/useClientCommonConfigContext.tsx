import { use } from 'react';

import type { ConfigBase } from '../../models/config.models';

import type { ClientCommonConfig } from './ClientCommonConfigContext';
import { ClientCommonConfigContext } from './ClientCommonConfigContext';

export const useClientCommonConfigContext = <TConfig extends ConfigBase = ConfigBase>(): ClientCommonConfig<TConfig> => {
  const config = use(ClientCommonConfigContext);
  if (!config) {
    throw new Error('ClientCommonConfigContext is not available');
  }
  return config as ClientCommonConfig<TConfig>;
};
