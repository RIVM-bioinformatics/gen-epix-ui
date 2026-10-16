import { container } from 'tsyringe';
import {
  useCallback,
  useEffect,
} from 'react';

import { BreadcrumbService } from '../../classes/services/BreadcrumbService';


export const useUpdateBreadcrumb = (position: string) => {
  const update = useCallback((title: string) => {
    container.resolve(BreadcrumbService).update(position, title);
  }, [position]);

  useEffect(() => {
    return () => {
      container.resolve(BreadcrumbService).remove(position);
    };
  }, [position]);

  return update;
};
