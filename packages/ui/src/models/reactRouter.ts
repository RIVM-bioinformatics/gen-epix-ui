import type { ReactElement } from 'react';
import type {
  IndexRouteObject,
  NonIndexRouteObject,
} from 'react-router';
import type { ApiPermission } from '@gen-epix/api-casedb';

export type MyHandle = {
  category?: string;
  disabled?: boolean;
  hidden?: boolean;
  icon?: ReactElement;
  requiredPermissions: ApiPermission[];
  requirePermissionForChildRoute?: boolean;
  requiresUserProfile: boolean;
  root?: boolean;
  subTitle?: string;
  title: string;
};

export type MyIndexRouteObject = {
  handle?: MyHandle;
} & Omit<IndexRouteObject, 'handle'>;

export type MyNonIndexRouteObject = {
  children?: Array<MyIndexRouteObject | MyNonIndexRouteObject>;
  handle?: MyHandle;
} & Omit<
  NonIndexRouteObject,
  'children' | 'handle'
>;

export type UseLoaderData<T> = {
  data: T;
};
