import { useTranslation } from 'react-i18next';
import {
  Box,
  Link,
  useTheme,
} from '@mui/material';
import {
  useMemo,
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useParams } from 'react-router-dom';

import { TestIdUtil } from '../../utils/TestIdUtil';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  Table,
  TableCaption,
  TableMenu,
  TableSidebarMenu,
} from '../../components/ui/Table';
import { useCaseTypeColSetMembersQuery } from '../../dataHooks/useCaseTypeColSetMembersQuery';
import { useCaseTypeSetMembersQuery } from '../../dataHooks/useCaseTypeSetMembersQuery';
import {
  useDataCollectionsMapQuery,
  useDataCollectionOptionsQuery,
} from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../../dataHooks/useOrganizationShareCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../../dataHooks/useUserAccessCasePoliciesQuery';
import { useUserShareCasePoliciesQuery } from '../../dataHooks/useUserShareCasePoliciesQuery';
import { useArray } from '../../hooks/useArray';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../stores/tableStore';
import { TableUtil } from '../../utils/TableUtil';
import type { User } from '../../api';
import { OrganizationApi } from '../../api';
import { useItemQuery } from '../../hooks/useItemQuery';
import { QUERY_KEY } from '../../models/query';
import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery,
} from '../../dataHooks/useCaseTypeSetsQuery';
import { useCaseTypeColSetsMapQuery } from '../../dataHooks/useCaseTypeColSetsQuery';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { UserEffectiveRight } from '../../models/caseAccess';
import type {
  UsersEffectiveRightsDetailsDialogOpenProps,
  UsersEffectiveRightsDetailsDialogRefMethods,
} from '../../components/ui/UsersEffectiveRightsDetailsDialog';
import { UsersEffectiveRightsDetailsDialog } from '../../components/ui/UsersEffectiveRightsDetailsDialog';
import { DataUtil } from '../../utils/DataUtil';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';

