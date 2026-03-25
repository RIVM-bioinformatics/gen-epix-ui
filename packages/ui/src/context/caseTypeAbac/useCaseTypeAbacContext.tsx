import { useContext } from 'react';

import type { CaseTypeAbacContext } from './CaseTypeAbacContext';
import { EpiCaseTypeAbacContext } from './CaseTypeAbacContext';

export const useCaseTypeAbacContext = (): CaseTypeAbacContext => useContext(EpiCaseTypeAbacContext);
