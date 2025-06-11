import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '../../api';
import { useCaseTypeSetsMapQuery } from '../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionsMapQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useUsersMapQuery } from '../../dataHooks/useUsersQuery';
import type { UseNameFactory } from '../../models/dataHooks';
import { DataUtil } from '../../utils/DataUtil';

export const useUserCasePolicyNameFactory = (): UseNameFactory<UserAccessCasePolicy | UserShareCasePolicy> => {
  const [t] = useTranslation();

  const usersMapQuery = useUsersMapQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();

  return useMemo(() => {
    const getName = (item: UserAccessCasePolicy | UserShareCasePolicy) => {

      const user = usersMapQuery.map.get(item.user_id);
      const dataCollection = dataCollectionsMapQuery.map.get(item.data_collection_id)?.name ?? item.data_collection_id;
      const caseTypeSet = caseTypeSetsMapQuery.map.get(item.case_type_set_id)?.name ?? item.case_type_set_id;

      const userName = DataUtil.getUserDisplayValue(user, t);

      return `${userName} → ${dataCollection} → ${caseTypeSet}`;
    };

    return DataUtil.createUseNameFactoryHook(getName, [caseTypeSetsMapQuery, usersMapQuery, dataCollectionsMapQuery]);

  }, [caseTypeSetsMapQuery, usersMapQuery, dataCollectionsMapQuery, t]);
};
