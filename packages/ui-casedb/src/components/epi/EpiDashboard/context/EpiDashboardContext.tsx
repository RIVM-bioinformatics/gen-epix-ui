import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { createContext } from 'react';
import type { Subject } from '@gen-epix/ui';

import type {
  EpiLineListRangeSubjectValue,
  EpiLinkedScrollSubjectValue,
  Highlighting,
} from '../../../../models/epi';

export type EpiDashboardContextValue = {
  caseSet?: CaseDbCaseSet;
  highlight: (highlighting: Highlighting) => void;
  highlightSubject: Subject<Highlighting>;
  lineListRangeSubject: Subject<EpiLineListRangeSubjectValue>;
  linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  reset: () => void;
};

export const EpiDashboardContext = createContext<EpiDashboardContextValue>(null);
