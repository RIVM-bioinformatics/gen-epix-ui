import {
  useCallback,
  useEffect,
} from 'react';

import { BreadcrumbService } from '../../classes/services/BreadcrumbService';


export const useUpdateBreadcrumb = (position: string) => {
  const update = useCallback((title: string) => {
    BreadcrumbService.getInstance().update(position, title);
  }, [position]);

  useEffect(() => {
    return () => {
      BreadcrumbService.getInstance().remove(position);
    };
  }, [position]);

  return update;
};
