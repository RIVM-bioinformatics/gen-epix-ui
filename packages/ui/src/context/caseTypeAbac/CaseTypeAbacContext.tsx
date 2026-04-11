import { createContext } from 'react';

import type {
  CaseTypeAccessAbac,
  DataCollection,
} from '../../api';

export type CaseTypeAbacContext = {
  caseTypeAccessAbacDict: { [key: string]: CaseTypeAccessAbac };
  caseTypeAccessAbacs?: CaseTypeAccessAbac[];
  effectiveColumnAccessRights?: Map<string, { read: boolean; write: boolean }>;
  userDataCollections: DataCollection[];
  userDataCollectionsMap: Map<string, DataCollection>;
};

export const EpiCaseTypeAbacContext = createContext<CaseTypeAbacContext>(null);
