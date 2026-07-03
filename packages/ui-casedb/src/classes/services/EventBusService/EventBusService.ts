import type { EpiContactDetailsDialogOpenProps } from '@gen-epix/ui';
import {
  EventBusAbstract,
  HmrUtil,
} from '@gen-epix/ui';
import type { CaseDbCase } from '@gen-epix/api-casedb';

import type { AddCasesToEventDialogOpenProps } from '../../../components/ui/AddCasesToEventDialog';
import type { CaseInfoDialogOpenProps } from '../../../components/ui/CaseInfoDialog';
import type { CreateEventDialogOpenProps } from '../../../components/ui/CreateEventDialog';
import type { FindSimilarCasesDialogOpenProps } from '../../../components/ui/FindSimilarCasesDialog';
import type { RemoveCasesFromEventDialogOpenProps } from '../../../components/ui/RemoveCasesFromEventDialog';
import type { RemoveFindSimilarCasesResultDialogOpenProps } from '../../../components/ui/RemoveFindSimilarCasesResultDialog/RemoveFindSimilarCasesResultDialog';
import type { SequenceDownloadDialogOpenProps } from '../../../components/ui/SequenceDownloadDialog';

export type DownloadConfig = {
  disabled?: boolean;
  items: DownloadConfigItems[];
  zone: string;
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
