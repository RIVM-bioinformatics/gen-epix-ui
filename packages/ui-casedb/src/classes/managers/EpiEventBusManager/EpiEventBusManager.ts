import type { EpiContactDetailsDialogOpenProps } from '@gen-epix/ui';
import {
  EventBusAbstract,
  HmrUtil,
} from '@gen-epix/ui';
import type { CaseDbCase } from '@gen-epix/api-casedb';

import type { EpiAddCasesToEventDialogOpenProps } from '../../../components/epi/EpiAddCasesToEventDialog';
import type { EpiCaseInfoDialogOpenProps } from '../../../components/epi/EpiCaseInfoDialog';
import type { EpiCreateEventDialogOpenProps } from '../../../components/epi/EpiCreateEventDialog';
import type { EpiFindSimilarCasesDialogOpenProps } from '../../../components/epi/EpiFindSimilarCasesDialog';
import type { EpiRemoveCasesFromEventDialogOpenProps } from '../../../components/epi/EpiRemoveCasesFromEventDialog';
import type { EpiRemoveFindSimilarCasesResultDialogOpenProps } from '../../../components/epi/EpiRemoveFindSimilarCasesResultDialog/EpiRemoveFindSimilarCasesResultDialog';
import type { EpiSequenceDownloadDialogOpenProps } from '../../../components/epi/EpiSequenceDownloadDialog';

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
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openCaseInfoDialog: EpiCaseInfoDialogOpenProps;
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openCreateEventDialog: EpiCreateEventDialogOpenProps;
  openEditCases: CaseDbCase[];
  openFiltersMenu: void;
  openFindSimilarCasesDialog: EpiFindSimilarCasesDialogOpenProps;
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openRemoveFindSimilarCasesResultDialog: EpiRemoveFindSimilarCasesResultDialogOpenProps;
  openSequenceDownloadDialog: EpiSequenceDownloadDialogOpenProps;
};

export class EpiEventBusManager extends EventBusAbstract<EpiEvent> {
  private static __instance: EpiEventBusManager;

  private constructor() {
    super();
  }

  public static getInstance(): EpiEventBusManager {
    EpiEventBusManager.__instance = HmrUtil.getHmrSingleton('epiEventBusManager', EpiEventBusManager.__instance, () => new EpiEventBusManager());
    return EpiEventBusManager.__instance;
  }

}
