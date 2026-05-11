import { use } from 'react';

import type { CaseAbacContext } from './CaseAbacContext';
import { EpiCaseAbacContext } from './CaseAbacContext';

export const useCaseAbacContext = (): CaseAbacContext => use(EpiCaseAbacContext);
