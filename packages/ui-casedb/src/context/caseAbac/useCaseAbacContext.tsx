import { use } from 'react';

import { CaseAbacContext } from './CaseAbacContext';

export const useCaseAbacContext = (): CaseAbacContext => use(CaseAbacContext);
