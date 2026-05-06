import { useTranslation } from 'react-i18next';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import InfoIcon from '@mui/icons-material/Info';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type {
  CaseDbCaseStats,
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCaseTypeSetCategoryPurpose,
} from '@gen-epix/api-casedb';
import type {
  OptionBase,
  TableColumn,
  TableRowParams,
} from '@gen-epix/ui';
import {
  CommonDataUtil,
  ConfigManager,
  createTableStore,
  DATE_FORMAT,
  PageContainer,
  QueryClientManager,
  ResponseHandler,
  RouterManager,
  Table,
  TableCaption,
  TableMenu,
  TableSidebarMenu,
  TableStoreContextProvider,
  TableUtil,
  TestIdUtil,
  useInitializeTableStore,
  useQueryMemo,
} from '@gen-epix/ui';

import type { EpiCaseTypeInfoDialogWithLoaderRefMethods } from '../../components/epi/EpiCaseTypeInfoDialog';
import { EpiCaseTypeInfoDialogWithLoader } from '../../components/epi/EpiCaseTypeInfoDialog';
import { useCaseTypeSetCategoriesQuery } from '../../dataHooks/useCaseTypeSetCategoriesQuery';
import { useCaseTypeStatsQuery } from '../../dataHooks/useCaseTypeStatsQuery';
import { CaseTypeUtil } from '../../utils/CaseTypeUtil';
import { CASEDB_QUERY_KEY } from '../../data/query';
import { CaseDbDownloadUtil } from '../../utils/CaseDbDownloadUtil';


type Row = {
  [key: string]: boolean | number | string | string[];
  hasCases: boolean;
  id: string;
  name: string;
} & Omit<CaseDbCaseStats, 'case_type_id'>;

const getCaseTypeSetCategoryRowId = (id: string) => `caseTypeSetCategory-${id}`;

