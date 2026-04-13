import type {
  OrganizationAccessCasePolicy,
  UserAccessCasePolicy,
  UserShareCasePolicy,
} from '@gen-epix/api-casedb';

export type UserEffectiveRight = {
  readonly categorized_read_col_ids: string[];
  readonly categorized_write_col_ids: string[];
  readonly effective_share_case_rights: Array<Pick<UserShareCasePolicy, 'add_case_set' | 'add_case' | 'from_data_collection_id' | 'remove_case_set' | 'remove_case'> & UserEffectiveRightCaseTypes>;
  readonly read_col_set_ids: string[];
  readonly uncategorized_read_col_ids: string[];
  readonly uncategorized_write_col_ids: string[];
  readonly write_col_set_ids: string[];
} & Omit<OrganizationAccessCasePolicy & UserAccessCasePolicy, 'case_type_set_id' | 'id' | 'is_active' | 'user_id'> & UserEffectiveRightCaseTypes;

export type UserEffectiveRightCaseTypes = {
  readonly case_type_set_ids: string[];
  readonly categorized_case_type_ids: string[];
  readonly uncategorized_case_type_ids: string[];
};
