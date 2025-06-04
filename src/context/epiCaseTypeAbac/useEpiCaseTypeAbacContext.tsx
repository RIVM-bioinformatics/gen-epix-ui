import { useContext } from 'react';

import type { EpiCaseTypeAbacContextValue } from './EpiCaseTypeAbacContext';
import { EpiCaseTypeAbacContext } from './EpiCaseTypeAbacContext';

export const useEpiCaseTypeAbacContext = (): EpiCaseTypeAbacContextValue => useContext(EpiCaseTypeAbacContext);
