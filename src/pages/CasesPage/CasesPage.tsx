import { useTranslation } from 'react-i18next';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import InfoIcon from '@mui/icons-material/Info';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useQuery } from '@tanstack/react-query';

import type {
  CaseTypeStat,
  CaseTypeSet,
  CaseTypeSetCategory,
} from '../../api';
import {
  CaseApi,
  CaseTypeSetCategoryPurpose,
} from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { EpiCaseTypeInfoDialogWithLoaderRefMethods } from '../../components/epi/EpiCaseTypeInfoDialog';
import { EpiCaseTypeInfoDialogWithLoader } from '../../components/epi/EpiCaseTypeInfoDialog';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  TableMenu,
  TableCaption,
  TableSidebarMenu,
  Table,
} from '../../components/ui/Table';
import { useCaseTypeSetCategories } from '../../dataHooks/useCaseTypeSetCategory';
import { useCaseTypeStats } from '../../dataHooks/useCaseTypeStats';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import type { OptionBase } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type {
  TableRowParams,
  TableColumn,
} from '../../models/table';
import {
  createTableStore,
  TableStoreProvider,
} from '../../stores/tableStore';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

type Row = {
  id: string;
  name: string;
  hasCases: boolean;
  [key: string]: string[] | string | number | boolean;
} & Pick<CaseTypeStat, 'n_cases' | 'first_case_month' | 'last_case_month'>;

const getCaseTypeSetCategoryRowId = (id: string) => `caseTypeSetCategory-${id}`;

