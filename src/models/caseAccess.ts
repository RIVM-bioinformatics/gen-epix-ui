import type {
  OrganizationAccessCasePolicy,
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '../api';

export type UserEffectiveRightCaseTypes = {
  readonly case_type_set_ids: string[];
  readonly uncategorized_case_type_ids: string[];
  readonly categorized_case_type_ids: string[];
};

export type UserEffectiveRight = Omit<OrganizationAccessCasePolicy & UserAccessCasePolicy, 'id' | 'user_id' | 'is_active' | 'case_type_set_id'> & UserEffectiveRightCaseTypes & {
  readonly read_case_type_col_set_ids: string[];
  readonly uncategorized_read_case_type_col_ids: string[];
  readonly categorized_read_case_type_col_ids: string[];
  readonly write_case_type_col_set_ids: string[];
  readonly uncategorized_write_case_type_col_ids: string[];
  readonly categorized_write_case_type_col_ids: string[];
  readonly effective_share_case_rights: Array<UserEffectiveRightCaseTypes & Pick<UserShareCasePolicy, 'add_case' | 'remove_case' | 'add_case_set' | 'remove_case_set' | 'from_data_collection_id'>>;
};
