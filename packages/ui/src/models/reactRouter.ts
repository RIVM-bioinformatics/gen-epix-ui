import type { ReactElement } from 'react';
import type {
  IndexRouteObject,
  NonIndexRouteObject,
} from 'react-router';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

export type MyHandle<TApiPermission = CommonDbApiPermission> = {
  category?: string;
  disabled?: boolean;
  hidden?: boolean;
  icon?: ReactElement;
  requiredPermissions: TApiPermission[];
  requirePermissionForChildRoute?: boolean;
  requiresUserProfile: boolean;
  root?: boolean;
  subTitle?: string;
  title: string;
};

export type MyIndexRouteObject<TApiPermission = CommonDbApiPermission> = {
  handle?: MyHandle<TApiPermission>;
} & Omit<IndexRouteObject, 'handle'>;

export type MyNonIndexRouteObject<TApiPermission = CommonDbApiPermission> = {
  children?: Array<MyIndexRouteObject<TApiPermission> | MyNonIndexRouteObject<TApiPermission>>;
  handle?: MyHandle<TApiPermission>;
} & Omit<
  NonIndexRouteObject,
  'children' | 'handle'
>;

export type UseLoaderData<T> = {
  data: T;
};
