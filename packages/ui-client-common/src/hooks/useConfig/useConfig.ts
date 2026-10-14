import type { ConfigBase } from '../../models/config.models';
import { useUiClientCommonConfigContext } from '../../context/uiClientCommonConfigContext';

export const useConfig = <TConfig extends ConfigBase = ConfigBase>(): TConfig => {
  return useUiClientCommonConfigContext<TConfig>().config;
};
