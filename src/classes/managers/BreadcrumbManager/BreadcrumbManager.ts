import omit from 'lodash/omit';
import set from 'lodash/set';

import { Subject } from '../../Subject';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { WindowManager } from '../WindowManager';


type SubjectData = Record<string, string>;

export class BreadcrumbManager extends SubscribableAbstract<SubjectData> {
  private constructor() {
    super(new Subject<SubjectData>({}));
  }

  public static get instance(): BreadcrumbManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.breadcrumb = WindowManager.instance.window.managers.breadcrumb || new BreadcrumbManager();
    return WindowManager.instance.window.managers.breadcrumb;
  }

  public update(position: string, title: string): void {
    this.subject.next({ ...set(this.subject.data, position, title) });
  }

  public remove(position: string): void {
    this.subject.next({ ...omit(this.subject, position) });
  }
}
