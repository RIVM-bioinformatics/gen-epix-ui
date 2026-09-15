import type { Subject } from '../../Subject';

export abstract class SubscribableAbstract<TSubjectData> {
  public get data(): TSubjectData {
    return this.subject.data;
  }
  protected readonly subject: Subject<TSubjectData>;

  protected constructor(subject: Subject<TSubjectData>) {
    this.subject = subject;
  }

  public next(data: TSubjectData): void {
    return this.subject.next(data);
  }

  public subscribe(callback: (data: TSubjectData, previousData?: TSubjectData) => void): () => void {
    return this.subject.subscribe(callback);
  }
}
