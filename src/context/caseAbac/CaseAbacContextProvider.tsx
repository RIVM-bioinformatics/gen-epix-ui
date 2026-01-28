import {
  useMemo,
  type PropsWithChildren,
} from 'react';

import type { CaseAbacContext } from './CaseAbacContext';
import { EpiCaseAbacContext } from './CaseAbacContext';

export type CaseAbacContextProviderProps = PropsWithChildren<{
  readonly caseAbac: CaseAbacContext;
}>;

export const CaseAbacContextProvider = (
  props: CaseAbacContextProviderProps,
) => {
  const { children, caseAbac } = props;

  const sanitizedCaseAbac = useMemo<CaseAbacContext>(() => {
    const itemDataCollections = caseAbac.rights.map(right => {
      return right.data_collection_ids.map(id => {
        return caseAbac.userDataCollectionsMap.get(id);
      }).filter(x => !!x);
    });
    const itemSharedInDataCollections = itemDataCollections.map((itemDataCollection, index) => {
      const sharedInDataCollectionIds = caseAbac.rights[index].shared_in_data_collection_ids;
      return itemDataCollection.filter(item => sharedInDataCollectionIds.includes(item.id));
    });
    const itemDataCollectionOptions = caseAbac.rights.map(right => {
      if (!caseAbac.userDataCollectionOptions.length || !right) {
        return [];
      }
      return caseAbac.userDataCollectionOptions.map(x => {
        const optionDataCollectionId = x.value;
        const isSelected = right.shared_in_data_collection_ids?.includes(optionDataCollectionId);
        const canAdd = optionDataCollectionId !== right.created_in_data_collection_id && (right.is_full_access || right.add_data_collection_ids?.includes(optionDataCollectionId));
        const canRemove = right.is_full_access || right.remove_data_collection_ids?.includes(optionDataCollectionId);
        let disabled = false;
        if (isSelected && !canRemove) {
          disabled = true;
        } else if (!isSelected && !canAdd) {
          disabled = true;
        }
        return {
          ...x,
          disabled,
        };
      }).filter(x => {
        const isSelected = right.shared_in_data_collection_ids?.includes(x.value);
        if (x.disabled && !isSelected) {
          return false;
        }
        return true;
      });
    });

    return {
      ...caseAbac,
      itemDataCollections,
      itemSharedInDataCollections,
      itemDataCollectionOptions,
    } satisfies CaseAbacContext;
  }, [caseAbac]);

  return (
    <EpiCaseAbacContext.Provider value={sanitizedCaseAbac}>
      {children}
    </EpiCaseAbacContext.Provider>
  );
};
