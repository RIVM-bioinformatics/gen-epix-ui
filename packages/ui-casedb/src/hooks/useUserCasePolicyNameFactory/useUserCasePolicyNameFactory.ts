import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';
import type { UseNameFactory } from '@gen-epix/ui';
import {
  DataHookUtil,
  DataUtil,
  useUsersMapQuery,
} from '@gen-epix/ui';

import { useCaseTypeSetsMapQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionsMapQuery } from '../../dataHooks/useDataCollectionsQuery';

export const useUserCasePolicyNameFactory = (): UseNameFactory<CaseDbUserAccessCasePolicy | CaseDbUserShareCasePolicy> => {
  const { t } = useTranslation();

  const usersMapQuery = useUsersMapQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();

  return useMemo(() => {
    const getName = (item: CaseDbUserAccessCasePolicy | CaseDbUserShareCasePolicy) => {

      const user = usersMapQuery.map.get(item.user_id);
      const dataCollection = dataCollectionsMapQuery.map.get(item.data_collection_id)?.name ?? item.data_collection_id;
      const caseTypeSet = caseTypeSetsMapQuery.map.get(item.case_type_set_id)?.name ?? item.case_type_set_id;

      const userName = DataUtil.getUserDisplayValue(user, t);

      return `${userName} → ${dataCollection} → ${caseTypeSet}`;
    };

    return DataHookUtil.createUseNameFactoryHook(getName, [caseTypeSetsMapQuery, usersMapQuery, dataCollectionsMapQuery]);

  }, [caseTypeSetsMapQuery, usersMapQuery, dataCollectionsMapQuery, t]);
};