export const CasesPage = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const epiCaseTypeInfoDialogWithLoaderRef = useRef<EpiCaseTypeInfoDialogWithLoaderRefMethods>(null);
  const caseTypeStats = useCaseTypeStats();


  const { isLoading: isCaseTypeSetCategoriesLoading, error: caseTypeSetCategoriesError, data: caseTypeSetCategories } = useCaseTypeSetCategories();

  const { isLoading: isCaseTypesLoading, error: caseTypesError, data: caseTypes } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypesGetAll({ signal });
      return response.data;
    },
  });

  const caseTypeStatsMap = useMemo(() => {
    return new Map<string, CaseTypeStat>(caseTypeStats.data?.map(stat => [stat.case_type_id, stat]));
  }, [caseTypeStats]);


  const { isLoading: isCaseTypeSetsLoading, error: caseTypeSetsError, data: caseTypeSets } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetsGetAll({ signal });
      return response.data;
    },
  });

  const { isLoading: isCaseTypeSetMembersLoading, error: caseTypeSetMembersError, data: caseTypeSetMembers } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_MEMBERS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetMembersGetAll({ signal });
      return response.data;
    },
  });

  const isLoading = isCaseTypesLoading || isCaseTypeSetsLoading || isCaseTypeSetMembersLoading || isCaseTypeSetCategoriesLoading || caseTypeStats.isLoading;
  const error = caseTypesError || caseTypeSetsError || caseTypeSetMembersError || caseTypeSetCategoriesError || caseTypeStats.error;

  const handleCellNavigation = useCallback(async (caseType: Row) => {
    await RouterManager.instance.router.navigate(`/cases/${StringUtil.createSlug(caseType.name)}/${caseType.id}`);
  }, []);

  const onRowClick = useCallback(async (params: TableRowParams<Row>) => {
    await handleCellNavigation(params.row);
  }, [handleCellNavigation]);

  const onShowItemClick = useCallback(async (params: TableRowParams<Row>) => {
    await handleCellNavigation(params.row);
  }, [handleCellNavigation]);

  const onShowCaseTypeInformationClick = useCallback((params: TableRowParams<Row>) => {
    epiCaseTypeInfoDialogWithLoaderRef.current.open({
      caseTypeId: params.id,
    });
  }, []);

  const onIndexCellClick = useCallback((row: Row) => {
    epiCaseTypeInfoDialogWithLoaderRef.current.open({
      caseTypeId: row.id,
    });
  }, []);

  const data = useMemo<Row[]>(() => {
    if (isLoading || error) {
      return;
    }

    const caseTypeSetCache = new Map<string, CaseTypeSet>();
    caseTypeSets.forEach(caseTypeSet => {
      caseTypeSetCache.set(caseTypeSet.id, caseTypeSet);
    });

    const caseTypeMemberCache = new Map<string, string[]>();
    caseTypeSetMembers.forEach(caseTypeSetMember => {
      const caseTypeMemberCacheEntry = caseTypeMemberCache.get(caseTypeSetMember.case_type_id);

      if (caseTypeMemberCacheEntry) {
        if (!caseTypeMemberCacheEntry.includes(caseTypeSetMember.case_type_set_id)) {
          caseTypeMemberCacheEntry.push(caseTypeSetMember.case_type_set_id);
        }
      } else {
        caseTypeMemberCache.set(caseTypeSetMember.case_type_id, [caseTypeSetMember.case_type_set_id]);
      }
    });

    const rows = caseTypes.map<Row>(caseType => {
      const row: Row = {
        id: caseType.id,
        name: caseType.name,
        hasCases: caseTypeStatsMap.get(caseType.id)?.n_cases > 0,
        n_cases: caseTypeStatsMap.get(caseType.id)?.n_cases ?? 0,
        first_case_month: caseTypeStatsMap.get(caseType.id)?.first_case_month,
        last_case_month: caseTypeStatsMap.get(caseType.id)?.last_case_month,
      };
      caseTypeSetCategories.forEach((caseTypeSetCategorie) => {
        row[getCaseTypeSetCategoryRowId(caseTypeSetCategorie.id)] = [];
      });

      (caseTypeMemberCache.get(caseType.id) ?? []).forEach(caseTypeSetId => {
        const caseTypeSet = caseTypeSetCache.get(caseTypeSetId);
        if (caseTypeSet) {
          (row[getCaseTypeSetCategoryRowId(caseTypeSet.case_type_set_category_id)] as string[]).push(caseTypeSetId);
        }
      });
      return row;
    });
    return rows;
  }, [caseTypeSetCategories, caseTypeSetMembers, caseTypeSets, caseTypeStatsMap, caseTypes, error, isLoading]);

  const caseTypeSetCategoryOptions = useMemo(() => {
    const options: { [key: string]: OptionBase<string>[] } = {};

    caseTypeSetCategories?.forEach(category => {
      options[category.id] = caseTypeSets?.filter(set => set.case_type_set_category_id === category.id).sort((a, b) => a.rank - b.rank).map<OptionBase<string>>(set => ({ value: set.id, label: set.name }));
    });
    return options;
  }, [caseTypeSetCategories, caseTypeSets]);

  const columns = useMemo<TableColumn<Row>[]>(() => {
    if (isLoading || error) {
      return;
    }

    return [
      TableUtil.createReadableIndexColumn(),
      TableUtil.createTextColumn({
        name: t('Name'),
        id: 'name',
        flex: 1.5,
      }),
      ...caseTypeSetCategories.filter(c => c.purpose === CaseTypeSetCategoryPurpose.CONTENT).map<TableColumn<Row>>((caseTypeSetCategory: CaseTypeSetCategory) => {
        return {
          id: getCaseTypeSetCategoryRowId(caseTypeSetCategory.id),
          type: 'options',
          headerName: caseTypeSetCategory.name,
          maxNumOptionsExpanded: Infinity,
          widthFlex: 1,
          options: caseTypeSetCategoryOptions[caseTypeSetCategory.id] ?? [],
          comparatorFactory: TableUtil.createOptionsCellRowComperator,
          isInitiallyVisible: true,
        };
      }),
      TableUtil.createNumberColumn({ name: t('Number of cases'), id: 'n_cases', flex: 0.5 }),
      {
        ...TableUtil.createDateColumn({ name: t('First case month'), id: 'first_case_month', flex: 0.5 }),
        isInitiallyVisible: false,
      },
      {
        ...TableUtil.createDateColumn({ name: t('Last case month'), id: 'last_case_month', flex: 0.5 }),
        isInitiallyVisible: false,
      },
      TableUtil.createActionsColumn({
        t,
        getActions: (params) => {
          return [
            (
              <MenuItem
                disabled={!params.row.hasCases}
                key={'actions1'}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={async () => onShowItemClick(params)}
              >
                <ListItemIcon>
                  <ArrowCircleRightIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Go to cases`}
                </ListItemText>
              </MenuItem>
            ),
            (
              <MenuItem
                key={'actions2'}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onShowCaseTypeInformationClick(params)}
              >
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Show case type information`}
                </ListItemText>
              </MenuItem>
            ),
          ];
        },
      }),
    ] satisfies TableColumn<Row>[];
  }, [caseTypeSetCategories, caseTypeSetCategoryOptions, error, isLoading, onShowCaseTypeInformationClick, onShowItemClick, t]);

  const tableStore = useMemo(() => createTableStore<Row>({
    navigatorFunction: RouterManager.instance.router.navigate,
    defaultSortByField: 'name',
    defaultSortDirection: 'asc',
    isRowEnabledCallback: (row) => row.n_cases > 0,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: 'cases',
    storageVersion: 1,
  }), []);

  useInitializeTableStore(tableStore, columns, data, true);

  const getRowName = useCallback((row: Row) => {
    return row.name;
  }, []);

  return (
    <TableStoreProvider store={tableStore}>
      <PageContainer
        contentActions={(<TableMenu />)}
        contentHeader={(
          <TableCaption
            caption={t`Cases`}
            component={'h2'}
            variant={'h2'}
          />
        )}
        fullWidth
        showBreadcrumbs
        testIdAttributes={TestIdUtil.createAttributes('CasesPage')}
        title={t`Cases`}
      >
        <Box sx={{
          position: 'relative',
          height: '100%',
        }}
        >
          <ResponseHandler
            error={error}
            isPending={isLoading}
          >
            <TableSidebarMenu />
            <Box sx={{
              width: '100%',
              height: '100%',
              paddingLeft: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH + 1),
            }}
            >
              <Table
                getRowName={getRowName}
                onReadableIndexClick={onIndexCellClick}
                onRowClick={onRowClick}
              />
            </Box>
          </ResponseHandler>
        </Box>
        <EpiCaseTypeInfoDialogWithLoader ref={epiCaseTypeInfoDialogWithLoaderRef} />
      </PageContainer>
    </TableStoreProvider>
  );
};
