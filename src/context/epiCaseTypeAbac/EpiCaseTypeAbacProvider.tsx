import {
  useMemo,
  type PropsWithChildren,
} from 'react';


import { EpiAbacUtil } from '../../utils/EpiAbacUtil';

import type { EpiCaseTypeAbacContextValue } from './EpiCaseTypeAbacContext';
import { EpiCaseTypeAbacContext } from './EpiCaseTypeAbacContext';

export type EpiCaseTypeAbacProviderProps = PropsWithChildren<{
  readonly caseTypeAbac: EpiCaseTypeAbacContextValue;
}>;

export const EpiCaseTypeAbacProvider = (
  props: EpiCaseTypeAbacProviderProps,
) => {
  const { children, caseTypeAbac } = props;

  const sanitizedCaseAbac = useMemo<EpiCaseTypeAbacContextValue>(() => {
    const caseTypeAccessAbacs = Object.values(caseTypeAbac.caseTypeAccessAbacDict).filter(x => !!caseTypeAbac.userDataCollectionsMap.get(x.data_collection_id)).sort((a, b) => {
      const aDataCollection = caseTypeAbac.userDataCollectionsMap.get(a.data_collection_id);
      const bDataCollection = caseTypeAbac.userDataCollectionsMap.get(b.data_collection_id);
      return aDataCollection?.name.localeCompare(bDataCollection?.name) ?? 0;
    });

    return {
      ...caseTypeAbac,
      caseTypeAccessAbacs,
      effectiveColumnAccessRights: EpiAbacUtil.createEffectieveColumnAccessRights(caseTypeAccessAbacs),
    } satisfies EpiCaseTypeAbacContextValue;
  }, [caseTypeAbac]);

  return (
    <EpiCaseTypeAbacContext.Provider value={sanitizedCaseAbac}>
      {children}
    </EpiCaseTypeAbacContext.Provider>
  );
};
