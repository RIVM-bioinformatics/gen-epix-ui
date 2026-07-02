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
import type { EpiCaseSetInfoDialogRefMethods } from '../EpiCaseSetInfoDialog';
import { EpiCaseSetInfoDialog } from '../EpiCaseSetInfoDialog';
import type { EpiCaseTypeInfoDialogRefMethods } from '../EpiCaseTypeInfoDialog';
import { EpiCaseTypeInfoDialog } from '../EpiCaseTypeInfoDialog';
import { EpiAddCasesToEventDialog } from '../EpiAddCasesToEventDialog';
import type { EpiAddCasesToEventDialogRefMethods } from '../EpiAddCasesToEventDialog';
import { EpiCaseInfoDialog } from '../EpiCaseInfoDialog';
import type { EpiCaseInfoDialogRefMethods } from '../EpiCaseInfoDialog';
import { EpiCreateEventDialog } from '../EpiCreateEventDialog';
import type { EpiCreateEventDialogRefMethods } from '../EpiCreateEventDialog';
import { EpiRemoveCasesFromEventDialog } from '../EpiRemoveCasesFromEventDialog';
import type { EpiRemoveCasesFromEventDialogRefMethods } from '../EpiRemoveCasesFromEventDialog';
import { EpiSequenceDownloadDialog } from '../EpiSequenceDownloadDialog';
import type { EpiSequenceDownloadDialogRefMethods } from '../EpiSequenceDownloadDialog';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { EpiStratification } from '../EpiStratification';
import { EpiFindSimilarCasesDialog } from '../EpiFindSimilarCasesDialog';
import type { EpiFindSimilarCasesDialogRefMethods } from '../EpiFindSimilarCasesDialog';
import { EpiRemoveFindSimilarCasesResultDialog } from '../EpiRemoveFindSimilarCasesResultDialog/EpiRemoveFindSimilarCasesResultDialog';
import type { EpiRemoveFindSimilarCasesResultDialogRefMethods } from '../EpiRemoveFindSimilarCasesResultDialog/EpiRemoveFindSimilarCasesResultDialog';
import { EpiEventBusService } from '../../../classes/services/EpiEventBusService';

import {
  EpiDashboardSettingsSidebarItem,
  EpiDashboardSettingsSidebarItemIcon,
} from './EpiDashboardSettingsSidebarItem';
import { EpiDashboardLayoutRenderer } from './EpiDashboardLayoutRenderer';
import type { ForwardRefEpiDashboardLayoutRendererRefMethods } from './EpiDashboardLayoutRenderer';
import {
  EpiDashboardDownloadSidebarItem,
  EpiDashboardDownloadSidebarItemIcon,
} from './EpiDashboardDownloadSidebarItem';

type EpiDashboardProps = {
  readonly caseSet?: CaseDbCaseSet;
};

