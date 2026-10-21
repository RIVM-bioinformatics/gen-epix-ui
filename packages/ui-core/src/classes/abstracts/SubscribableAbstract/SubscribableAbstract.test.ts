import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Subject } from '../../Subject';

import { SubscribableAbstract } from './SubscribableAbstract';

class TestSubscribable extends SubscribableAbstract<number> {
  public constructor(subject: Subject<number>) {
    super(subject);
  }
}

describe('SubscribableAbstract', () => {
  it('exposes current data and forwards next values with the previous value', () => {
    const subscribable = new TestSubscribable(new Subject(1));
    const callback = vi.fn();

    subscribable.subscribe(callback);
    subscribable.next(2);

    expect(subscribable.data).toBe(2);
    expect(callback).toHaveBeenCalledWith(2, 1);
  });

  it('returns the subscription cleanup function', () => {
    const subscribable = new TestSubscribable(new Subject(1));
    const callback = vi.fn();
    const unsubscribe = subscribable.subscribe(callback);

    unsubscribe();
    subscribable.next(2);

    expect(callback).not.toHaveBeenCalled();
  });
});
