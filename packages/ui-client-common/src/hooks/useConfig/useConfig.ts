import type { ConfigBase } from '../../models/config.models';
import { useClientCommonConfigContext } from '../../context/ClientCommonConfigContext';

export const useConfig = <TConfig extends ConfigBase = ConfigBase>(): TConfig => {
  return useClientCommonConfigContext<TConfig>().config;
};