export const EpiDashboardContent = ({ caseSet }: EpiDashboardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const epiDashboardLayoutRendererRef = useRef<ForwardRefEpiDashboardLayoutRendererRefMethods>(null);
  const epiCaseSetInfoDialogRef = useRef<EpiCaseSetInfoDialogRefMethods>(null);
  const epiCaseTypeInfoDialogRef = useRef<EpiCaseTypeInfoDialogRefMethods>(null);
  const epiContactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const epiSequenceDownloadDialogRef = useRef<EpiSequenceDownloadDialogRefMethods>(null);
  const epiCaseInfoDialogRef = useRef<EpiCaseInfoDialogRefMethods>(null);
  const epiFindSimilarCasesDialogRef = useRef<EpiFindSimilarCasesDialogRefMethods>(null);
  const epiCreateEventDialogRef = useRef<EpiCreateEventDialogRefMethods>(null);
  const epiRemoveCasesFromEventDialogRef = useRef<EpiRemoveCasesFromEventDialogRefMethods>(null);
  const epiAddCasesToEventDialogRef = useRef<EpiAddCasesToEventDialogRefMethods>(null);
  const epiRemoveFindSimilarCasesResultDialogRef = useRef<EpiRemoveFindSimilarCasesResultDialogRefMethods>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [isDownloadSidebarOpen, setIsDownloadSidebarOpen] = useState(false);
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const fetchData = useStore(epiDashboardStore, useShallow((state) => state.fetchData));
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const activeFiltersCount = useStore(epiDashboardStore, (state) => state.filters.filter(f => !f.isInitialFilterValue()).length);
  const isMaxResultsExceeded = useStore(epiDashboardStore, (state) => state.isMaxResultsExceeded);
  const isMaxResultsExceededDismissed = useStore(epiDashboardStore, (state) => state.isMaxResultsExceededDismissed);

  const onMaxResultsExceededButtonClose = useCallback(() => {
    epiDashboardStore.setState({ isMaxResultsExceededDismissed: true });
  }, [epiDashboardStore]);

  useEffect(() => {
    const eventBus = EpiEventBusService.getInstance();
    const removers = [
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('onEventCreated', () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchData();
      }),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openAddCasesToEventDialog', (...args) => epiAddCasesToEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openCaseInfoDialog', (...args) => epiCaseInfoDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openContactDetailsDialog', (...args) => epiContactDetailsDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openCreateEventDialog', (...args) => epiCreateEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openFindSimilarCasesDialog', (...args) => epiFindSimilarCasesDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openRemoveFindSimilarCasesResultDialog', (...args) => epiRemoveFindSimilarCasesResultDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openRemoveCasesFromEventDialog', (...args) => epiRemoveCasesFromEventDialogRef.current?.open(...args)),
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
      eventBus.addEventListener('openSequenceDownloadDialog', (...args) => epiSequenceDownloadDialogRef.current?.open(...args)),
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
        epiCaseTypeInfoDialogRef.current.open();
      }, key: 'i', modifier: null }),
    ];
    return () => {
      removers.forEach(callbackfn => callbackfn());
    };
  }, []);

  const onEpiDashboardFilterSidebarClose = useCallback(() => {
    setIsFilterSidebarOpen(false);
  }, []);

  const onEpiDashboardOpenFilterSidebarButtonClick = useCallback(() => {
    setIsFilterSidebarOpen(true);
  }, []);

  const onEpiDashboardSettingsSidebarClose = useCallback(() => {
    setIsSettingsSidebarOpen(false);
  }, []);

  const onEpiDashboardDownloadSidebarClose = useCallback(() => {
    setIsDownloadSidebarOpen(false);
  }, []);

  const onEpiDashboardLayoutSelectorSidebarButtonClick = useCallback(() => {
    setIsSettingsSidebarOpen(true);
  }, []);

  const onEpiDashboardOpenDownloadButtonClick = useCallback(() => {
    setIsDownloadSidebarOpen(true);
  }, []);

  const onEpiDashboardOpenInfoSidebarButtonClick = useCallback(() => {
    epiCaseTypeInfoDialogRef.current.open();
  }, []);

  const onEpiDashboardOpenCaseSetDescriptionButtonClick = useCallback(() => {
    epiCaseSetInfoDialogRef.current.open({
      caseSetId: caseSet?.id,
      caseTypeId: completeCaseType?.id,
    });
  }, [caseSet?.id, completeCaseType?.id]);

  const onEpiDashboardLayoutSelectorSidebarReset = useCallback(() => {
    epiDashboardLayoutRendererRef.current?.reset();
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
          onClick={onEpiDashboardOpenFilterSidebarButtonClick}
          testIdAttributes={{ name: 'filters' }}
          title={t`Open filters`}
        />
        <SidebarMenuItem
          badgeColor={'secondary'}
          icon={<EpiDashboardSettingsSidebarItemIcon />}
          onClick={onEpiDashboardLayoutSelectorSidebarButtonClick}
          testIdAttributes={{ name: 'dashboard' }}
          title={t`Change dashboard layout`}
        />
        <SidebarMenuItem
          icon={<InfoIcon />}
          onClick={onEpiDashboardOpenInfoSidebarButtonClick}
          testIdAttributes={{ name: 'case' }}
          title={t`Show case type information`}
        />
        {caseSet && (
          <SidebarMenuItem
            icon={<CollectionIcon />}
            onClick={onEpiDashboardOpenCaseSetDescriptionButtonClick}
            testIdAttributes={{ name: 'event' }}
            title={t`Show event information`}
          />
        )}
        <SidebarMenuItem
          icon={<EpiDashboardDownloadSidebarItemIcon />}
          onClick={onEpiDashboardOpenDownloadButtonClick}
          testIdAttributes={{ name: 'download' }}
          title={t`Download`}
        />
        <TableFiltersSidebarItem
          onClose={onEpiDashboardFilterSidebarClose}
          open={isFilterSidebarOpen}
        />
        <EpiDashboardSettingsSidebarItem
          onClose={onEpiDashboardSettingsSidebarClose}
          onReset={onEpiDashboardLayoutSelectorSidebarReset}
          open={isSettingsSidebarOpen}
        />
        <EpiCaseTypeInfoDialog
          ref={epiCaseTypeInfoDialogRef}
        />
        {caseSet && (
          <EpiCaseSetInfoDialog ref={epiCaseSetInfoDialogRef} />
        )}
        <EpiDashboardDownloadSidebarItem
          onClose={onEpiDashboardDownloadSidebarClose}
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
          <EpiStratification />
        </Box>
        <Box>
          <EpiDashboardLayoutRenderer
            disabled={isFilterSidebarOpen || isSettingsSidebarOpen}
            ref={epiDashboardLayoutRendererRef}
          />
        </Box>
      </Box>
      <EpiContactDetailsDialog ref={epiContactDetailsDialogRef} />
      <EpiFindSimilarCasesDialog ref={epiFindSimilarCasesDialogRef} />
      <EpiRemoveFindSimilarCasesResultDialog ref={epiRemoveFindSimilarCasesResultDialogRef} />
      <EpiSequenceDownloadDialog ref={epiSequenceDownloadDialogRef} />
      <EpiCaseInfoDialog ref={epiCaseInfoDialogRef} />
      <EpiCreateEventDialog ref={epiCreateEventDialogRef} />
      <EpiRemoveCasesFromEventDialog ref={epiRemoveCasesFromEventDialogRef} />
      <EpiAddCasesToEventDialog ref={epiAddCasesToEventDialogRef} />
    </>
  );
};
