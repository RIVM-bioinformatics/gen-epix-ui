import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Subject } from '../../classes/Subject';
import { SubscribableAbstract } from '../../classes/abstracts/SubscribableAbstract';

import { useSubscribable } from './useSubscribable';

class TestSubscribable extends SubscribableAbstract<number> {
  public constructor(subject: Subject<number>) {
    super(subject);
  }
}

describe('useSubscribable', () => {
  it('returns the current value and updates when the subject changes', () => {
    const subscribable = new TestSubscribable(new Subject(1));
    const { result } = renderHook(() => useSubscribable(subscribable));

    expect(result.current).toBe(1);

    act(() => {
      subscribable.next(2);
    });

    expect(result.current).toBe(2);
  });

  it('selects updated values before storing them', () => {
    const subscribable = new TestSubscribable(new Subject(2));
    const { result } = renderHook(() => useSubscribable(subscribable, {
      select: (value) => value * 10,
    }));

    expect(result.current).toBe(20);

    act(() => {
      subscribable.next(3);
    });

    expect(result.current).toBe(30);
  });

  it('calls the callback with the updated and previous values', () => {
    const subscribable = new TestSubscribable(new Subject(4));
    const callback = vi.fn();
    const { result } = renderHook(() => useSubscribable(subscribable, { callback }));

    act(() => {
      subscribable.next(5);
    });

    expect(result.current).toBe(5);
    expect(callback).toHaveBeenCalledWith(5, 4);
  });

  it('unsubscribes on unmount', () => {
    const subscribable = new TestSubscribable(new Subject(1));
    const callback = vi.fn();
    const { unmount } = renderHook(() => useSubscribable(subscribable, { callback }));

    unmount();

    act(() => {
      subscribable.next(2);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
