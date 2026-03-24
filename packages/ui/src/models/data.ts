export type ConvertType<T, K> = {
  [P in keyof T]: K;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export interface GenericData {
  id?: string;
}
