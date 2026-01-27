import {
  useMemo,
  type PropsWithChildren,
} from 'react';


import { AbacUtil } from '../../utils/AbacUtil';

import type { CaseTypeAbacContext } from './CaseTypeAbacContext';
import { EpiCaseTypeAbacContext } from './CaseTypeAbacContext';

export type CaseTypeAbacContextProviderProps = PropsWithChildren<{
  readonly caseTypeAbac: CaseTypeAbacContext;
}>;

export const CaseTypeAbacContextProvider = (
  props: CaseTypeAbacContextProviderProps,
) => {
  const { children, caseTypeAbac } = props;

  const sanitizedCaseAbac = useMemo<CaseTypeAbacContext>(() => {
    const caseTypeAccessAbacs = Object.values(caseTypeAbac.caseTypeAccessAbacDict).filter(x => !!caseTypeAbac.userDataCollectionsMap.get(x.data_collection_id)).sort((a, b) => {
      const aDataCollection = caseTypeAbac.userDataCollectionsMap.get(a.data_collection_id);
      const bDataCollection = caseTypeAbac.userDataCollectionsMap.get(b.data_collection_id);
      return aDataCollection?.name.localeCompare(bDataCollection?.name) ?? 0;
    });

    return {
      ...caseTypeAbac,
      caseTypeAccessAbacs,
      effectiveColumnAccessRights: AbacUtil.createEffectieveColumnAccessRights(caseTypeAccessAbacs),
    } satisfies CaseTypeAbacContext;
  }, [caseTypeAbac]);

  return (
    <EpiCaseTypeAbacContext.Provider value={sanitizedCaseAbac}>
      {children}
    </EpiCaseTypeAbacContext.Provider>
  );
};
