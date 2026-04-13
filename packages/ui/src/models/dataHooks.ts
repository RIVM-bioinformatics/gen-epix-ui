import type { OptionBase } from './form';

export interface Loadable {
  error: unknown;
  isEnabled: boolean;
  isFetching: boolean;
  isLoading: boolean;
  isPending: boolean;
}

export interface UseMap<TValue> extends Loadable {
  map: Map<string, TValue>;
}

export interface UseNameFactory<TValue> extends Loadable {
  getName: (item: TValue) => string;
}

export interface UseOptions<TValue> extends Loadable {
  options: OptionBase<TValue>[];
}
