import { use } from 'react';

import type { CaseTypeAbacContext } from './CaseTypeAbacContext';
import { EpiCaseTypeAbacContext } from './CaseTypeAbacContext';

export const useCaseTypeAbacContext = (): CaseTypeAbacContext => use(EpiCaseTypeAbacContext);
