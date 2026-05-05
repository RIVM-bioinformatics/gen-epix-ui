import {
  useCallback,
  useEffect,
} from 'react';

import { BreadcrumbManager } from '../../classes/managers/BreadcrumbManager';


export const useUpdateBreadcrumb = (position: string) => {
  const update = useCallback((title: string) => {
    BreadcrumbManager.getInstance().update(position, title);
  }, [position]);

  useEffect(() => {
    return () => {
      BreadcrumbManager.getInstance().remove(position);
    };
  }, [position]);

  return update;
};
