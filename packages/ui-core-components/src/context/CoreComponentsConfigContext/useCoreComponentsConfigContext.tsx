import { use } from 'react';

import type { CoreComponentsConfig } from './CoreComponentsConfigContext';
import { CoreComponentsConfigContext } from './CoreComponentsConfigContext';

export const useCoreComponentsConfigContext = (): CoreComponentsConfig => use(CoreComponentsConfigContext);
