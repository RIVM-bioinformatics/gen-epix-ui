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
  useTheme,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';

import CollectionIcon from '../../assets/icons/CollectionIcon.svg?react';
import type {
  CaseSet,
  CaseStats,
} from '../../api';
import { CaseApi } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { EpiCaseSetInfoDialogRefMethods } from '../../components/epi/EpiCaseSetInfoDialog';
import { EpiCaseSetInfoDialog } from '../../components/epi/EpiCaseSetInfoDialog';
import type { EpiCreateEventDialogRefMethods } from '../../components/epi/EpiCreateEventDialog';
import { EpiCreateEventDialog } from '../../components/epi/EpiCreateEventDialog';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  TableMenu,
  TableCaption,
  TableSidebarMenu,
  Table,
} from '../../components/ui/Table';
import { useCaseSetCategoryOptionsQuery } from '../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatsMapQuery } from '../../dataHooks/useCaseSetStatsQuery';
import { useCaseSetStatusOptionsQuery } from '../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeOptionsQuery } from '../../dataHooks/useCaseTypesQuery';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import { useArray } from '../../hooks/useArray';
import { QUERY_KEY } from '../../models/query';
import type {
  TableRowParams,
  TableColumn,
} from '../../models/table';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../stores/tableStore';
import { EpiCaseSetUtil } from '../../utils/EpiCaseSetUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { DATE_FORMAT } from '../../data/date';
import { useQueryMemo } from '../../hooks/useQueryMemo';

type Row = CaseSet & CaseStats;

export const EventsPage = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const caseSetCategoryOptionsQuery = useCaseSetCategoryOptionsQuery();
  const caseSetStatusOptionsQuery = useCaseSetStatusOptionsQuery();
  const epiCaseSetInfoDialogRef = useRef<EpiCaseSetInfoDialogRefMethods>(null);
  const epiCreateEventDialogRef = useRef<EpiCreateEventDialogRefMethods>(null);

  const { isLoading: isCaseSetsLoading, error: caseSetsError, data: caseSets } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetsGetAll({ signal });
      return response.data;
    },
  });
  const caseSetStatsMapQuery = useCaseSetStatsMapQuery(caseSets ? caseSets.map(cs => cs.id) : null);
  const loadables = useArray([caseTypeOptionsQuery, caseSetCategoryOptionsQuery, caseSetStatusOptionsQuery, caseSetStatsMapQuery]);

  const navigateToEvent = useCallback(async (row: CaseSet) => {
    await RouterManager.instance.router.navigate(EpiCaseSetUtil.createCaseSetLink(row));
  }, []);

  const showEventInformation = useCallback((row: CaseSet) => {
    epiCaseSetInfoDialogRef.current?.open({
      caseSetId: row.id,
      caseTypeId: row.case_type_id,
    });
  }, []);

  const onRowClick = useCallback(async (tableRowParams: TableRowParams<Row>) => {
    await navigateToEvent(tableRowParams.row);
  }, [navigateToEvent]);

  const onIndexCellClick = useCallback((row: CaseSet) => {
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
      TableUtil.createOptionsColumn({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptionsQuery.options, flex: 1.5, shouldFilterOptions: true }),
      TableUtil.createTextColumn({ id: 'name', name: t`Name`, flex: 1.5 }),
      TableUtil.createOptionsColumn({ id: 'case_set_category_id', name: t`Category`, options: caseSetCategoryOptionsQuery.options, flex: 0.4 }),
      TableUtil.createOptionsColumn({ id: 'case_set_status_id', name: t`Status`, options: caseSetStatusOptionsQuery.options, flex: 0.4 }),
      TableUtil.createDateColumn({ id: 'first_case_date', name: t`First case date`, dateFormat: DATE_FORMAT.DATE }),
      TableUtil.createDateColumn({ id: 'last_case_date', name: t`Last case date`, dateFormat: DATE_FORMAT.DATE }),
      TableUtil.createDateColumn({ id: 'created_at', name: t`Created on` }),
      TableUtil.createNumberColumn({ id: 'n_own_cases', name: t`Own cases`, flex: 0.35 }),
      TableUtil.createNumberColumn({ id: 'n_cases', name: t`Cases`, flex: 0.35 }),
      TableUtil.createActionsColumn({
        t,
        getActions: (params) => {
          return [
            (
              <MenuItem
                key={'actions1'}
                // eslint-disable-next-line react/jsx-no-bind
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
                // eslint-disable-next-line react/jsx-no-bind
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
      }),
    ];
  }, [caseSetCategoryOptionsQuery.options, caseSetStatusOptionsQuery.options, caseTypeOptionsQuery.options, onRowClick, showEventInformation, t]);

  const tableStore = useMemo(() => createTableStore<Row>({
    navigatorFunction: RouterManager.instance.router.navigate,
    defaultSortByField: 'created_at',
    defaultSortDirection: 'desc',
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: 'caseSets',
    storageVersion: 3,
  }), []);

  useInitializeTableStore({ store: tableStore, columns, rows: data, createFiltersFromColumns: true });

  const contentActions = useMemo(() => {
    const isLoading = loadables.some(loadable => loadable.isLoading);
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(1),
        }}
      >
        <TableMenu />
        <Button
          color={'secondary'}
          disabled={isLoading}
          loading={isLoading}
          size={'small'}
          variant={'contained'}
          onClick={onCreateItemButtonClick}
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
        fullWidth
        showBreadcrumbs
        contentActions={contentActions}
        contentHeader={(
          <TableCaption
            caption={t`Events`}
            component={'h2'}
            variant={'h2'}
          />
        )}
        testIdAttributes={TestIdUtil.createAttributes('EventsPage')}
        title={t`Events`}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
          }}
        >
          <ResponseHandler
            error={caseSetsError}
            isLoading={isCaseSetsLoading}
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
                onReadableIndexClick={onIndexCellClick}
                onRowClick={onRowClick}
              />
            </Box>

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
