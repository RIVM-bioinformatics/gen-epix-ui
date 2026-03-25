import type { Highlighting } from '../../../models/epi';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowManager } from '../WindowManager';

export class EpiHighlightingManager extends SubscribableAbstract<Highlighting> {
  protected constructor() {
    super(new Subject({
      caseIds: [],
      origin: null,
    }));
  }

  public static get instance(): EpiHighlightingManager {
    WindowManager.instance.window.managers.epiHighlighting = WindowManager.instance.window.managers.epiHighlighting || new EpiHighlightingManager();
    return WindowManager.instance.window.managers.epiHighlighting;
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
