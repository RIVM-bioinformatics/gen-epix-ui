import { createContext } from 'react';
import type {
  CaseDbCaseDataCollectionLink,
  CaseDbCaseRights,
  CaseDbCaseSetDataCollectionLink,
  CaseDbCaseSetRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';

import type { OptionBase } from '../../models/form';

export type CaseAbacContext = {
  createdInDataCollection?: CaseDbDataCollection;
  itemDataCollectionLinks: Array<Array<CaseDbCaseDataCollectionLink | CaseDbCaseSetDataCollectionLink>>;
  itemDataCollectionOptions?: Array<OptionBase<string>[]>;
  itemDataCollections?: Array<CaseDbDataCollection[]>;
  itemSharedInDataCollections?: Array<CaseDbDataCollection[]>;
  rights: Array<CaseDbCaseRights | CaseDbCaseSetRights>;
  userDataCollectionOptions: OptionBase<string>[];
  userDataCollections: CaseDbDataCollection[];
  userDataCollectionsMap: Map<string, CaseDbDataCollection>;
};

export const EpiCaseAbacContext = createContext<CaseAbacContext>(null);
