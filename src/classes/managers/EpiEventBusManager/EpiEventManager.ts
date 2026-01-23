import type { EpiAddCasesToEventDialogOpenProps } from '../../../components/epi/EpiAddCasesToEventDialog';
import type { EpiBulkEditCaseDialogOpenProps } from '../../../components/epi/EpiBulkEditCaseDialog';
import type { EpiCaseInfoDialogOpenProps } from '../../../components/epi/EpiCaseInfoDialog';
import type { EpiContactDetailsDialogOpenProps } from '../../../components/epi/EpiContactDetailsDialog';
import type { EpiCreateEventDialogOpenProps } from '../../../components/epi/EpiCreateEventDialog';
import type { EpiRemoveCasesFromEventDialogOpenProps } from '../../../components/epi/EpiRemoveCasesFromEventDialog';
import type { EpiSequenceDownloadDialogOpenProps } from '../../../components/epi/EpiSequenceDownloadDialog';
import type { EPI_ZONE } from '../../../models/epi';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';

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
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openBulkEditCaseDialog: EpiBulkEditCaseDialogOpenProps;
  openFiltersMenu: void;
  onEventCreated: void;
  onDownloadOptionsRequested: void;
  onDownloadOptionsChanged: DownloadConfig;
};

export class EpiEventBusManager extends EventBusAbstract<EpiEvent> {
  private static __instance: EpiEventBusManager;

  private constructor() {
    super();
  }

  public static get instance(): EpiEventBusManager {
    EpiEventBusManager.__instance = EpiEventBusManager.__instance || new EpiEventBusManager();
    return EpiEventBusManager.__instance;
  }

}
