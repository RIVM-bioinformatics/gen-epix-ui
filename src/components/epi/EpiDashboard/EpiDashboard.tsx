import {
  useTheme,
  Box,
} from '@mui/material';
import {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import InfoIcon from '@mui/icons-material/Info';

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import type { EpiCaseSetInfoDialogRefMethods } from '../EpiCaseSetInfoDialog';
import { EpiCaseSetInfoDialog } from '../EpiCaseSetInfoDialog';
import type { EpiCaseTypeInfoDialogRefMethods } from '../EpiCaseTypeInfoDialog';
import { EpiCaseTypeInfoDialog } from '../EpiCaseTypeInfoDialog';
import { withEpiStore } from '../EpiStoreLoader';
import {
  EpiAddCasesToEventDialog,
  type EpiAddCasesToEventDialogRefMethods,
} from '../EpiAddCasesToEventDialog';
import {
  EpiBulkEditCaseDialog,
  type EpiBulkEditCaseDialogRefMethods,
} from '../EpiBulkEditCaseDialog';
import {
  EpiCaseInfoDialog,
  type EpiCaseInfoDialogRefMethods,
} from '../EpiCaseInfoDialog';
import {
  EpiContactDetailsDialog,
  type EpiContactDetailsDialogRefMethods,
} from '../EpiContactDetailsDialog';
import {
  EpiCreateEventDialog,
  type EpiCreateEventDialogRefMethods,
} from '../EpiCreateEventDialog';
import {
  EpiRemoveCasesFromEventDialog,
  type EpiRemoveCasesFromEventDialogRefMethods,
} from '../EpiRemoveCasesFromEventDialog';
import {
  EpiSequenceDownloadDialog,
  type EpiSequenceDownloadDialogRefMethods,
} from '../EpiSequenceDownloadDialog';
import type { CaseSet } from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { KeyboardShortcutManager } from '../../../classes/managers/KeyboardShortcutManager';
import { Subject } from '../../../classes/Subject';
import type { EpiLinkedScrollSubjectValue } from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import { EpiStoreContext } from '../../../stores/epiStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { EpiDashboardUtil } from '../../../utils/EpiDashboardUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';
import {
  SidebarMenu,
  SidebarMenuItem,
} from '../../ui/Sidebar';
import {
  TableFiltersSidebarItemIcon,
  TableFiltersSidebarItem,
} from '../../ui/Table';
import { EpiCurve } from '../EpiCurve';
import { EpiList } from '../EpiList';
import { EpiMap } from '../EpiMap';
import { EpiStratification } from '../EpiStratification';
import type { EpiTreeRef } from '../EpiTree';
import { EpiTree } from '../EpiTree';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';

import {
  EpiDashboardSettingsSidebarItemIcon,
  EpiDashboardSettingsSidebarItem,
} from './EpiDashboardSettingsSidebarItem';
import { EpiDashboardLayoutRenderer } from './EpiDashboardLayoutRenderer';
import type { ForwardRefEpiDashboardLayoutRendererRefMethods } from './EpiDashboardLayoutRenderer';

type EpiDashboardProps = {
  readonly caseSet?: CaseSet;
  readonly caseTypeId: string;
};

export const EpiDashboard = withEpiStore(({ caseSet }: EpiDashboardProps) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const epiDashboardLayoutRendererRef = useRef<ForwardRefEpiDashboardLayoutRendererRefMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const epiCaseSetInfoDialogRef = useRef<EpiCaseSetInfoDialogRefMethods>(null);
  const epiCaseTypeInfoDialogRef = useRef<EpiCaseTypeInfoDialogRefMethods>(null);
  const epiContactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const epiSequenceDownloadDialogRef = useRef<EpiSequenceDownloadDialogRefMethods>(null);
  const epiCaseInfoDialogRef = useRef<EpiCaseInfoDialogRefMethods>(null);
  const epiCreateEventDialogRef = useRef<EpiCreateEventDialogRefMethods>(null);
  const epiRemoveCasesFromEventDialogRef = useRef<EpiRemoveCasesFromEventDialogRefMethods>(null);
  const epiAddCasesToEventDialogRef = useRef<EpiAddCasesToEventDialogRefMethods>(null);
  const epiBulkEditCaseDialogRef = useRef<EpiBulkEditCaseDialogRefMethods>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const epiTreeRef = useRef<EpiTreeRef>(null);
  const linkedScrollSubject = useMemo(() => {
    return new Subject<EpiLinkedScrollSubjectValue>();
  }, []);
  const epiStore = useContext(EpiStoreContext);
  const fetchData = useStore(epiStore, useShallow((state) => state.fetchData));
  const dataError = useStore(epiStore, (state) => state.dataError);
  const activeFiltersCount = useStore(epiStore, (state) => state.filters.filter(f => !f.isInitialFilterValue()).length);
  const numLayoutZones = useStore(userProfileStore, (state) => Object.keys(state.epiDashboardLayoutUserConfig.zones).length);
  const numVisibleLayoutZones = useStore(userProfileStore, (state) => EpiDashboardUtil.getEnabledZones(state.epiDashboardLayoutUserConfig).length);
  const numHiddenLayoutZones = numLayoutZones - numVisibleLayoutZones;

  useEffect(() => {
    const eventBus = EpiEventBusManager.instance;
    const removers = [
      eventBus.addEventListener('onEventCreated', () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchData();
      }),
      eventBus.addEventListener('openAddCasesToEventDialog', (...args) => epiAddCasesToEventDialogRef.current?.open(...args)),
      eventBus.addEventListener('openCaseInfoDialog', (...args) => epiCaseInfoDialogRef.current?.open(...args)),
      eventBus.addEventListener('openContactDetailsDialog', (...args) => epiContactDetailsDialogRef.current?.open(...args)),
      eventBus.addEventListener('openCreateEventDialog', (...args) => epiCreateEventDialogRef.current?.open(...args)),
      eventBus.addEventListener('openRemoveCasesFromEventDialog', (...args) => epiRemoveCasesFromEventDialogRef.current?.open(...args)),
      eventBus.addEventListener('openSequenceDownloadDialog', (...args) => epiSequenceDownloadDialogRef.current?.open(...args)),
      eventBus.addEventListener('openBulkEditCaseDialog', (...args) => epiBulkEditCaseDialogRef.current?.open(...args)),
    ];
    return () => {
      removers.forEach(callbackfn => callbackfn());
    };
  }, [fetchData]);

  useEffect(() => {
    const removers = [
      KeyboardShortcutManager.instance.registerShortcut({ key: 'f', modifier: null, callback: () => {
        setIsFilterSidebarOpen(x => !x);
      } }),
      KeyboardShortcutManager.instance.registerShortcut({ key: 's', modifier: null, callback: () => {
        setIsSettingsSidebarOpen(x => !x);
      } }),
      KeyboardShortcutManager.instance.registerShortcut({ key: 'i', modifier: null, callback: () => {
        epiCaseTypeInfoDialogRef.current.open();
      } }),
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

  const onEpiDashboardLayoutSelectorSidebarButtonClick = useCallback(() => {
    setIsSettingsSidebarOpen(true);
  }, []);

  const onEpiDashboardOpenInfoSidebarButtonClick = useCallback(() => {
    epiCaseTypeInfoDialogRef.current.open();
  }, []);

  const onEpiDashboardOpenCaseSetDescriptionButtonClick = useCallback(() => {
    epiCaseSetInfoDialogRef.current.open({
      caseSetId: caseSet.id,
    });
  }, [caseSet]);

  const onEpiDashboardLayoutSelectorSidebarReset = useCallback(() => {
    epiDashboardLayoutRendererRef.current?.reset();
  }, []);

  const onEpiListLink = useCallback(() => {
    epiTreeRef.current?.link();
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <ResponseHandler
        error={dataError}
        isLoading={false}
      >

        {/* Sidebar */}
        <SidebarMenu>
          <SidebarMenuItem
            badgeColor={'secondary'}
            badgeContent={activeFiltersCount}
            first
            icon={<TableFiltersSidebarItemIcon />}
            onClick={onEpiDashboardOpenFilterSidebarButtonClick}
            data-testid-prop-name={'filters'}
            title={t`Open filters`}
          />
          <SidebarMenuItem
            badgeColor={numHiddenLayoutZones === numLayoutZones ? 'error' : 'secondary'}
            badgeContent={numHiddenLayoutZones === numLayoutZones ? '!' : numHiddenLayoutZones}
            icon={<EpiDashboardSettingsSidebarItemIcon />}
            onClick={onEpiDashboardLayoutSelectorSidebarButtonClick}
            data-testid-prop-name={'dashboard'}
            title={t('Change dashboard layout (hidden zones: {{numHiddenLayoutZones}})', { numHiddenLayoutZones })}
          />
          <SidebarMenuItem
            icon={<InfoIcon />}
            onClick={onEpiDashboardOpenInfoSidebarButtonClick}
            data-testid-prop-name={'case'}
            title={t`Show case type information`}
          />
          {caseSet && (
            <SidebarMenuItem
              icon={<CollectionIcon />}
              onClick={onEpiDashboardOpenCaseSetDescriptionButtonClick}
              data-testid-prop-name={'event'}
              title={t`Show event information`}
            />
          )}
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
        </SidebarMenu>

        {/* Content */}
        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'max-content auto',
          paddingLeft: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH + 1),
        }}
        >
          <Box>
            <EpiStratification />
          </Box>

          <Box>
            <EpiDashboardLayoutRenderer
              disabled={isFilterSidebarOpen || isSettingsSidebarOpen}
              epiCurveWidget={(
                <ErrorBoundary fallback={(
                  <EpiWidgetUnavailable
                    epiZone={EPI_ZONE.EPI_CURVE}
                    widgetName={t`epi curve`}
                  />
                )}
                >
                  <EpiCurve />
                </ErrorBoundary>
              )}
              lineListWidget={(
                <EpiList
                  caseSet={caseSet}
                  linkedScrollSubject={linkedScrollSubject}
                  onLink={onEpiListLink}
                />
              )}
              mapWidget={(
                <ErrorBoundary fallback={(
                  <EpiWidgetUnavailable
                    epiZone={EPI_ZONE.MAP}
                    widgetName={t`map`}
                  />
                )}
                >
                  <EpiMap />
                </ErrorBoundary>
              )}
              phylogeneticTreeWidget={(
                <EpiTree
                  linkedScrollSubject={linkedScrollSubject}
                  ref={epiTreeRef}
                />
              )}
              ref={epiDashboardLayoutRendererRef}
            />
          </Box>
        </Box>
      </ResponseHandler>
      <EpiContactDetailsDialog ref={epiContactDetailsDialogRef} />
      <EpiSequenceDownloadDialog ref={epiSequenceDownloadDialogRef} />
      <EpiCaseInfoDialog ref={epiCaseInfoDialogRef} />
      <EpiCreateEventDialog ref={epiCreateEventDialogRef} />
      <EpiRemoveCasesFromEventDialog ref={epiRemoveCasesFromEventDialogRef} />
      <EpiAddCasesToEventDialog ref={epiAddCasesToEventDialogRef} />
      <EpiBulkEditCaseDialog ref={epiBulkEditCaseDialogRef} />
    </Box>
  );
});
