import {
  Alert,
  AlertTitle,
  Box,
  useTheme,
} from '@mui/material';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import InfoIcon from '@mui/icons-material/Info';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import type { EpiContactDetailsDialogRefMethods } from '@gen-epix/ui';
import {
  ConfigService,
  EpiContactDetailsDialog,
  KeyboardShortcutService,
  SidebarMenu,
  SidebarMenuItem,
  TableFiltersSidebarItem,
  TableFiltersSidebarItemIcon,
} from '@gen-epix/ui';

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import type { CaseSetInfoDialogRefMethods } from '../CaseSetInfoDialog';
import { CaseSetInfoDialog } from '../CaseSetInfoDialog';
import type { CaseTypeInfoDialogRefMethods } from '../CaseTypeInfoDialog';
import { CaseTypeInfoDialog } from '../CaseTypeInfoDialog';
import { AddCasesToEventDialog } from '../AddCasesToEventDialog';
import type { AddCasesToEventDialogRefMethods } from '../AddCasesToEventDialog';
import { CaseInfoDialog } from '../CaseInfoDialog';
import type { CaseInfoDialogRefMethods } from '../CaseInfoDialog';
import { CreateEventDialog } from '../CreateEventDialog';
import type { CreateEventDialogRefMethods } from '../CreateEventDialog';
import { RemoveCasesFromEventDialog } from '../RemoveCasesFromEventDialog';
import type { RemoveCasesFromEventDialogRefMethods } from '../RemoveCasesFromEventDialog';
import { SequenceDownloadDialog } from '../SequenceDownloadDialog';
import type { SequenceDownloadDialogRefMethods } from '../SequenceDownloadDialog';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { Grouping } from '../Grouping';
import { FindSimilarCasesDialog } from '../FindSimilarCasesDialog';
import type { FindSimilarCasesDialogRefMethods } from '../FindSimilarCasesDialog';
import { RemoveFindSimilarCasesResultDialog } from '../RemoveFindSimilarCasesResultDialog/RemoveFindSimilarCasesResultDialog';
import type { RemoveFindSimilarCasesResultDialogRefMethods } from '../RemoveFindSimilarCasesResultDialog/RemoveFindSimilarCasesResultDialog';
import { EventBusService } from '../../../classes/services/EventBusService';

import {
  DashboardSettingsSidebarItem,
  DashboardSettingsSidebarItemIcon,
} from './DashboardSettingsSidebarItem';
import { DashboardLayoutRenderer } from './DashboardLayoutRenderer';
import type { ForwardRefDashboardLayoutRendererRefMethods } from './DashboardLayoutRenderer';
import {
  DashboardDownloadSidebarItem,
  DashboardDownloadSidebarItemIcon,
} from './DashboardDownloadSidebarItem';

type DashboardProps = {
  readonly caseSet?: CaseDbCaseSet;
};

