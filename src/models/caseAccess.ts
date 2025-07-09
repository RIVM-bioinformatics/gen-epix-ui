import type {
  OrganizationAccessCasePolicy,
  UserAccessCasePolicy,
} from '../api';

export type UserEffectiveRight = Omit<OrganizationAccessCasePolicy & UserAccessCasePolicy, 'id' | 'user_id' | 'is_active' | 'case_type_set_id'> & {
  readonly case_type_set_ids: string[];
  readonly uncategorized_case_type_ids: string[];
  readonly categorized_case_type_ids: string[];
  readonly read_case_type_col_set_ids: string[];
  readonly uncategorized_read_case_type_col_ids: string[];
  readonly categorized_read_case_type_col_ids: string[];
  readonly write_case_type_col_set_ids: string[];
  readonly uncategorized_write_case_type_col_ids: string[];
  readonly categorized_write_case_type_col_ids: string[];
};
