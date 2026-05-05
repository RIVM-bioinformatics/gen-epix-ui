import type { EpiAddCasesToEventDialogOpenProps } from '../../../components/epi/EpiAddCasesToEventDialog';
import type { EpiBulkEditCaseDialogOpenProps } from '../../../components/epi/EpiBulkEditCaseDialog';
import type { EpiCaseInfoDialogOpenProps } from '../../../components/epi/EpiCaseInfoDialog';
import type { EpiContactDetailsDialogOpenProps } from '../../../components/epi/EpiContactDetailsDialog';
import type { EpiCreateEventDialogOpenProps } from '../../../components/epi/EpiCreateEventDialog';
import type { EpiFindSimilarCasesDialogOpenProps } from '../../../components/epi/EpiFindSimilarCasesDialog';
import type { EpiRemoveCasesFromEventDialogOpenProps } from '../../../components/epi/EpiRemoveCasesFromEventDialog';
import type { EpiRemoveFindSimilarCasesResultDialogOpenProps } from '../../../components/epi/EpiRemoveFindSimilarCasesResultDialog/EpiRemoveFindSimilarCasesResultDialog';
import type { EpiSequenceDownloadDialogOpenProps } from '../../../components/epi/EpiSequenceDownloadDialog';
import { HmrUtil } from '../../../../../ui/src/utils/HmrUtil';
import type { EPI_ZONE } from '../../../../../ui-casedb/src/models/epi';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';

export type DownloadConfig = {
  disabled?: boolean;
  items: DownloadConfigItems[];
  zone: EPI_ZONE;
  zoneLabel: string;
};

export type DownloadConfigItem = {
  callback: () => void;
  disabled?: boolean;
  label: string;
};

export type DownloadConfigItems = DownloadConfigItem | DownloadConfigSection;

export type DownloadConfigSection = {
  disabled?: boolean;
  items: DownloadConfigItem[];
  label: string;
};

type EpiEvent = {
  onDownloadOptionsChanged: DownloadConfig;
  onDownloadOptionsRequested: void;
  onEventCreated: void;
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openBulkEditCaseDialog: EpiBulkEditCaseDialogOpenProps;
  openCaseInfoDialog: EpiCaseInfoDialogOpenProps;
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openCreateEventDialog: EpiCreateEventDialogOpenProps;
  openFiltersMenu: void;
  openFindSimilarCasesDialog: EpiFindSimilarCasesDialogOpenProps;
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openRemoveFindSimilarCasesResultDialog: EpiRemoveFindSimilarCasesResultDialogOpenProps;
  openSequenceDownloadDialog: EpiSequenceDownloadDialogOpenProps;
};

export class EpiEventBusManager extends EventBusAbstract<EpiEvent> {
  public static get instance(): EpiEventBusManager {
    EpiEventBusManager.__instance = HmrUtil.getHmrSingleton('epiEventBusManager', EpiEventBusManager.__instance, () => new EpiEventBusManager());
    return EpiEventBusManager.__instance;
  }

  private static __instance: EpiEventBusManager;

  private constructor() {
    super();
  }

}
