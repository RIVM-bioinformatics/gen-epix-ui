export type ConvertType<T, K> = {
  [P in keyof T]: K;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export interface GenericData {
  id?: string | null;
}

export type OmitWithMetaData<T, K extends keyof T = never> = Omit<T, 'created_at' | 'id' | 'modified_at' | 'modified_by' | 'updated_at' | K>;
