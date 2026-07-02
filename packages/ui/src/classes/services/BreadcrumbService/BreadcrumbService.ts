import omit from 'lodash/omit';
import set from 'lodash/set';

import { Subject } from '../../Subject';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { HmrUtil } from '../../../utils/HmrUtil';


type SubjectData = Record<string, string>;

export class BreadcrumbService extends SubscribableAbstract<SubjectData> {
  private static __instance: BreadcrumbService;

  private constructor() {
    super(new Subject<SubjectData>({}));
  }

  public static getInstance(): BreadcrumbService {
    BreadcrumbService.__instance = HmrUtil.getHmrSingleton('breadcrumbService', BreadcrumbService.__instance, () => new BreadcrumbService());
    return BreadcrumbService.__instance;
  }

  public remove(position: string): void {
    this.subject.next({ ...omit(this.subject, position) });
  }

  public update(position: string, title: string): void {
    this.subject.next({ ...set(this.subject.data, position, title) });
  }
}
