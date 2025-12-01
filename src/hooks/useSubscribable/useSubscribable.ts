import {
  useEffect,
  useState,
} from 'react';

import type { SubscribableAbstract } from '../../classes/abstracts/SubscribableAbstract';

type UseSubscribableKwArgs<TSubjectData> = {
  readonly select?: (data: TSubjectData) => TSubjectData;
  readonly callback?: (data: TSubjectData, prevData: TSubjectData) => void;
};

export const useSubscribable = <TSubjectData>(subscribable: SubscribableAbstract<TSubjectData>, kwArgs: UseSubscribableKwArgs<TSubjectData> = {}) => {
  const { select, callback } = kwArgs;

  const [data, setData] = useState<TSubjectData>(subscribable.data);
  useEffect(() => {
    const unsubscribe = subscribable.subscribe((x, prevX) => {
      const newData = select ? select(x) : x;
      setData(newData);
      if (callback) {
        callback(newData, prevX);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [subscribable, select, callback]);
  return data;
};
