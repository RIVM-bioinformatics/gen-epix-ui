import type { Highlighting } from '../../../../../ui-casedb/src/models/epi';
import { HmrUtil } from '../../../../../ui/src/utils/HmrUtil';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';

export class EpiHighlightingManager extends SubscribableAbstract<Highlighting> {
  public static get instance(): EpiHighlightingManager {
    EpiHighlightingManager.__instance = HmrUtil.getHmrSingleton('epiHighlightingManager', EpiHighlightingManager.__instance, () => new EpiHighlightingManager());
    return EpiHighlightingManager.__instance;
  }

  private static __instance: EpiHighlightingManager;

  protected constructor() {
    super(new Subject({
      caseIds: [],
      origin: null,
    }));
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