export const CasesPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const epiCaseTypeInfoDialogWithLoaderRef = useRef<EpiCaseTypeInfoDialogWithLoaderRefMethods>(null);
  const caseTypeStatsQuery = useCaseTypeStatsQuery();
  const caseTypeSetCategoriesQuery = useCaseTypeSetCategoriesQuery();

  const { data: caseTypes, error: caseTypesError, isLoading: isCaseTypesLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPES),
  });

  const caseTypeStatsMap = useMemo(() => {
    return new Map<string, CaseDbCaseStats>(caseTypeStatsQuery.data?.map(stat => [stat.case_type_id, stat]));
  }, [caseTypeStatsQuery]);


  const { data: caseTypeSets, error: caseTypeSetsError, isLoading: isCaseTypeSetsLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypeSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_SETS),
  });

  const { data: caseTypeSetMembers, error: caseTypeSetMembersError, isLoading: isCaseTypeSetMembersLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypeSetMembersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_SET_MEMBERS),
  });

  const isLoading = isCaseTypesLoading || isCaseTypeSetsLoading || isCaseTypeSetMembersLoading || caseTypeSetCategoriesQuery.isLoading || caseTypeStatsQuery.isLoading;
  const error = caseTypesError || caseTypeSetsError || caseTypeSetMembersError || caseTypeSetCategoriesQuery.error || caseTypeStatsQuery.error;

  const handleCellNavigation = useCallback(async (caseType: Row) => {
    await RouterManager.getInstance().router.navigate(CaseTypeUtil.createCaseTypeLink(caseType));
  }, []);

  const onRowClick = useCallback(async (params: TableRowParams<Row>) => {
    await handleCellNavigation(params.row);
  }, [handleCellNavigation]);

  const onShowItemClick = useCallback(async (params: TableRowParams<Row>) => {
    await handleCellNavigation(params.row);
  }, [handleCellNavigation]);

  const onShowCaseTypeInformationClick = useCallback((params: TableRowParams<Row>) => {
    epiCaseTypeInfoDialogWithLoaderRef.current.open({
      caseTypeId: params.row.id,
    });
  }, []);

  const onDownloadExcelTemplateButtonClick = useCallback(async (params: TableRowParams<Row>) => {
    await CaseDbDownloadUtil.downloadExcelTemplate(params.row.id, t);
  }, [t]);

  const onIndexCellClick = useCallback((row: Row) => {
    epiCaseTypeInfoDialogWithLoaderRef.current.open({
      caseTypeId: row.id,
    });
  }, []);

  const data = useMemo<Row[]>(() => {
    if (isLoading || error) {
      return;
    }

    const caseTypeSetCache = new Map<string, CaseDbCaseTypeSet>();
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
        first_case_date: caseTypeStatsMap.get(caseType.id)?.first_case_date,
        hasCases: caseTypeStatsMap.get(caseType.id)?.n_cases > 0,
        id: caseType.id,
        last_case_date: caseTypeStatsMap.get(caseType.id)?.last_case_date,
        n_cases: caseTypeStatsMap.get(caseType.id)?.n_cases ?? 0,
        n_own_cases: caseTypeStatsMap.get(caseType.id)?.n_own_cases ?? 0,
        name: caseType.name,
      };
      caseTypeSetCategoriesQuery.data.forEach((caseTypeSetCategorie) => {
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
  }, [caseTypeSetCategoriesQuery, caseTypeSetMembers, caseTypeSets, caseTypeStatsMap, caseTypes, error, isLoading]);

  const caseTypeSetCategoryOptions = useMemo(() => {
    const options: { [key: string]: OptionBase<string>[] } = {};

    caseTypeSetCategoriesQuery.data?.forEach(category => {
      options[category.id] = caseTypeSets?.filter(set => set.case_type_set_category_id === category.id).sort(CommonDataUtil.rankSortComperatorFactory('name')).map<OptionBase<string>>(set => ({ label: set.name, value: set.id }));
    });
    return options;
  }, [caseTypeSetCategoriesQuery, caseTypeSets]);

  const columns = useMemo<TableColumn<Row>[]>(() => {
    if (isLoading || error) {
      return;
    }

    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<Row>) => t('Open case type information for {{name}}', { name: params.row.name }),
      }),
      TableUtil.createTextColumn({
        flex: 1.5,
        id: 'name',
        name: t('Name'),
      }),
      ...caseTypeSetCategoriesQuery.data.filter(c => c.purpose === CaseDbCaseTypeSetCategoryPurpose.CONTENT).map<TableColumn<Row>>((caseTypeSetCategory: CaseDbCaseTypeSetCategory) => {
        return {
          comparatorFactory: TableUtil.createOptionsCellRowComperator,
          headerName: caseTypeSetCategory.name,
          id: getCaseTypeSetCategoryRowId(caseTypeSetCategory.id),
          isInitiallyVisible: true,
          maxNumOptionsExpanded: Infinity,
          options: caseTypeSetCategoryOptions[caseTypeSetCategory.id] ?? [],
          type: 'options',
          widthFlex: 1,
        };
      }),
      TableUtil.createNumberColumn({ flex: 0.5, id: 'n_cases', name: t('Cases') }),
      TableUtil.createNumberColumn({ flex: 0.5, id: 'n_own_cases', name: t('Own cases') }),
      TableUtil.createDateColumn({ dateFormat: DATE_FORMAT.DATE, flex: 0.5, id: 'first_case_date', name: t('First case date') }),
      TableUtil.createDateColumn({ dateFormat: DATE_FORMAT.DATE, flex: 0.5, id: 'last_case_date', name: t('Last case date') }),
      TableUtil.createActionsColumn({
        getActions: (params) => {
          return [
            (
              <MenuItem
                disabled={!params.row.hasCases}
                key={'actions1'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
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
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
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
            (
              <MenuItem
                key={'actions3'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={async () => onDownloadExcelTemplateButtonClick(params)}
              >
                <ListItemIcon>
                  <FileDownloadIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Download Excel template`}
                </ListItemText>
              </MenuItem>
            ),
          ];
        },
        t,
      }),
    ] satisfies TableColumn<Row>[];
  }, [caseTypeSetCategoriesQuery.data, caseTypeSetCategoryOptions, error, isLoading, onDownloadExcelTemplateButtonClick, onShowCaseTypeInformationClick, onShowItemClick, t]);

  const tableStore = useMemo(() => createTableStore<Row>({
    defaultSortByField: 'name',
    defaultSortDirection: 'asc',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: (row) => row.n_cases > 0,
    navigatorFunction: RouterManager.getInstance().router.navigate,
    storageNamePostFix: 'cases',
    storageVersion: 1,
  }), []);

  useInitializeTableStore({ columns, createFiltersFromColumns: true, rows: data, store: tableStore });

  const getRowName = useCallback((row: Row) => {
    return row.name;
  }, []);

  return (
    <TableStoreContextProvider store={tableStore}>
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
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          <ResponseHandler
            error={error}
            isLoading={isLoading}
          >
            {caseTypes?.length === 0 && (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant={'h6'}>
                  {t`No cases found`}
                </Typography>
              </Box>
            )}
            {caseTypes?.length > 0 && (
              <>
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
                    onReadableIndexClick={onIndexCellClick}
                    onRowClick={onRowClick}
                  />
                </Box>
              </>
            )}
          </ResponseHandler>
        </Box>
        <EpiCaseTypeInfoDialogWithLoader ref={epiCaseTypeInfoDialogWithLoaderRef} />
      </PageContainer>
    </TableStoreContextProvider>
  );
};
