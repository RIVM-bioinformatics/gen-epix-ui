import type { Highlighting } from '../../../models/epi';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowManager } from '../WindowManager';

export class HighlightingManager extends SubscribableAbstract<Highlighting> {
  protected constructor() {
    super(new Subject({
      caseIds: [],
      origin: null,
    }));
  }

  public static get instance(): HighlightingManager {
    WindowManager.instance.window.managers.highlighting = WindowManager.instance.window.managers.highlighting || new HighlightingManager();
    return WindowManager.instance.window.managers.highlighting;
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
