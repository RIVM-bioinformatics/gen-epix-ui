import {
  useCallback,
  useMemo,
} from 'react';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type {
  CaseDbOrganizationAccessCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
} from '@gen-epix/api-casedb';

import { ResponseHandler } from '../../ui/ResponseHandler';
import { useOrganizationAccessCasePoliciesQuery } from '../../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../../../dataHooks/useUserAccessCasePoliciesQuery';
import { useArray } from '../../../hooks/useArray';
import { useCaseTypeSetMembersQuery } from '../../../dataHooks/useCaseTypeSetMembersQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useColMapQuery } from '../../../dataHooks/useColsQuery';
import { useColSetMembersQuery } from '../../../dataHooks/useColSetMembersQuery';
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
import { TableUtil } from '../../../utils/CaseDbTableUtil';
import {
  Table,
  TableHeader,
} from '../../ui/Table';

export type EpiUserRightsDialogCaseAccessPolicyProps = {
  readonly user: CaseDbUser;
};

type AccessCasePolity = {
  readonly case_type_set_ids: string[];
  readonly read_col_ids?: string[];
  readonly write_col_ids: string[];
} & Omit<CaseDbOrganizationAccessCasePolicy & CaseDbUserAccessCasePolicy, 'case_type_set_id' | 'id' | 'is_active' | 'user_id'>;

export const EpiUserRightsDialogCaseAccessPolicy = ({ user }: EpiUserRightsDialogCaseAccessPolicyProps) => {
  const { t } = useTranslation();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const userAccessCasePoliciesQuery = useUserAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const colSetMembersQuery = useColSetMembersQuery();
  const colMapQuery = useColMapQuery();
  const dataCollectionMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const loadables = useArray([
    organizationAccessCasePoliciesQuery,
    userAccessCasePoliciesQuery,
    caseTypeSetMembersQuery,
    caseTypeMapQuery,
    colSetMembersQuery,
    colMapQuery,
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
    const { data: colSetMembers } = colSetMembersQuery;
    const { map: caseTypeMap } = caseTypeMapQuery;
    const { map: colMap } = colMapQuery;

    if (!organizationAccessCasePolicies || !userAccessCasePolicies || !caseTypeSetMembers || !caseTypeMap || !colSetMembers || !colMap) {
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

      const organizationWriteColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.write_col_set_id).map(member => member.col_id);
      const userWriteColIds = colSetMembers.filter(member => member.col_set_id === userPolicy.write_col_set_id).map(member => member.col_id);
      const write_col_ids = intersection(organizationWriteColIds, userWriteColIds);

      const organizationReadColIds = colSetMembers.filter(member => member.col_set_id === organizationPolicy.read_col_set_id).map(member => member.col_id);
      const userReadColIds = colSetMembers.filter(member => member.col_set_id === userPolicy.read_col_set_id).map(member => member.col_id);
      const read_col_ids = intersection(organizationReadColIds, userReadColIds);

      return {
        add_case: organizationPolicy.add_case && userPolicy.add_case,
        add_case_set: organizationPolicy.add_case_set && userPolicy.add_case_set,
        case_type_set_ids,
        data_collection_id: organizationPolicy.data_collection_id,
        is_private: organizationPolicy.is_private,
        organization_id: organizationPolicy.organization_id,
        read_case_set: organizationPolicy.read_case_set && userPolicy.read_case_set,
        read_col_ids,
        read_col_set_id: organizationPolicy.read_col_set_id,
        remove_case: organizationPolicy.remove_case && userPolicy.remove_case,
        remove_case_set: organizationPolicy.remove_case_set && userPolicy.remove_case_set,
        write_case_set: organizationPolicy.write_case_set && userPolicy.write_case_set,
        write_col_ids,
        write_col_set_id: organizationPolicy.write_col_set_id,
      } satisfies AccessCasePolity;
    }).filter((policy => !!policy));

  }, [colMapQuery, colSetMembersQuery, caseTypeMapQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, userAccessCasePoliciesQuery]);

  const tableColumns = useMemo<TableColumn<AccessCasePolity>[]>(() => [
    TableUtil.createReadableIndexColumn(),
    TableUtil.createOptionsColumn({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
  ], [dataCollectionOptionsQuery.options, t]);

  const getRowName = useCallback((row: AccessCasePolity) => {
    return dataCollectionMapQuery.map.get(row.data_collection_id)?.name ?? row.data_collection_id;
  }, [dataCollectionMapQuery.map]);

  useInitializeTableStore({ columns: tableColumns, rows: effectiveAccessCasePolicies, store: tableStore });

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
