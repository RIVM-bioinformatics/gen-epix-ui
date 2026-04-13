import { createContext } from 'react';
import type {
  CaseDataCollectionLink,
  CaseRights,
  CaseSetDataCollectionLink,
  CaseSetRights,
  DataCollection,
} from '@gen-epix/api-casedb';

import type { OptionBase } from '../../models/form';

export type CaseAbacContext = {
  createdInDataCollection?: DataCollection;
  itemDataCollectionLinks: Array<Array<CaseDataCollectionLink | CaseSetDataCollectionLink>>;
  itemDataCollectionOptions?: Array<OptionBase<string>[]>;
  itemDataCollections?: Array<DataCollection[]>;
  itemSharedInDataCollections?: Array<DataCollection[]>;
  rights: Array<CaseRights | CaseSetRights>;
  userDataCollectionOptions: OptionBase<string>[];
  userDataCollections: DataCollection[];
  userDataCollectionsMap: Map<string, DataCollection>;
};

export const EpiCaseAbacContext = createContext<CaseAbacContext>(null);
