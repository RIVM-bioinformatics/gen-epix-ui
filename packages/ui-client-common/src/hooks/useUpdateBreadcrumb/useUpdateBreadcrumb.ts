import { container as rootContainer } from 'tsyringe';
import {
  useCallback,
  useEffect,
} from 'react';

import { BreadcrumbService } from '../../classes/services/BreadcrumbService';


export const useUpdateBreadcrumb = (position: string) => {
  const update = useCallback((title: string) => {
    rootContainer.resolve(BreadcrumbService).update(position, title);
  }, [position]);

  useEffect(() => {
    return () => {
      rootContainer.resolve(BreadcrumbService).remove(position);
    };
  }, [position]);

  return update;
};
