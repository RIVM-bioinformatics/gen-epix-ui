import { use } from 'react';

import type { UiCoreComponentsConfig } from './uiCoreComponentsConfigContext';
import { UiCoreComponentsConfigContext } from './uiCoreComponentsConfigContext';

export const useUiCoreComponentsConfigContext = (): UiCoreComponentsConfig => use(UiCoreComponentsConfigContext);
