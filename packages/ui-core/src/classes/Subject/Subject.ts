type Subscription<TData> = (data: TData, previousData?: TData) => void;

export class Subject<TData> {
  public data: TData;
  private subscriptions: { callback: Subscription<TData> }[] = [];

  public constructor(initialData?: TData) {
    this.data = initialData;
  }

  public next(data: TData) {
    const previousData = this.data;
    this.data = data;
    this.subscriptions.forEach((subscription) => {
      subscription.callback(data, previousData);
    });
  }

  public subscribe(subscription: Subscription<TData>): () => void {
    const subscriptionEntry = { callback: subscription };
    this.subscriptions.push(subscriptionEntry);

    return () => {
      this.subscriptions = this.subscriptions.filter((entry) => entry !== subscriptionEntry);
    };
  }
}
