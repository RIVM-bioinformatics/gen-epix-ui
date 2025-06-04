import type { ReactElement } from 'react';
import type {
  IndexRouteObject,
  NonIndexRouteObject,
} from 'react-router';

import type { Permission } from '../api';

export type UseLoaderData<T> = {
  data: T;
};

export type MyHandle = {
  root?: boolean;
  titleKey: string;
  subTitleKey?: string;
  icon?: ReactElement;
  hidden?: boolean;
  disabled?: boolean;
  requiredPermissions: Permission[];
  requiresUserProfile: boolean;
  requirePermissionForChildRoute?: boolean;
  category?: string;
};

export type MyIndexRouteObject = Omit<IndexRouteObject, 'handle'> & {
  handle?: MyHandle;
};

export type MyNonIndexRouteObject = Omit<
  NonIndexRouteObject,
  'handle' | 'children'
> & {
  handle?: MyHandle;
  children?: Array<MyNonIndexRouteObject | MyIndexRouteObject>;
};
