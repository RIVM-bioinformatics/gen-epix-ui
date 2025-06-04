import type { EpiAddCasesToEventDialogOpenProps } from '../../../components/epi/EpiAddCasesToEventDialog';
import type { EpiBulkEditCaseDialogOpenProps } from '../../../components/epi/EpiBulkEditCaseDialog';
import type { EpiCaseInfoDialogOpenProps } from '../../../components/epi/EpiCaseInfoDialog';
import type { EpiContactDetailsDialogOpenProps } from '../../../components/epi/EpiContactDetailsDialog';
import type { EpiCreateEventDialogOpenProps } from '../../../components/epi/EpiCreateEventDialog';
import type { EpiRemoveCasesFromEventDialogOpenProps } from '../../../components/epi/EpiRemoveCasesFromEventDialog';
import type { EpiSequenceDownloadDialogOpenProps } from '../../../components/epi/EpiSequenceDownloadDialog';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';

type EpiEvent = {
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openSequenceDownloadDialog: EpiSequenceDownloadDialogOpenProps;
  openCaseInfoDialog: EpiCaseInfoDialogOpenProps;
  openCreateEventDialog: EpiCreateEventDialogOpenProps;
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openBulkEditCaseDialog: EpiBulkEditCaseDialogOpenProps;
  onEventCreated: void;
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
