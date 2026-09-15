import { use } from 'react';

import type { UiClientCommonConfig } from './UiClientCommonConfigContext';
import { UiClientCommonConfigContext } from './UiClientCommonConfigContext';

export const useUiClientCommonConfigContext = (): UiClientCommonConfig => use(UiClientCommonConfigContext);
