export type ConvertType<T, K> = {
  [P in keyof T]: K;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export interface GenericData {
  id?: string;
}

export type OmitWithMetaData<T, K extends keyof T = never> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'modified_at' | 'modified_by' | K>;
