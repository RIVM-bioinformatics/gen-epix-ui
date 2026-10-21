import omit from 'lodash/omit';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { SubscribableAbstract } from '@gen-epix/ui-core/classes/abstracts/SubscribableAbstract';
import { singleton } from 'tsyringe';


type SubjectData = Record<string, string>;

@singleton()
export class BreadcrumbService extends SubscribableAbstract<SubjectData> {

  public constructor() {
    super(new Subject<SubjectData>({}));
  }

  public remove(position: string): void {
    this.subject.next({ ...omit(this.subject.data, position) });
  }

  public update(position: string, title: string): void {
    this.subject.next({ ...this.subject.data, [position]: title });
  }
}
