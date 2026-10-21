import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Subject } from './Subject';

describe('Subject', () => {
  it('initializes data with the provided value or undefined', () => {
    expect(new Subject('initial').data).toBe('initial');
    expect(new Subject<number>().data).toBeUndefined();
  });

  it('updates data and notifies subscribers with current and previous values', () => {
    const subject = new Subject(1);
    const firstSubscription = vi.fn();
    const secondSubscription = vi.fn();

    subject.subscribe(firstSubscription);
    subject.subscribe(secondSubscription);
    subject.next(2);
    subject.next(3);

    expect(subject.data).toBe(3);
    expect(firstSubscription.mock.calls).toEqual([[2, 1], [3, 2]]);
    expect(secondSubscription.mock.calls).toEqual([[2, 1], [3, 2]]);
  });

  it('unsubscribes only the registration returned by that subscription', () => {
    const subject = new Subject('initial');
    const subscription = vi.fn();
    const unsubscribeFirst = subject.subscribe(subscription);
    const unsubscribeSecond = subject.subscribe(subscription);

    unsubscribeFirst();
    unsubscribeFirst();
    subject.next('after-first-unsubscribe');

    expect(subscription).toHaveBeenCalledTimes(1);
    expect(subscription).toHaveBeenLastCalledWith('after-first-unsubscribe', 'initial');

    unsubscribeSecond();
    subject.next('after-second-unsubscribe');

    expect(subscription).toHaveBeenCalledTimes(1);
    expect(subject.data).toBe('after-second-unsubscribe');
  });
});
