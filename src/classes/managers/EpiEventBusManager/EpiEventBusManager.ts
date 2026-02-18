import type { EpiAddCasesToEventDialogOpenProps } from '../../../components/epi/EpiAddCasesToEventDialog';
import type { EpiBulkEditCaseDialogOpenProps } from '../../../components/epi/EpiBulkEditCaseDialog';
import type { EpiCaseInfoDialogOpenProps } from '../../../components/epi/EpiCaseInfoDialog';
import type { EpiContactDetailsDialogOpenProps } from '../../../components/epi/EpiContactDetailsDialog';
import type { EpiCreateEventDialogOpenProps } from '../../../components/epi/EpiCreateEventDialog';
import type { EpiFindSimilarCasesDialogOpenProps } from '../../../components/epi/EpiFindSimilarCasesDialog';
import type { EpiRemoveCasesFromEventDialogOpenProps } from '../../../components/epi/EpiRemoveCasesFromEventDialog';
import type { EpiSequenceDownloadDialogOpenProps } from '../../../components/epi/EpiSequenceDownloadDialog';
import type { EPI_ZONE } from '../../../models/epi';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';
import { WindowManager } from '../WindowManager';

export type DownloadConfigItem = {
  label: string;
  callback: () => void;
  disabled?: boolean;
};

export type DownloadConfigSection = {
  label: string;
  items: DownloadConfigItem[];
  disabled?: boolean;
};

export type DownloadConfigItems = DownloadConfigItem | DownloadConfigSection;

export type DownloadConfig = {
  zone: EPI_ZONE;
  disabled?: boolean;
  items: DownloadConfigItems[];
  zoneLabel: string;
};

type EpiEvent = {
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openSequenceDownloadDialog: EpiSequenceDownloadDialogOpenProps;
  openCaseInfoDialog: EpiCaseInfoDialogOpenProps;
  openCreateEventDialog: EpiCreateEventDialogOpenProps;
  openFindSimilarCasesDialog: EpiFindSimilarCasesDialogOpenProps;
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openBulkEditCaseDialog: EpiBulkEditCaseDialogOpenProps;
  openFiltersMenu: void;
  onEventCreated: void;
  onDownloadOptionsRequested: void;
  onDownloadOptionsChanged: DownloadConfig;
};

export class EpiEventBusManager extends EventBusAbstract<EpiEvent> {
  private constructor() {
    super();
  }

  public static get instance(): EpiEventBusManager {
    WindowManager.instance.window.managers.epiEventBus = WindowManager.instance.window.managers.epiEventBus || new EpiEventBusManager();
    return WindowManager.instance.window.managers.epiEventBus;
  }

}
