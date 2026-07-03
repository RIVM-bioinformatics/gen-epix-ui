import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { createContext } from 'react';
import type { Subject } from '@gen-epix/ui';

import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../../models/caseDb';

export type DashboardContextValue = {
  caseSet?: CaseDbCaseSet;
  highlight: (highlighting: Highlighting) => void;
  highlightSubject: Subject<Highlighting>;
  lineListRangeSubject: Subject<LineListRangeSubjectValue>;
  linkedScrollSubject: Subject<LinkedScrollSubjectValue>;
  reset: () => void;
};

export const DashboardContext = createContext<DashboardContextValue>(null);
