import { useContext } from 'react';

import type { EpiCaseAbacContextValue } from './EpiCaseAbacContext';
import { EpiCaseAbacContext } from './EpiCaseAbacContext';

export const useEpiCaseAbacContext = (): EpiCaseAbacContextValue => useContext(EpiCaseAbacContext);
