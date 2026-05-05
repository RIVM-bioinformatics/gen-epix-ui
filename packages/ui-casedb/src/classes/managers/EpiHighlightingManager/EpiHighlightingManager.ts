import {
  HmrUtil,
  Subject,
  SubscribableAbstract,
} from '@gen-epix/ui';

import { userProfileStore } from '../../../stores/userProfileStore';
import type { Highlighting } from '../../../models/epi';

export class EpiHighlightingManager extends SubscribableAbstract<Highlighting> {
  private static __instance: EpiHighlightingManager;

  protected constructor() {
    super(new Subject({
      caseIds: [],
      origin: null,
    }));
  }

  public static getInstance(): EpiHighlightingManager {
    EpiHighlightingManager.__instance = HmrUtil.getHmrSingleton('epiHighlightingManager', EpiHighlightingManager.__instance, () => new EpiHighlightingManager());
    return EpiHighlightingManager.__instance;
  }

  public highlight(highlighting: Highlighting): void {
    if (userProfileStore.getState().epiDashboardGeneralSettings.isHighlightingEnabled) {
      this.subject.next(highlighting);
    }
  }

  public reset(): void {
    this.subject.next({
      caseIds: [],
      origin: null,
    });
  }
}
