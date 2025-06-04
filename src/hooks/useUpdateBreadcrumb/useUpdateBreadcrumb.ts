import {
  useCallback,
  useEffect,
} from 'react';

import { BreadcrumbManager } from '../../classes/managers/BreadcrumbManager';


export const useUpdateBreadcrumb = (position: string) => {
  const update = useCallback((title: string) => {
    BreadcrumbManager.instance.update(position, title);
  }, [position]);

  useEffect(() => {
    return () => {
      BreadcrumbManager.instance.remove(position);
    };
  }, [position]);

  return update;
};
