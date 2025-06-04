import omit from 'lodash/omit';
import set from 'lodash/set';

import { Subject } from '../../Subject';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';


type SubjectData = Record<string, string>;

export class BreadcrumbManager extends SubscribableAbstract<SubjectData> {
  private static __instance: BreadcrumbManager;

  private constructor() {
    super(new Subject<SubjectData>({}));
  }

  public static get instance(): BreadcrumbManager {
    BreadcrumbManager.__instance = BreadcrumbManager.__instance || new BreadcrumbManager();
    return BreadcrumbManager.__instance;
  }

  public update(position: string, title: string): void {
    this.subject.next({ ...set(this.subject.data, position, title) });
  }

  public remove(position: string): void {
    this.subject.next({ ...omit(this.subject, position) });
  }
}
