import { useMemo } from 'react';

export const useArray = <T extends Array<unknown>>(items: T): T => {
  return useMemo(() => items, [items]);
};
