import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import type {
  CaseDbCaseSet,
  CaseDbCaseStats,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import CollectionIcon from '../../assets/icons/CollectionIcon.svg?react';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { EpiCaseSetInfoDialogRefMethods } from '../../components/epi/EpiCaseSetInfoDialog';
import { EpiCaseSetInfoDialog } from '../../components/epi/EpiCaseSetInfoDialog';
import type { EpiCreateEventDialogRefMethods } from '../../components/epi/EpiCreateEventDialog';
import { EpiCreateEventDialog } from '../../components/epi/EpiCreateEventDialog';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  Table,
  TableCaption,
  TableMenu,
  TableSidebarMenu,
} from '../../components/ui/Table';
import { useCaseSetCategoryOptionsQuery } from '../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatsMapQuery } from '../../dataHooks/useCaseSetStatsQuery';
import { useCaseSetStatusOptionsQuery } from '../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../dataHooks/useCaseTypesQuery';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import { useArray } from '../../hooks/useArray';
import { QUERY_KEY } from '../../models/query';
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../stores/tableStore';
import { CaseSetUtil } from '../../utils/CaseSetUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { DATE_FORMAT } from '../../data/date';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { LoadableUtil } from '../../utils/LoadableUtil';

type Row = CaseDbCaseSet & CaseDbCaseStats;

export const EventsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();
  const epiCaseSetInfoDialogRef = useRef<EpiCaseSetInfoDialogRefMethods>(null);
  const epiCreateEventDialogRef = useRef<EpiCreateEventDialogRefMethods>(null);

  const { data: caseSets, error: caseSetsError, isLoading: isCaseSetsLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
  });
  const caseSetStatsMapQuery = useCaseSetStatsMapQuery(caseSets ? caseSets.map(cs => cs.id) : null);
  const loadables = useArray([caseTypeOptionsQuery, caseSetCategoryOptionsQuery, caseSetStatusOptionsQuery, caseSetStatsMapQuery]);

  const navigateToEvent = useCallback(async (row: CaseDbCaseSet) => {
    await RouterManager.instance.router.navigate(CaseSetUtil.createCaseSetLink(row));
  }, []);

  const showEventInformation = useCallback((row: CaseDbCaseSet) => {
    epiCaseSetInfoDialogRef.current?.open({
      caseSetId: row.id,
      caseTypeId: row.case_type_id,
    });
  }, []);

  const onRowClick = useCallback(async (tableRowParams: TableRowParams<Row>) => {
    await navigateToEvent(tableRowParams.row);
  }, [navigateToEvent]);

  const onIndexCellClick = useCallback((row: CaseDbCaseSet) => {
    showEventInformation(row);
  }, [showEventInformation]);

  const onCreateItemButtonClick = useCallback(() => {
    epiCreateEventDialogRef.current?.open({});
  }, []);

  const data = useMemo<Row[]>(() => {
    if (!caseSets || !caseSetStatsMapQuery.map) {
      return [];
    }
    return caseSets.map(caseSet => {
      return {
        ...caseSetStatsMapQuery.map?.get(caseSet.id),
        ...caseSet,
      } satisfies Row;
    });
  }, [caseSetStatsMapQuery.map, caseSets]);

  const columns = useMemo<TableColumn<Row>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn({
        getAriaLabel: (params: TableRowParams<Row>) => t('Open event information for {{name}}', { name: params.row.name }),
      }),
      TableUtil.createOptionsColumn({ flex: 1.5, id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options, shouldFilterOptions: true }),
      TableUtil.createTextColumn({ flex: 1.5, id: 'name', name: t`Name` }),
      TableUtil.createOptionsColumn({ flex: 0.4, id: 'case_set_category_id', name: t`Category`, options: caseSetCategoryOptionsQuery.options }),
      TableUtil.createOptionsColumn({ flex: 0.4, id: 'case_set_status_id', name: t`Status`, options: caseSetStatusOptionsQuery.options }),
      TableUtil.createDateColumn({ dateFormat: DATE_FORMAT.DATE, id: 'first_case_date', name: t`First case date` }),
      TableUtil.createDateColumn({ dateFormat: DATE_FORMAT.DATE, id: 'last_case_date', name: t`Last case date` }),
      TableUtil.createDateColumn({ dateFormat: DATE_FORMAT.DATE, id: 'case_set_date', name: t`Created on` }),
      TableUtil.createNumberColumn({ flex: 0.35, id: 'n_cases', name: t`Cases` }),
      TableUtil.createNumberColumn({ flex: 0.35, id: 'n_own_cases', name: t`Own cases` }),
      TableUtil.createActionsColumn({
        getActions: (params) => {
          return [
            (
              <MenuItem
                key={'actions1'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={async () => onRowClick(params)}
              >
                <ListItemIcon>
                  <ArrowCircleRightIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Go to event`}
                </ListItemText>
              </MenuItem>
            ),
            (
              <MenuItem
                key={'actions2'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => showEventInformation(params.row)}
              >
                <ListItemIcon>
                  <CollectionIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Show event information`}
                </ListItemText>
              </MenuItem>
            ),
          ];
        },
        t,
      }),
    ];
  }, [caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.options, onRowClick, showEventInformation, t]);

  const tableStore = useMemo(() => createTableStore<Row>({
    defaultSortByField: 'case_set_date',
    defaultSortDirection: 'desc',
    idSelectorCallback: (row) => row.id,
    navigatorFunction: RouterManager.instance.router.navigate,
    storageNamePostFix: 'caseSets',
    storageVersion: 3,
  }), []);

  useInitializeTableStore({ columns, createFiltersFromColumns: true, rows: data, store: tableStore });

  const contentActions = useMemo(() => {
    const isLoading = LoadableUtil.isSomeLoading(loadables);
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: theme.spacing(1),
        }}
      >
        <TableMenu />
        <Button
          color={'secondary'}
          disabled={isLoading}
          loading={isLoading}
          onClick={onCreateItemButtonClick}
          size={'small'}
          variant={'contained'}
        >
          {t`Create event`}
        </Button>
      </Box>
    );
  }, [loadables, onCreateItemButtonClick, t, theme]);

  const getRowName = useCallback((row: Row) => {
    return row.name;
  }, []);

  return (
    <TableStoreContextProvider store={tableStore}>
      <PageContainer
        contentActions={contentActions}
        contentHeader={(
          <TableCaption
            caption={t`Events`}
            component={'h2'}
            variant={'h2'}
          />
        )}
        fullWidth
        showBreadcrumbs
        testIdAttributes={TestIdUtil.createAttributes('EventsPage')}
        title={t`Events`}
      >
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          <ResponseHandler
            error={caseSetsError}
            isLoading={isCaseSetsLoading}
            loadables={loadables}
          >
            {caseSets?.length === 0 && (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant={'h6'}>
                  {t`No events found`}
                </Typography>
              </Box>
            )}
            {caseSets?.length > 0 && (
              <>
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
                <TableSidebarMenu />
              </>
            )}

          </ResponseHandler>
          <EpiCaseSetInfoDialog
            ref={epiCaseSetInfoDialogRef}
            showNavigationButton
          />
          <EpiCreateEventDialog
            ref={epiCreateEventDialogRef}
          />
        </Box>
      </PageContainer>
    </TableStoreContextProvider>
  );
};
