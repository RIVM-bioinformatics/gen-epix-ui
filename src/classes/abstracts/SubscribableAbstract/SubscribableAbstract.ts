import type { Subject } from '../../Subject';

export abstract class SubscribableAbstract<TSubjectData> {
  protected readonly subject: Subject<TSubjectData>;
  protected constructor(subject: Subject<TSubjectData>) {
    this.subject = subject;
  }

  public subscribe(callback: (data: TSubjectData, previousData?: TSubjectData) => void): () => void {
    return this.subject.subscribe(callback);
  }

  public get data(): TSubjectData {
    return this.subject.data;
  }

  public next(data: TSubjectData): void {
    return this.subject.next(data);
  }
}
