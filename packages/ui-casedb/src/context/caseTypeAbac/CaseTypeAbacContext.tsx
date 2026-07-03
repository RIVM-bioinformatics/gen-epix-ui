import { createContext } from 'react';
import type {
  CaseDbCaseTypeAccessAbac,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';

export type CaseTypeAbacContext = {
  caseTypeAccessAbacDict: { [key: string]: CaseDbCaseTypeAccessAbac };
  caseTypeAccessAbacs?: CaseDbCaseTypeAccessAbac[];
  effectiveColumnAccessRights?: Map<string, { read: boolean; write: boolean }>;
  userDataCollections: CaseDbDataCollection[];
  userDataCollectionsMap: Map<string, CaseDbDataCollection>;
};

// eslint-disable-next-line no-redeclare
export const CaseTypeAbacContext = createContext<CaseTypeAbacContext>(null);
