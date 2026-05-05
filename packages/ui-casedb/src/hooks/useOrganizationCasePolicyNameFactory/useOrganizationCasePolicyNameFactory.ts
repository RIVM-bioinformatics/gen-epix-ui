import { useMemo } from 'react';
import type {
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
} from '@gen-epix/api-casedb';

import { useCaseTypeSetsMapQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionsMapQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationMapQuery } from '../../dataHooks/useOrganizationsQuery';
import type { UseNameFactory } from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';

export const useOrganizationCasePolicyNameFactory = (): UseNameFactory<CaseDbOrganizationAccessCasePolicy | CaseDbOrganizationShareCasePolicy> => {
  const organizationMapQuery = useOrganizationMapQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbOrganizationAccessCasePolicy | CaseDbOrganizationShareCasePolicy) => {

      const organization = organizationMapQuery.map.get(item.organization_id);
      const dataCollection = dataCollectionsMapQuery.map.get(item.data_collection_id)?.name ?? item.data_collection_id;
      const caseTypeSet = caseTypeSetsMapQuery.map.get(item.case_type_set_id)?.name ?? item.case_type_set_id;

      return `${organization.name} → ${dataCollection} → ${caseTypeSet}`;
    };

    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeSetsMapQuery, organizationMapQuery, dataCollectionsMapQuery]);

  }, [caseTypeSetsMapQuery, organizationMapQuery, dataCollectionsMapQuery]);
};