export const UsersEffectiveRightsAdminPage = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const usersEffectiveRightsDetailsDialogRef = useRef<UsersEffectiveRightsDetailsDialogRefMethods>(null);

  const { userId } = useParams();

  const { isLoading: isUserLoading, error: userError, data: user } = useItemQuery<User>({
    baseQueryKey: QUERY_KEY.USERS,
    itemId: userId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await OrganizationApi.instance.usersGetOne(userId, { signal });
        return response.data;
      },
    },
  });

  const caseTypeColSetMembersQuery = useCaseTypeColSetMembersQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();
  const caseTypeColSetsMapQuery = useCaseTypeColSetsMapQuery();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();
  const dataCollectionMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const organizationShareCasePoliciesQuery = useOrganizationShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === user.organization_id));
  const userAccessCasePoliciesQuery = useUserAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));
  const userShareCasePoliciesQuery = useUserShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === user.id));

  const loadables = useArray([
    organizationAccessCasePoliciesQuery,
    organizationShareCasePoliciesQuery,
    userAccessCasePoliciesQuery,
    userShareCasePoliciesQuery,
    caseTypeSetMembersQuery,
    caseTypeColSetMembersQuery,
    dataCollectionMapQuery,
    dataCollectionOptionsQuery,
    caseTypeColSetsMapQuery,
    caseTypeSetNameFactory,
    caseTypeSetsMapQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<UserEffectiveRight>({
    navigatorFunction: RouterManager.instance.router.navigate,
    defaultSortByField: 'data_collection_id',
    defaultSortDirection: 'asc',
    idSelectorCallback: (entry) => entry.data_collection_id,
    storageNamePostFix: 'UsersEffectiveRightsAdminPage-Table',
    storageVersion: 1,
  }), []);

  const effectiveAccessCasePolicies = useMemo<UserEffectiveRight[]>(() => {
    const { data: organizationAccessCasePolicies } = organizationAccessCasePoliciesQuery;
    const { data: organizationShareCasePolicies } = organizationShareCasePoliciesQuery;
    const { data: userAccessCasePolicies } = userAccessCasePoliciesQuery;
    const { data: userShareCasePolicies } = userShareCasePoliciesQuery;
    const { data: caseTypeSetMembers } = caseTypeSetMembersQuery;
    const { data: caseTypeColSetMembers } = caseTypeColSetMembersQuery;

    return EffectiveRightsUtil.assembleUserEffectiveRights({
      user,
      organizationAccessCasePolicies,
      organizationShareCasePolicies,
      userAccessCasePolicies,
      userShareCasePolicies,
      caseTypeSetMembers,
      caseTypeColSetMembers,
    });

  }, [caseTypeColSetMembersQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, organizationShareCasePoliciesQuery, user, userAccessCasePoliciesQuery, userShareCasePoliciesQuery]);

  const renderSetCell = useCallback((params: { userEffectiveRight: UserEffectiveRight; setIds: string[]; uncategorizedMemberIds: string[]; getName: (memberId: string) => string; type: UsersEffectiveRightsDetailsDialogOpenProps['type'] }) => {
    const { userEffectiveRight, setIds, uncategorizedMemberIds, getName, type } = params;
    const onLinkClick = (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      usersEffectiveRightsDetailsDialogRef.current.open({
        userEffectiveRight,
        type,
        user,
      });
    };

    if (uncategorizedMemberIds.length > 0) {
      return (
        <Link
          tabIndex={0}
          href={'#'}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={onLinkClick}
        >
          {t`View all`}
        </Link>
      );
    }
    if (setIds.length > 2) {
      return (
        <Link
          tabIndex={0}
          href={'#'}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={onLinkClick}
        >
          {t('View {{numSets}} sets', { numSets: setIds.length })}
        </Link>
      );
    }

    return (
      <>
        {setIds.map(setId => (
          <Link
            key={setId}
            href={'#'}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={onLinkClick}
          >
            {getName(setId) ?? setId}
          </Link>
        ))}
      </>
    );
  }, [t, user]);

  const renderCaseTypeSetsCell = useCallback(({ row }: TableRowParams<UserEffectiveRight>) => {
    return renderSetCell({
      setIds: row.case_type_set_ids,
      uncategorizedMemberIds: row.uncategorized_case_type_ids,
      getName: (caseTypeId: string) => caseTypeSetNameFactory.getName(caseTypeSetsMapQuery.map.get(caseTypeId)),
      userEffectiveRight: row,
      type: 'caseTypeSets',
    });
  }, [caseTypeSetNameFactory, caseTypeSetsMapQuery.map, renderSetCell]);

  const renderReadCaseSetsCell = useCallback(({ row }: TableRowParams<UserEffectiveRight>) => {
    return renderSetCell({
      setIds: row.read_case_type_col_set_ids,
      uncategorizedMemberIds: row.uncategorized_read_case_type_col_ids,
      getName: (caseTypeColId: string) => caseTypeColSetsMapQuery.map.get(caseTypeColId).name,
      userEffectiveRight: row,
      type: 'readColSets',
    });
  }, [caseTypeColSetsMapQuery.map, renderSetCell]);

  const renderWriteCaseSetsCell = useCallback(({ row }: TableRowParams<UserEffectiveRight>) => {
    return renderSetCell({
      setIds: row.write_case_type_col_set_ids,
      uncategorizedMemberIds: row.uncategorized_write_case_type_col_ids,
      getName: (caseTypeColId: string) => caseTypeColSetsMapQuery.map.get(caseTypeColId)?.name,
      userEffectiveRight: row,
      type: 'writeColSets',
    });
  }, [caseTypeColSetsMapQuery.map, renderSetCell]);

  const tableColumns = useMemo<TableColumn<UserEffectiveRight>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn(),
      TableUtil.createOptionsColumn({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      {
        type: 'text',
        id: 'case_type_set_ids',
        headerName: t`Case type sets`,
        isInitiallyVisible: true,
        renderCell: renderCaseTypeSetsCell,
        widthFlex: 1,
        hideInFilter: true,
      },
      {
        type: 'text',
        id: 'read_case_type_col_set_ids',
        headerName: t`Read column sets`,
        isInitiallyVisible: true,
        renderCell: renderReadCaseSetsCell,
        widthFlex: 1,
        hideInFilter: true,
      },
      {
        type: 'text',
        id: 'write_case_type_col_set_ids',
        headerName: t`Write column sets`,
        isInitiallyVisible: true,
        renderCell: renderWriteCaseSetsCell,
        widthFlex: 1,
        hideInFilter: true,
      },

      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'write_case_set', name: t`Write case set` }),
      {
        type: 'boolean',
        id: 'has_additional_rights',
        headerName: t`Addition al rights`,
        widthFlex: 0.25,
        isInitiallyVisible: true,
        valueGetter: (params) => params.row.effective_share_case_rights.length > 0,
      },
    ];
  }, [dataCollectionOptionsQuery.options, renderCaseTypeSetsCell, renderReadCaseSetsCell, renderWriteCaseSetsCell, t]);

  const getRowName = useCallback((row: UserEffectiveRight) => {
    return dataCollectionMapQuery.map.get(row.data_collection_id)?.name ?? row.data_collection_id;
  }, [dataCollectionMapQuery.map]);

  const onRowClick = useCallback((params: TableRowParams<UserEffectiveRight>) => {
    usersEffectiveRightsDetailsDialogRef.current.open({
      userEffectiveRight: params.row,
      type: 'caseTypeSets',
      user,
    });
  }, [user]);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: effectiveAccessCasePolicies, createFiltersFromColumns: true });

  return (
    <TableStoreContextProvider store={tableStore}>
      <PageContainer
        fullWidth
        showBreadcrumbs
        contentActions={(<TableMenu />)}
        contentHeader={(
          <TableCaption
            caption={user ? t('{{userName}} effective rights', { userName: DataUtil.getUserDisplayValue(user, t) }) : t`⌛ Loading...`}
            component={'h2'}
            variant={'h2'}
          />
        )}
        testIdAttributes={TestIdUtil.createAttributes('UsersEffectiveRightsAdminPage')}
        title={t`Users effective rights`}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
          }}
        >
          <ResponseHandler
            inlineSpinner
            error={userError}
            isLoading={isUserLoading}
            loadables={loadables}
          >
            <TableSidebarMenu />
            <Box
              sx={{
                width: '100%',
                height: '100%',
                paddingLeft: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH + 1),
              }}
            >
              <Table
                getRowName={getRowName}
                onRowClick={onRowClick}
              />
            </Box>
          </ResponseHandler>
        </Box>
        <UsersEffectiveRightsDetailsDialog ref={usersEffectiveRightsDetailsDialogRef} />
      </PageContainer>
    </TableStoreContextProvider>
  );
};
