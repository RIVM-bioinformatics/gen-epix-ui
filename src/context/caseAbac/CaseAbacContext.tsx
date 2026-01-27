import { createContext } from 'react';

import type {
  DataCollection,
  CaseSetDataCollectionLink,
  CaseDataCollectionLink,
  CaseSetRights,
  CaseRights,
} from '../../api';
import type { OptionBase } from '../../models/form';

export type CaseAbacContext = {
  userDataCollections: DataCollection[];
  userDataCollectionsMap: Map<string, DataCollection>;
  userDataCollectionOptions: OptionBase<string>[];
  itemDataCollectionLinks: Array<Array<CaseSetDataCollectionLink | CaseDataCollectionLink>>;
  itemDataCollections?: Array<DataCollection[]>;
  itemSharedInDataCollections?: Array<DataCollection[]>;
  itemDataCollectionOptions?: Array<OptionBase<string>[]>;
  createdInDataCollection?: DataCollection;
  rights: Array<CaseSetRights | CaseRights>;
};

export const EpiCaseAbacContext = createContext<CaseAbacContext>(null);