export const DashboardContent = ({ caseSet }: DashboardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dashboardLayoutRendererRef = useRef<ForwardRefDashboardLayoutRendererRefMethods>(null);
  const caseSetInfoDialogRef = useRef<CaseSetInfoDialogRefMethods>(null);
  const caseTypeInfoDialogRef = useRef<CaseTypeInfoDialogRefMethods>(null);
  const contactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const sequenceDownloadDialogRef = useRef<SequenceDownloadDialogRefMethods>(null);
  const caseInfoDialogRef = useRef<CaseInfoDialogRefMethods>(null);
  const findSimilarCasesDialogRef = useRef<FindSimilarCasesDialogRefMethods>(null);
  const createEventDialogRef = useRef<CreateEventDialogRefMethods>(null);
  const removeCasesFromEventDialogRef = useRef<RemoveCasesFromEventDialogRefMethods>(null);
  const addCasesToEventDialogRef = useRef<AddCasesToEventDialogRefMethods>(null);
  const removeFindSimilarCasesResultDialogRef = useRef<RemoveFindSimilarCasesResultDialogRefMethods>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [isDownloadSidebarOpen, setIsDownloadSidebarOpen] = useState(false);
  const dashboardStore = use(DashboardStoreContext);
  const fetchData = useStore(dashboardStore, useShallow((state) => state.fetchData));
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const activeFiltersCount = useStore(dashboardStore, (state) => state.filters.filter(f => !f.isInitialFilterValue()).length);
  const isMaxResultsExceeded = useStore(dashboardStore, (state) => state.isMaxResultsExceeded);
  const isMaxResultsExceededDismissed = useStore(dashboardStore, (state) => state.isMaxResultsExceededDismissed);

  const onMaxResultsExceededButtonClose = useCallback(() => {
    dashboardStore.setState({ isMaxResultsExceededDismissed: true });
  }, [dashboardStore]);

  useEffect(() => {
    const eventBus = EventBusService.getInstance();
    const removers = [
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('onEventCreated', () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchData();
      }),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openAddCasesToEventDialog', (...args) => addCasesToEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openCaseInfoDialog', (...args) => caseInfoDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openContactDetailsDialog', (...args) => contactDetailsDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openCreateEventDialog', (...args) => createEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openFindSimilarCasesDialog', (...args) => findSimilarCasesDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openRemoveFindSimilarCasesResultDialog', (...args) => removeFindSimilarCasesResultDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openRemoveCasesFromEventDialog', (...args) => removeCasesFromEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openSequenceDownloadDialog', (...args) => sequenceDownloadDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openFiltersMenu', () => setIsFilterSidebarOpen(true)),
    ];
    return () => {
      removers.forEach(callbackfn => callbackfn());
    };
  }, [fetchData]);

  useEffect(() => {
    const removers = [
      KeyboardShortcutService.getInstance().registerShortcut({ callback: () => {
        setIsFilterSidebarOpen(x => !x);
      }, key: 'f', modifier: null }),
      KeyboardShortcutService.getInstance().registerShortcut({ callback: () => {
        setIsSettingsSidebarOpen(x => !x);
      }, key: 's', modifier: null }),
      KeyboardShortcutService.getInstance().registerShortcut({ callback: () => {
        caseTypeInfoDialogRef.current.open();
      }, key: 'i', modifier: null }),
    ];
    return () => {
      removers.forEach(callbackfn => callbackfn());
    };
  }, []);

  const onDashboardFilterSidebarClose = useCallback(() => {
    setIsFilterSidebarOpen(false);
  }, []);

  const onDashboardOpenFilterSidebarButtonClick = useCallback(() => {
    setIsFilterSidebarOpen(true);
  }, []);

  const onDashboardSettingsSidebarClose = useCallback(() => {
    setIsSettingsSidebarOpen(false);
  }, []);

  const onDashboardDownloadSidebarClose = useCallback(() => {
    setIsDownloadSidebarOpen(false);
  }, []);

  const onDashboardLayoutSelectorSidebarButtonClick = useCallback(() => {
    setIsSettingsSidebarOpen(true);
  }, []);

  const onDashboardOpenDownloadButtonClick = useCallback(() => {
    setIsDownloadSidebarOpen(true);
  }, []);

  const onDashboardOpenInfoSidebarButtonClick = useCallback(() => {
    caseTypeInfoDialogRef.current.open();
  }, []);

  const onDashboardOpenCaseSetDescriptionButtonClick = useCallback(() => {
    caseSetInfoDialogRef.current.open({
      caseSetId: caseSet?.id,
      caseTypeId: completeCaseType?.id,
    });
  }, [caseSet?.id, completeCaseType?.id]);

  const onDashboardLayoutSelectorSidebarReset = useCallback(() => {
    dashboardLayoutRendererRef.current?.reset();
  }, []);

  const shouldShowMaxResultsExceededAlert = useMemo(() => {
    return !!isMaxResultsExceeded && !isMaxResultsExceededDismissed;
  }, [isMaxResultsExceededDismissed, isMaxResultsExceeded]);

  return (
    <>
      {/* Sidebar */}
      <SidebarMenu>
        <SidebarMenuItem
          badgeColor={'secondary'}
          badgeContent={activeFiltersCount}
          first
          icon={<TableFiltersSidebarItemIcon />}
          onClick={onDashboardOpenFilterSidebarButtonClick}
          testIdAttributes={{ name: 'filters' }}
          title={t`Open filters`}
        />
        <SidebarMenuItem
          badgeColor={'secondary'}
          icon={<DashboardSettingsSidebarItemIcon />}
          onClick={onDashboardLayoutSelectorSidebarButtonClick}
          testIdAttributes={{ name: 'dashboard' }}
          title={t`Change dashboard layout`}
        />
        <SidebarMenuItem
          icon={<InfoIcon />}
          onClick={onDashboardOpenInfoSidebarButtonClick}
          testIdAttributes={{ name: 'case' }}
          title={t`Show case type information`}
        />
        {caseSet && (
          <SidebarMenuItem
            icon={<CollectionIcon />}
            onClick={onDashboardOpenCaseSetDescriptionButtonClick}
            testIdAttributes={{ name: 'event' }}
            title={t`Show event information`}
          />
        )}
        <SidebarMenuItem
          icon={<DashboardDownloadSidebarItemIcon />}
          onClick={onDashboardOpenDownloadButtonClick}
          testIdAttributes={{ name: 'download' }}
          title={t`Download`}
        />
        <TableFiltersSidebarItem
          onClose={onDashboardFilterSidebarClose}
          open={isFilterSidebarOpen}
        />
        <DashboardSettingsSidebarItem
          onClose={onDashboardSettingsSidebarClose}
          onReset={onDashboardLayoutSelectorSidebarReset}
          open={isSettingsSidebarOpen}
        />
        <CaseTypeInfoDialog
          ref={caseTypeInfoDialogRef}
        />
        {caseSet && (
          <CaseSetInfoDialog ref={caseSetInfoDialogRef} />
        )}
        <DashboardDownloadSidebarItem
          onClose={onDashboardDownloadSidebarClose}
          open={isDownloadSidebarOpen}
        />
      </SidebarMenu>
      {/* Content */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: `${shouldShowMaxResultsExceededAlert ? 'max-content ' : ''}max-content auto`,
          height: '100%',
          paddingLeft: theme.spacing(ConfigService.getInstance().config.layout.SIDEBAR_MENU_WIDTH + 1),
          width: '100%',
        }}
      >
        {shouldShowMaxResultsExceededAlert && (
          <Box>
            <Alert
              onClose={onMaxResultsExceededButtonClose}
              severity={'warning'}
              sx={{
                width: '100%',
              }}
            >
              <AlertTitle>
                {t`Maximum number of results exceeded`}
              </AlertTitle>
              {t('The maximum number of results for {{caseTypeName}} ({{maxResultsForCaseType}}) has been exceeded. Refine your filters to reduce the number of results.', { caseTypeName: completeCaseType.name, maxResultsForCaseType: completeCaseType.props.read_max_n_cases })}
            </Alert>
          </Box>
        )}
        <Box>
          <Grouping />
        </Box>
        <Box>
          <DashboardLayoutRenderer
            disabled={isFilterSidebarOpen || isSettingsSidebarOpen}
            ref={dashboardLayoutRendererRef}
          />
        </Box>
      </Box>
      <EpiContactDetailsDialog ref={contactDetailsDialogRef} />
      <FindSimilarCasesDialog ref={findSimilarCasesDialogRef} />
      <RemoveFindSimilarCasesResultDialog ref={removeFindSimilarCasesResultDialogRef} />
      <SequenceDownloadDialog ref={sequenceDownloadDialogRef} />
      <CaseInfoDialog ref={caseInfoDialogRef} />
      <CreateEventDialog ref={createEventDialogRef} />
      <RemoveCasesFromEventDialog ref={removeCasesFromEventDialogRef} />
      <AddCasesToEventDialog ref={addCasesToEventDialogRef} />
    </>
  );
};
