import {
  useCallback,
  useMemo,
} from 'react';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import type {
  User,
  OrganizationAccessCasePolicy,
  UserAccessCasePolicy,
} from '../../../api';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useOrganizationAccessCasePoliciesQuery } from '../../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../../../dataHooks/useUserAccessCasePoliciesQuery';
import { useArray } from '../../../hooks/useArray';
import { useCaseTypeSetMembersQuery } from '../../../dataHooks/useCaseTypeSetMembersQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useCaseTypeColMapQuery } from '../../../dataHooks/useCaseTypeColsQuery';
import { useCaseTypeColSetMembersQuery } from '../../../dataHooks/useCaseTypeColSetMembersQuery';
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import type { TableColumn } from '../../../models/table';
import { TableUtil } from '../../../utils/TableUtil';
import {
  Table,
  TableHeader,
} from '../../ui/Table';

export type EpiUserRightsDialogCaseAccessPolicyProps = {
  readonly user: User;
};

type AccessCasePolity = Omit<OrganizationAccessCasePolicy & UserAccessCasePolicy, 'id' | 'user_id' | 'is_active' | 'case_type_set_id'> & {
  readonly case_type_set_ids: string[];
  readonly write_case_type_col_ids: string[];
  readonly read_case_type_col_ids?: string[];
};

export const EpiUserRightsDialogCaseAccessPolicy = ({ user }: EpiUserRightsDialogCaseAccessPolicyProps) => {
  const { t } = useTranslation();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const userAccessCasePoliciesQuery = useUserAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const caseTypeColSetMembersQuery = useCaseTypeColSetMembersQuery();
  const caseTypeColMapQuery = useCaseTypeColMapQuery();
  const dataCollectionMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const loadables = useArray([
    organizationAccessCasePoliciesQuery,
    userAccessCasePoliciesQuery,
    caseTypeSetMembersQuery,
    caseTypeMapQuery,
    caseTypeColSetMembersQuery,
    caseTypeColMapQuery,
    dataCollectionMapQuery,
    dataCollectionOptionsQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<AccessCasePolity>({
    defaultSortByField: 'data_collection_id',
    defaultSortDirection: 'asc',
    idSelectorCallback: (entry) => entry.data_collection_id,
    storageNamePostFix: 'EpiUserRightsDialogCaseAccessPolicy-Table',
    storageVersion: 1,
  }), []);

  const effectiveAccessCasePolicies = useMemo<AccessCasePolity[]>(() => {
    const { data: organizationAccessCasePolicies } = organizationAccessCasePoliciesQuery;
    const { data: userAccessCasePolicies } = userAccessCasePoliciesQuery;
    const { data: caseTypeSetMembers } = caseTypeSetMembersQuery;
    const { data: caseTypeColSetMembers } = caseTypeColSetMembersQuery;
    const { map: caseTypeMap } = caseTypeMapQuery;
    const { map: caseTypeColMap } = caseTypeColMapQuery;

    if (!organizationAccessCasePolicies || !userAccessCasePolicies || !caseTypeSetMembers || !caseTypeMap || !caseTypeColSetMembers || !caseTypeColMap) {
      return [];
    }
    return organizationAccessCasePolicies.map(organizationPolicy => {
      const userPolicy = userAccessCasePolicies.find(p => p.data_collection_id === organizationPolicy.data_collection_id);
      if (!userPolicy) {
        return undefined;
      }
      const organizationCaseTypeSetIds = caseTypeSetMembers.filter(member => member.case_type_set_id === organizationPolicy.case_type_set_id).map(member => member.case_type_id);
      const userCaseTypeSetIds = caseTypeSetMembers.filter(member => member.case_type_set_id === userPolicy.case_type_set_id).map(member => member.case_type_id);
      const case_type_set_ids = intersection(organizationCaseTypeSetIds, userCaseTypeSetIds);

      if (!case_type_set_ids.length) {
        return undefined;
      }

      const organizationWriteCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === organizationPolicy.write_case_type_col_set_id).map(member => member.case_type_col_id);
      const userWriteCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === userPolicy.write_case_type_col_set_id).map(member => member.case_type_col_id);
      const write_case_type_col_ids = intersection(organizationWriteCaseTypeColIds, userWriteCaseTypeColIds);

      const organizationReadCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === organizationPolicy.read_case_type_col_set_id).map(member => member.case_type_col_id);
      const userReadCaseTypeColIds = caseTypeColSetMembers.filter(member => member.case_type_col_set_id === userPolicy.read_case_type_col_set_id).map(member => member.case_type_col_id);
      const read_case_type_col_ids = intersection(organizationReadCaseTypeColIds, userReadCaseTypeColIds);

      return {
        add_case: organizationPolicy.add_case && userPolicy.add_case,
        add_case_set: organizationPolicy.add_case_set && userPolicy.add_case_set,
        data_collection_id: organizationPolicy.data_collection_id,
        is_private: organizationPolicy.is_private,
        organization_id: organizationPolicy.organization_id,
        read_case_set: organizationPolicy.read_case_set && userPolicy.read_case_set,
        remove_case: organizationPolicy.remove_case && userPolicy.remove_case,
        remove_case_set: organizationPolicy.remove_case_set && userPolicy.remove_case_set,
        write_case_set: organizationPolicy.write_case_set && userPolicy.write_case_set,
        write_case_type_col_set_id: organizationPolicy.write_case_type_col_set_id,
        read_case_type_col_set_id: organizationPolicy.read_case_type_col_set_id,
        case_type_set_ids,
        write_case_type_col_ids,
        read_case_type_col_ids,
      } satisfies AccessCasePolity;
    }).filter((policy => !!policy));

  }, [caseTypeColMapQuery, caseTypeColSetMembersQuery, caseTypeMapQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, userAccessCasePoliciesQuery]);

  const tableColumns = useMemo<TableColumn<AccessCasePolity>[]>(() => [
    TableUtil.createReadableIndexColumn(),
    TableUtil.createOptionsColumn({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
  ], [dataCollectionOptionsQuery.options, t]);

  const getRowName = useCallback((row: AccessCasePolity) => {
    return dataCollectionMapQuery.map.get(row.data_collection_id)?.name ?? row.data_collection_id;
  }, [dataCollectionMapQuery.map]);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: effectiveAccessCasePolicies });

  return (
    <ResponseHandler
      inlineSpinner
      loadables={loadables}
    >
      <Box sx={{ minHeight: '600px' }}>
        <TableStoreContextProvider store={tableStore}>
          <TableHeader
            header={t`Table`}
            headerComponent={'h6'}
            headerVariant={'h6'}
          />
          <Table
            getRowName={getRowName}
          />
        </TableStoreContextProvider>
      </Box>
    </ResponseHandler>
  );
};
