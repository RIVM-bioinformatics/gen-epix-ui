type Subscription<TData> = (data: TData, previousData?: TData) => void;

export class Subject<TData> {
  private subscriptions: Subscription<TData>[] = [];
  public data: TData;

  public constructor(initialData?: TData) {
    this.data = initialData;
  }

  public next(data: TData) {
    const previousData = this.data;
    this.data = data;
    this.subscriptions.forEach((subscription) => {
      subscription(data, previousData);
    });
  }

  public subscribe(subscription: Subscription<TData>): () => void {
    this.subscriptions.push(subscription);

    return () => {
      this.subscriptions = this.subscriptions.filter(x => x !== subscription);
    };
  }
}
