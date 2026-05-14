import { useTranslation } from 'react-i18next';
import {
  Box,
  Link,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import type { CaseDbUser } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type {
  TableColumn,
  TableRowParams,
} from '@gen-epix/ui';
import {
  COMMON_QUERY_KEY,
  ConfigManager,
  createTableStore,
  DataUtil,
  PageContainer,
  ResponseHandler,
  RouterManager,
  Table,
  TableCaption,
  TableMenu,
  TableSidebarMenu,
  TableStoreContextProvider,
  TableUtil,
  TestIdUtil,
  useArray,
  useInitializeTableStore,
  useItemQuery,
} from '@gen-epix/ui';

import type {
  UsersEffectiveRightsDetailsDialogOpenProps,
  UsersEffectiveRightsDetailsDialogRefMethods,
} from '../../components/ui/UsersEffectiveRightsDetailsDialog';
import { UsersEffectiveRightsDetailsDialog } from '../../components/ui/UsersEffectiveRightsDetailsDialog';
import { useCaseTypeSetMembersQuery } from '../../dataHooks/useCaseTypeSetMembersQuery';
import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery,
} from '../../dataHooks/useCaseTypeSetsQuery';
import { useColSetMembersQuery } from '../../dataHooks/useColSetMembersQuery';
import { useColSetMapQuery } from '../../dataHooks/useColSetsQuery';
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
} from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../../dataHooks/useOrganizationShareCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../../dataHooks/useUserAccessCasePoliciesQuery';
import { useUserShareCasePoliciesQuery } from '../../dataHooks/useUserShareCasePoliciesQuery';
import type { UserEffectiveRight } from '../../models/caseAccess';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';


export const UserEffectiveRightsAdminPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const usersEffectiveRightsDetailsDialogRef = useRef<UsersEffectiveRightsDetailsDialogRefMethods>(null);

  const { userId } = useParams();

  const { data: user, error: userError, isLoading: isUserLoading } = useItemQuery<CaseDbUser>({
    baseQueryKey: COMMON_QUERY_KEY.USERS,
    itemId: userId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await CaseDbOrganizationApi.getInstance().usersGetOne(userId, { signal });
        return response.data;
      },
    },
  });

  const colSetMembersQuery = useColSetMembersQuery();
  const caseTypeSetsMapQuery = useCaseTypeSetsMapQuery();
  const colSetMapQuery = useColSetMapQuery();
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
    colSetMembersQuery,
    dataCollectionMapQuery,
    dataCollectionOptionsQuery,
    colSetMapQuery,
    caseTypeSetNameFactory,
    caseTypeSetsMapQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<UserEffectiveRight>({
    defaultSortByField: 'data_collection_id',
    defaultSortDirection: 'asc',
    idSelectorCallback: (entry) => entry.data_collection_id,
    navigatorFunction: RouterManager.getInstance().router.navigate,
    storageNamePostFix: 'UsersEffectiveRightsAdminPage-Table',
    storageVersion: 1,
  }), []);

  const effectiveRights = useMemo<UserEffectiveRight[]>(() => {
    const { data: organizationAccessCasePolicies } = organizationAccessCasePoliciesQuery;
    const { data: organizationShareCasePolicies } = organizationShareCasePoliciesQuery;
    const { data: userAccessCasePolicies } = userAccessCasePoliciesQuery;
    const { data: userShareCasePolicies } = userShareCasePoliciesQuery;
    const { data: caseTypeSetMembers } = caseTypeSetMembersQuery;
    const { data: colSetMembers } = colSetMembersQuery;

    return EffectiveRightsUtil.assembleUserEffectiveRights({
      caseTypeSetMembers,
      colSetMembers,
      organizationAccessCasePolicies,
      organizationShareCasePolicies,
      user,
      userAccessCasePolicies,
      userShareCasePolicies,
    });

  }, [colSetMembersQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, organizationShareCasePoliciesQuery, user, userAccessCasePoliciesQuery, userShareCasePoliciesQuery]);

  const renderSetCell = useCallback((params: { getName: (memberId: string) => string; setIds: string[]; type: UsersEffectiveRightsDetailsDialogOpenProps['type']; uncategorizedMemberIds: string[]; userEffectiveRight: UserEffectiveRight }) => {
    const { getName, setIds, type, uncategorizedMemberIds, userEffectiveRight } = params;
    const onLinkClick = (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      usersEffectiveRightsDetailsDialogRef.current.open({
        type,
        user,
        userEffectiveRight,
      });
    };

    if (uncategorizedMemberIds.length > 0) {
      return (
        <Link
          href={'#'}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={onLinkClick}
          tabIndex={0}
        >
          {t`View all`}
        </Link>
      );
    }
    if (setIds.length > 2) {
      return (
        <Link
          href={'#'}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={onLinkClick}
          tabIndex={0}
        >
          {t('View {{numSets}} sets', { numSets: setIds.length })}
        </Link>
      );
    }

    return (
      <>
        {setIds.map(setId => (
          <Link
            href={'#'}
            key={setId}

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
      getName: (caseTypeId: string) => caseTypeSetNameFactory.getName(caseTypeSetsMapQuery.map.get(caseTypeId)),
      setIds: row.case_type_set_ids,
      type: 'caseTypeSets',
      uncategorizedMemberIds: row.uncategorized_case_type_ids,
      userEffectiveRight: row,
    });
  }, [caseTypeSetNameFactory, caseTypeSetsMapQuery.map, renderSetCell]);

  const renderReadCaseSetsCell = useCallback(({ row }: TableRowParams<UserEffectiveRight>) => {
    return renderSetCell({
      getName: (colId: string) => colSetMapQuery.map.get(colId).name,
      setIds: row.read_col_set_ids,
      type: 'readColSets',
      uncategorizedMemberIds: row.uncategorized_read_col_ids,
      userEffectiveRight: row,
    });
  }, [colSetMapQuery.map, renderSetCell]);

  const renderWriteCaseSetsCell = useCallback(({ row }: TableRowParams<UserEffectiveRight>) => {
    return renderSetCell({
      getName: (colId: string) => colSetMapQuery.map.get(colId)?.name,
      setIds: row.write_col_set_ids,
      type: 'writeColSets',
      uncategorizedMemberIds: row.uncategorized_write_col_ids,
      userEffectiveRight: row,
    });
  }, [colSetMapQuery.map, renderSetCell]);

  const tableColumns = useMemo<TableColumn<UserEffectiveRight>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn(),
      TableUtil.createOptionsColumn({ id: 'data_collection_id', name: t`Data collection`, options: dataCollectionOptionsQuery.options }),
      {
        headerName: t`Case type sets`,
        hideInFilter: true,
        id: 'case_type_set_ids',
        isInitiallyVisible: true,
        renderCell: renderCaseTypeSetsCell,
        type: 'text',
        widthFlex: 1,
      },
      {
        headerName: t`Read column sets`,
        hideInFilter: true,
        id: 'read_col_set_ids',
        isInitiallyVisible: true,
        renderCell: renderReadCaseSetsCell,
        type: 'text',
        widthFlex: 1,
      },
      {
        headerName: t`Write column sets`,
        hideInFilter: true,
        id: 'write_col_set_ids',
        isInitiallyVisible: true,
        renderCell: renderWriteCaseSetsCell,
        type: 'text',
        widthFlex: 1,
      },

      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'add_case', name: t`Add case` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'remove_case', name: t`Remove case` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'add_case_set', name: t`Add case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'remove_case_set', name: t`Remove case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'read_case_set', name: t`Read case set` }),
      TableUtil.createBooleanColumn<UserEffectiveRight>({ id: 'write_case_set', name: t`Write case set` }),
      {
        headerName: t`Addition al rights`,
        id: 'has_additional_rights',
        isInitiallyVisible: true,
        type: 'boolean',
        valueGetter: (params) => params.row.effective_share_case_rights.length > 0,
        widthFlex: 0.25,
      },
    ];
  }, [dataCollectionOptionsQuery.options, renderCaseTypeSetsCell, renderReadCaseSetsCell, renderWriteCaseSetsCell, t]);

  const getRowName = useCallback((row: UserEffectiveRight) => {
    return dataCollectionMapQuery.map.get(row.data_collection_id)?.name ?? row.data_collection_id;
  }, [dataCollectionMapQuery.map]);

  const onRowClick = useCallback((params: TableRowParams<UserEffectiveRight>) => {
    usersEffectiveRightsDetailsDialogRef.current.open({
      type: 'caseTypeSets',
      user,
      userEffectiveRight: params.row,
    });
  }, [user]);

  useInitializeTableStore({ columns: tableColumns, createFiltersFromColumns: true, rows: effectiveRights, store: tableStore });

  return (
    <TableStoreContextProvider store={tableStore}>
      <PageContainer
        contentActions={(<TableMenu />)}
        contentHeader={(
          <TableCaption
            caption={user ? t('{{userName}} effective rights', { userName: DataUtil.getUserDisplayValue(user, t) }) : t`⌛ Loading...`}
            component={'h2'}
            variant={'h2'}
          />
        )}
        fullWidth
        showBreadcrumbs
        testIdAttributes={TestIdUtil.createAttributes('UsersEffectiveRightsAdminPage')}
        title={t`Users effective rights`}
      >
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          <ResponseHandler
            error={userError}
            inlineSpinner
            isLoading={isUserLoading}
            loadables={loadables}
          >
            <TableSidebarMenu />
            <Box
              sx={{
                height: '100%',
                paddingLeft: theme.spacing(ConfigManager.getInstance().config.layout.SIDEBAR_MENU_WIDTH + 1),
                width: '100%',
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
