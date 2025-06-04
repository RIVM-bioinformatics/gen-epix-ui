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
import { useQuery } from '@tanstack/react-query';

import CollectionIcon from '../../assets/icons/CollectionIcon.svg?react';
import type {
  CaseSet,
  CaseSetStat,
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
import { useCaseSetCategoryOptions } from '../../dataHooks/useCaseSetCategories';
import { useCaseSetStatsMap } from '../../dataHooks/useCaseSetStats';
import { useCaseSetStatusOptions } from '../../dataHooks/useCaseSetStatuses';
import { useCaseTypeOptions } from '../../dataHooks/useCaseTypes';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import type { Loadable } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import type {
  TableRowParams,
  TableColumn,
} from '../../models/table';
import {
  createTableStore,
  TableStoreProvider,
} from '../../stores/tableStore';
import { EpiCaseSetUtil } from '../../utils/EpiCaseSetUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

type Row = CaseSet & CaseSetStat;

export const EventsPage = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const caseTypeOptions = useCaseTypeOptions();
  const caseSetCategoryOptions = useCaseSetCategoryOptions();
  const caseSetStatusOptions = useCaseSetStatusOptions();
  const caseSetStatsMap = useCaseSetStatsMap();
  const epiCaseSetInfoDialogRef = useRef<EpiCaseSetInfoDialogRefMethods>(null);
  const epiCreateEventDialogRef = useRef<EpiCreateEventDialogRefMethods>(null);

  const loadables = useMemo<Loadable[]>(() => [caseTypeOptions, caseSetCategoryOptions, caseSetStatusOptions, caseSetStatsMap], [caseSetCategoryOptions, caseSetStatusOptions, caseTypeOptions, caseSetStatsMap]);

  const { isLoading: isCaseSetsLoading, error: caseSetsError, data: caseSets } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetsGetAll({ signal });
      return response.data;
    },
  });

  const navigateToEvent = useCallback(async (row: CaseSet) => {
    await RouterManager.instance.router.navigate(EpiCaseSetUtil.createCaseSetLink(row));
  }, []);

  const showEventInformation = useCallback((row: CaseSet) => {
    epiCaseSetInfoDialogRef.current?.open({
      caseSetId: row.id,
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
    if (!caseSets || !caseSetStatsMap.map) {
      return [];
    }
    return caseSets.map(caseSet => {
      return {
        ...caseSet,
        ...caseSetStatsMap.map?.get(caseSet.id),
      } satisfies Row;
    });
  }, [caseSetStatsMap.map, caseSets]);

  const columns = useMemo<TableColumn<Row>[]>(() => {
    return [
      TableUtil.createReadableIndexColumn(),
      TableUtil.createOptionsColumn({ id: 'case_type_id', name: t`Case type`, options: caseTypeOptions.options, flex: 1.5, shouldFilterOptions: true }),
      TableUtil.createTextColumn({ id: 'name', name: t`Name`, flex: 1.5 }),
      TableUtil.createOptionsColumn({ id: 'case_set_category_id', name: t`Category`, options: caseSetCategoryOptions.options, flex: 0.4 }),
      TableUtil.createOptionsColumn({ id: 'case_set_status_id', name: t`Status`, options: caseSetStatusOptions.options, flex: 0.4 }),
      TableUtil.createNumberColumn({ id: 'n_cases', name: t`Cases`, flex: 0.35 }),
      // TableUtil.createNumberColumn({ id: 'n_own_cases', name: t`Own cases`, flex: 0.35 }),
      TableUtil.createDateColumn({ id: 'first_case_month', name: t`First case date` }),
      TableUtil.createDateColumn({ id: 'last_case_month', name: t`Last case date` }),
      TableUtil.createDateColumn({ id: 'created_at', name: t`Created on` }),
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
  }, [caseSetCategoryOptions.options, caseSetStatusOptions.options, caseTypeOptions.options, onRowClick, showEventInformation, t]);

  const tableStore = useMemo(() => createTableStore<Row>({
    navigatorFunction: RouterManager.instance.router.navigate,
    defaultSortByField: 'created_at',
    defaultSortDirection: 'desc',
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: 'caseSets',
    storageVersion: 3,
  }), []);

  useInitializeTableStore(tableStore, columns, data, true);

  const contentActions = useMemo(() => {
    const isLoading = loadables.some(loadable => loadable.isLoading);
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
      }}
      >
        <TableMenu />
        <Button
          color={'primary'}
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
    <TableStoreProvider store={tableStore}>
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
        <Box sx={{
          position: 'relative',
          height: '100%',
        }}
        >
          <ResponseHandler
            error={caseSetsError}
            isPending={isCaseSetsLoading}
            loadables={loadables}
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
          <EpiCaseSetInfoDialog
            ref={epiCaseSetInfoDialogRef}
            showNavigationButton
          />
          <EpiCreateEventDialog
            ref={epiCreateEventDialogRef}
          />
        </Box>
      </PageContainer>
    </TableStoreProvider>
  );
};
