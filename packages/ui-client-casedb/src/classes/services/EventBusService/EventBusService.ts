import type { EpiContactDetailsDialogOpenProps } from '@gen-epix/ui-client-common/components/epi/EpiContactDetailsDialog';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { EventBusAbstract } from '@gen-epix/ui-core/classes/abstracts/EventBusAbstract';
import { HmrUtil } from '@gen-epix/ui-core/utils/HmrUtil';
import type { DialogAction } from '@gen-epix/ui-core-components/components/Dialog';

import type { AddCasesToEventDialogOpenProps } from '../../../components/ui/AddCasesToEventDialog';
import type { CaseInfoDialogOpenProps } from '../../../components/ui/CaseInfoDialog';
import type { CreateEventDialogOpenProps } from '../../../components/ui/CreateEventDialog';
import type { FindSimilarCasesDialogOpenProps } from '../../../components/ui/FindSimilarCasesDialog';
import type { RemoveCasesFromEventDialogOpenProps } from '../../../components/ui/RemoveCasesFromEventDialog';
import type { RemoveFindSimilarCasesResultDialogOpenProps } from '../../../components/ui/RemoveFindSimilarCasesResultDialog/RemoveFindSimilarCasesResultDialog';
import type { SequenceDownloadDialogOpenProps } from '../../../components/ui/SequenceDownloadDialog';

export type DownloadConfig = {
  disabled?: boolean;
  items: Array<DownloadConfigItem | DownloadConfigSection>;
  zone: string;
  zoneLabel: string;
};

export type DownloadConfigItem = {
  callback: () => void;
  disabled?: boolean;
  label: string;
};

export type DownloadConfigSection = {
  disabled?: boolean;
  items: DownloadConfigItem[];
  label: string;
};

export type FastaDownloadProps = {
  caseIds: string[];
  caseTypeId: string;
  geneticSequenceColId: string;
};

type EpiEvent = {
  onDownloadOptionsChanged: DownloadConfig;
  onDownloadOptionsRequested: void;
  onEventCreated: void;
  onFastaDownloadActionsChanged: DialogAction[];
  onFastaDownloadActionsRequested: FastaDownloadProps;
  onLinkLineListAndTree: void;
  openAddCasesToEventDialog: AddCasesToEventDialogOpenProps;
  openCaseInfoDialog: CaseInfoDialogOpenProps;
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openCreateEventDialog: CreateEventDialogOpenProps;
  openEditCases: CaseDbCase[];
  openFiltersMenu: void;
  openFindSimilarCasesDialog: FindSimilarCasesDialogOpenProps;
  openRemoveCasesFromEventDialog: RemoveCasesFromEventDialogOpenProps;
  openRemoveFindSimilarCasesResultDialog: RemoveFindSimilarCasesResultDialogOpenProps;
  openSequenceDownloadDialog: SequenceDownloadDialogOpenProps;
};

export class EventBusService extends EventBusAbstract<EpiEvent> {
  private static __instance: EventBusService;

  private constructor() {
    super();
  }

  public static getInstance(): EventBusService {
    EventBusService.__instance = HmrUtil.getHmrSingleton('eventBusService', EventBusService.__instance, () => new EventBusService());
    return EventBusService.__instance;
  }

}
