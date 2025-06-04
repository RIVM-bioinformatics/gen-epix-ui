import type { OptionBase } from './form';

export interface UseOptions<TValue> extends Loadable {
  options: OptionBase<TValue>[];
}

export interface UseMap<TValue> extends Loadable {
  map: Map<string, TValue>;
}

export interface UseNameFactory<TValue> extends Loadable {
  getName: (item: TValue) => string;
}

export interface Loadable {
  isLoading: boolean;
  error: unknown;
}
