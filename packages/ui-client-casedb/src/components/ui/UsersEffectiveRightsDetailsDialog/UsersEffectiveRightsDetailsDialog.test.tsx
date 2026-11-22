import type {
  CaseDbCaseType,
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
  CaseDbCaseTypeSetMember,
  CaseDbCol,
  CaseDbColSet,
  CaseDbColSetMember,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbUser,
} from '@gen-epix/api-casedb';
import { createRef } from 'react';
import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import type { UserEffectiveRight } from '../../../models/case-access.models';
import { renderComponent } from '../../../test/lib';

import type {
  UsersEffectiveRightsDetailsDialogOpenProps,
  UsersEffectiveRightsDetailsDialogRefMethods,
} from './UsersEffectiveRightsDetailsDialog';
import { UsersEffectiveRightsDetailsDialog } from './UsersEffectiveRightsDetailsDialog';

const USER_NAME = 'User one';
const USER_DISPLAY_VALUE = `${USER_NAME} (user-one)`;

const createUser = (overrides: Partial<CaseDbUser> = {}): CaseDbUser => ({
  id: 'user-1',
  is_active: true,
  key: 'user-one',
  name: USER_NAME,
  organization_id: 'org-1',
  roles: [],
  ...overrides,
} as CaseDbUser);

const CASE_TYPE_ONE: CaseDbCaseType = { id: 'case-type-1', name: 'Case type one' } as CaseDbCaseType;
const CASE_TYPE_TWO: CaseDbCaseType = { id: 'case-type-2', name: 'Case type two' } as CaseDbCaseType;
const CASE_TYPE_SET_CATEGORY: CaseDbCaseTypeSetCategory = { id: 'cat-1', name: 'Category one' } as CaseDbCaseTypeSetCategory;
const CASE_TYPE_SET: CaseDbCaseTypeSet = { case_type_set_category_id: 'cat-1', id: 'cts-1', name: 'Set one' } as CaseDbCaseTypeSet;
const CASE_TYPE_SET_MEMBERS: CaseDbCaseTypeSetMember[] = [
  { case_type_id: 'case-type-1', case_type_set_id: 'cts-1', id: 'ctsm-1' } as CaseDbCaseTypeSetMember,
  { case_type_id: 'case-type-2', case_type_set_id: 'cts-1', id: 'ctsm-2' } as CaseDbCaseTypeSetMember,
  { case_type_id: 'unknown-set-member-case-type', case_type_set_id: 'cts-1', id: 'ctsm-3' } as CaseDbCaseTypeSetMember,
];
const DIM: CaseDbDim = { id: 'dim-1', label: 'Dimension one' } as CaseDbDim;
const COL_ONE: CaseDbCol = { case_type_id: 'case-type-1', dim_id: 'dim-1', id: 'col-1', label: 'Column one' } as CaseDbCol;
const COL_TWO: CaseDbCol = { case_type_id: 'case-type-2', dim_id: 'dim-1', id: 'col-2', label: 'Column two' } as CaseDbCol;
const COL_THREE: CaseDbCol = { case_type_id: 'case-type-1', dim_id: 'dim-1', id: 'col-3', label: 'Column three' } as CaseDbCol;
const COL_FOUR: CaseDbCol = { case_type_id: 'case-type-2', dim_id: 'dim-1', id: 'col-4', label: 'Column four' } as CaseDbCol;
const COL_SET_READ: CaseDbColSet = { id: 'cs-read', name: 'Read set' } as CaseDbColSet;
const COL_SET_WRITE: CaseDbColSet = { id: 'cs-write', name: 'Write set' } as CaseDbColSet;
const COL_SET_MEMBERS: CaseDbColSetMember[] = [
  { col_id: 'col-1', col_set_id: 'cs-read', id: 'csm-1' } as CaseDbColSetMember,
  { col_id: 'col-2', col_set_id: 'cs-write', id: 'csm-2' } as CaseDbColSetMember,
  { col_id: 'col-3', col_set_id: 'cs-read', id: 'csm-3' } as CaseDbColSetMember,
  { col_id: 'col-3', col_set_id: 'cs-write', id: 'csm-4' } as CaseDbColSetMember,
];
const DATA_COLLECTION_ONE: CaseDbDataCollection = { id: 'data-collection-1', name: 'Data collection one' } as CaseDbDataCollection;
const DATA_COLLECTION_TWO: CaseDbDataCollection = { id: 'data-collection-2', name: 'Data collection two' } as CaseDbDataCollection;

const mockDetailsApi = () => {
  mockApiRequest('GET', '/v1/case_type_set_members', () => Response.json(CASE_TYPE_SET_MEMBERS));
  mockApiRequest('GET', '/v1/case_type_sets', () => Response.json([CASE_TYPE_SET]));
  mockApiRequest('GET', '/v1/case_type_set_categories', () => Response.json([CASE_TYPE_SET_CATEGORY]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([CASE_TYPE_ONE, CASE_TYPE_TWO]));
  mockApiRequest('GET', '/v1/col_set_members', () => Response.json(COL_SET_MEMBERS));
  mockApiRequest('GET', '/v1/col_sets', () => Response.json([COL_SET_READ, COL_SET_WRITE]));
  mockApiRequest('GET', '/v1/cols', () => Response.json([COL_ONE, COL_TWO, COL_THREE, COL_FOUR]));
  mockApiRequest('GET', '/v1/dims', () => Response.json([DIM]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION_ONE, DATA_COLLECTION_TWO]));
};

const createUserEffectiveRight = (overrides: Partial<UserEffectiveRight> = {}): UserEffectiveRight => ({
  add_case: true,
  add_case_set: false,
  case_type_set_ids: ['cts-1', 'unknown-case-type-set'],
  categorized_case_type_ids: ['case-type-1'],
  categorized_read_col_ids: ['col-1'],
  categorized_write_col_ids: ['col-2'],
  data_collection_id: 'data-collection-1',
  effective_share_case_rights: [
    {
      add_case: true,
      add_case_set: false,
      case_type_set_ids: ['cts-1'],
      categorized_case_type_ids: ['case-type-1'],
      from_data_collection_id: 'data-collection-1',
      remove_case: false,
      remove_case_set: true,
      uncategorized_case_type_ids: [],
    },
    {
      add_case: false,
      add_case_set: false,
      case_type_set_ids: [],
      categorized_case_type_ids: [],
      from_data_collection_id: 'unknown-data-collection',
      remove_case: false,
      remove_case_set: false,
      uncategorized_case_type_ids: ['case-type-2'],
    },
    {
      add_case: false,
      add_case_set: false,
      case_type_set_ids: [],
      categorized_case_type_ids: [],
      from_data_collection_id: 'data-collection-2',
      remove_case: false,
      remove_case_set: false,
      uncategorized_case_type_ids: [],
    },
  ],
  is_private: false,
  read_case_set: true,
  read_col_set_ids: ['cs-read', 'unknown-col-set'],
  remove_case: false,
  remove_case_set: true,
  uncategorized_case_type_ids: ['case-type-2', 'unknown-case-type'],
  uncategorized_read_col_ids: ['col-2'],
  uncategorized_write_col_ids: ['col-1'],
  write_case_set: false,
  write_col_set_ids: ['cs-write'],
  ...overrides,
} as UserEffectiveRight);

const createEmptyUserEffectiveRight = (): UserEffectiveRight => createUserEffectiveRight({
  case_type_set_ids: [],
  categorized_case_type_ids: [],
  categorized_read_col_ids: [],
  categorized_write_col_ids: [],
  effective_share_case_rights: [],
  read_col_set_ids: [],
  uncategorized_case_type_ids: [],
  uncategorized_read_col_ids: [],
  uncategorized_write_col_ids: [],
  write_col_set_ids: [],
});

const renderDetailsDialog = async (
  userEffectiveRight: UserEffectiveRight = createUserEffectiveRight(),
  type: UsersEffectiveRightsDetailsDialogOpenProps['type'] = 'caseTypeSets',
) => {
  mockDetailsApi();
  const ref = createRef<UsersEffectiveRightsDetailsDialogRefMethods>();
  const screen = await renderComponent(<UsersEffectiveRightsDetailsDialog ref={ref} />);
  ref.current?.open({ type, user: createUser(), userEffectiveRight });
  return screen;
};

// Uncovered branches (not reachable without an unknown id or a value the types forbid):
// - `caseTypeA?.name ?? ''` (case type name is typed required): lines ~192, ~537
// - `colMapQuery.map.get(id)` fallbacks `?? id` / `?? caseTypeId` for unknown col or case type ids,
//   which crash the col name factory first: lines ~277-278, ~333-334, ~340, ~369-370, ~393, ~422-423, ~429, ~586
// - `refCol && ...` and its `??` fallback after `refCol.id` is already dereferenced: lines ~300, ~386
describe('UsersEffectiveRightsDetailsDialog', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the title with the user and data collection names', async () => {
    const screen = await renderDetailsDialog();

    await expect.element(screen.getByRole('heading', { name: `${USER_DISPLAY_VALUE} effective rights details for Data collection one` })).toBeInTheDocument();
  });

  it('falls back to the data collection id in the title when it is unknown', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight({ data_collection_id: 'unknown-data-collection' }));

    await expect.element(screen.getByRole('heading', { name: `${USER_DISPLAY_VALUE} effective rights details for unknown-data-collection` })).toBeInTheDocument();
  });

  it('opens the tab matching the requested type', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight(), 'readColSets');

    await expect.element(screen.getByRole('tab', { name: 'Read columns', selected: true })).toBeInTheDocument();
  });

  it('shows case type sets whose members and uncategorized case types toggle on click', async () => {
    const screen = await renderDetailsDialog();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('link', { name: 'Category one | Set one' })).toBeInTheDocument();
    await expect.element(panel.getByRole('link', { name: 'unknown-case-type-set' })).toBeInTheDocument();
    await expect.element(panel.getByText('Case type one', { exact: true })).not.toBeVisible();

    await panel.getByRole('link', { name: 'Category one | Set one' }).click();
    await expect.element(panel.getByText('Case type one', { exact: true })).toBeVisible();

    await panel.getByRole('link', { name: 'Category one | Set one' }).click();
    await expect.element(panel.getByText('Case type one', { exact: true })).not.toBeVisible();

    await expect.element(panel.getByText('unknown-case-type', { exact: true })).not.toBeVisible();
    await panel.getByRole('link', { name: 'Uncategorized case types' }).click();
    await expect.element(panel.getByText('unknown-case-type', { exact: true })).toBeVisible();
  });

  it('shows the empty states on every tab when nothing is assigned', async () => {
    const screen = await renderDetailsDialog(createEmptyUserEffectiveRight());

    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('No case types assigned');

    await screen.getByRole('tab', { name: 'Read columns' }).click();
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('No read columns assigned');

    await screen.getByRole('tab', { name: 'Write columns' }).click();
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('No write columns assigned');

    await screen.getByRole('tab', { name: 'Additional rights' }).click();
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('No additional rights assigned');
  });

  it('shows read column sets and uncategorized read columns that toggle on click', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight(), 'readColSets');
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('link', { name: 'Read set' })).toBeInTheDocument();
    await expect.element(panel.getByRole('link', { name: 'unknown-col-set' })).toBeInTheDocument();
    await expect.element(panel.getByText('Case type one -> Dimension one -> Column one', { exact: true })).not.toBeVisible();

    await panel.getByRole('link', { name: 'Read set' }).click();
    await expect.element(panel.getByText('Case type one -> Dimension one -> Column one', { exact: true })).toBeVisible();

    await panel.getByRole('link', { name: 'Read set' }).click();
    await expect.element(panel.getByText('Case type one -> Dimension one -> Column one', { exact: true })).not.toBeVisible();

    await expect.element(panel.getByText('Case type two -> Dimension one -> Column two', { exact: true })).not.toBeVisible();
    await panel.getByRole('link', { name: 'Uncategorized read columns sets' }).click();
    await expect.element(panel.getByText('Case type two -> Dimension one -> Column two', { exact: true })).toBeVisible();
  });

  it('shows write column sets and uncategorized write columns that toggle on click', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight(), 'writeColSets');
    const panel = screen.getByRole('tabpanel');

    await expect.element(screen.getByRole('tab', { name: 'Write columns', selected: true })).toBeInTheDocument();
    await expect.element(panel.getByRole('link', { name: 'Write set' })).toBeInTheDocument();
    await expect.element(panel.getByText('Case type two -> Dimension one -> Column two', { exact: true })).not.toBeVisible();

    await panel.getByRole('link', { name: 'Write set' }).click();
    await expect.element(panel.getByText('Case type two -> Dimension one -> Column two', { exact: true })).toBeVisible();

    await panel.getByRole('link', { name: 'Uncategorized write columns sets' }).click();
    await expect.element(panel.getByText('Case type one -> Dimension one -> Column one', { exact: true })).toBeVisible();
  });

  it('shows the rights flags on the rights tab', async () => {
    const screen = await renderDetailsDialog();

    await screen.getByRole('tab', { name: 'Rights' }).click();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByText('Add case', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Remove case', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Add case set', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Remove case set', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Read case set', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Write case set', { exact: true })).toBeInTheDocument();
    await expect.element(panel.getByText('Private', { exact: true })).toBeInTheDocument();
  });

  it('shows additional rights per data collection with fallbacks and empty states', async () => {
    const screen = await renderDetailsDialog();

    await screen.getByRole('tab', { name: 'Additional rights' }).click();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('heading', { name: 'From: Data collection one' })).toBeInTheDocument();
    await expect.element(panel.getByRole('heading', { name: 'From: unknown-data-collection' })).toBeInTheDocument();
    await expect.element(panel.getByRole('heading', { name: 'From: Data collection two' })).toBeInTheDocument();
    await expect.element(panel.getByText('No case types assigned', { exact: true })).toBeInTheDocument();

    await expect.element(panel.getByRole('link', { name: 'Category one | Set one' })).toBeInTheDocument();
    await expect.element(panel.getByText('Case type one', { exact: true })).not.toBeVisible();
    await panel.getByRole('link', { name: 'Category one | Set one' }).click();
    await expect.element(panel.getByText('Case type one', { exact: true })).toBeVisible();

    await panel.getByRole('link', { name: 'Uncategorized case types' }).click();
    // 'Case type two' is also a member of 'Set one' above, so target the uncategorized entry (rendered last).
    await expect.element(panel.getByText('Case type two', { exact: true }).last()).toBeVisible();
  });

  it('sorts and shows multiple uncategorized read and write columns', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight({
      uncategorized_read_col_ids: ['col-4', 'col-2'],
      uncategorized_write_col_ids: ['col-3', 'col-1'],
    }), 'readColSets');
    const readPanel = screen.getByRole('tabpanel');

    await readPanel.getByRole('link', { name: 'Uncategorized read columns sets' }).click();
    await expect.element(readPanel.getByText('Case type two -> Dimension one -> Column two', { exact: true })).toBeVisible();
    await expect.element(readPanel.getByText('Case type two -> Dimension one -> Column four', { exact: true })).toBeVisible();

    await screen.getByRole('tab', { name: 'Write columns' }).click();
    const writePanel = screen.getByRole('tabpanel');

    await writePanel.getByRole('link', { name: 'Uncategorized write columns sets' }).click();
    await expect.element(writePanel.getByText('Case type one -> Dimension one -> Column one', { exact: true })).toBeVisible();
    await expect.element(writePanel.getByText('Case type one -> Dimension one -> Column three', { exact: true }).last()).toBeVisible();
  });

  it('shows every rights flag as Yes when all rights are granted', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight({
      add_case: true,
      add_case_set: true,
      is_private: true,
      read_case_set: true,
      remove_case: true,
      remove_case_set: true,
      write_case_set: true,
    }));

    await screen.getByRole('tab', { name: 'Rights' }).click();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('definition').nth(0)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(1)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(2)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(3)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(4)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(5)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(6)).toHaveTextContent('Yes');
  });

  it('shows every rights flag as No when no rights are granted', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight({
      add_case: false,
      add_case_set: false,
      is_private: false,
      read_case_set: false,
      remove_case: false,
      remove_case_set: false,
      write_case_set: false,
    }));

    await screen.getByRole('tab', { name: 'Rights' }).click();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('definition').nth(0)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(1)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(2)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(3)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(4)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(5)).toHaveTextContent('No');
    await expect.element(panel.getByRole('definition').nth(6)).toHaveTextContent('No');
  });

  it('sorts multiple uncategorized case types and shows Yes flags for an additional right', async () => {
    const screen = await renderDetailsDialog(createUserEffectiveRight({
      effective_share_case_rights: [
        {
          add_case: true,
          add_case_set: true,
          case_type_set_ids: ['cts-1', 'unknown-case-type-set'],
          categorized_case_type_ids: [],
          from_data_collection_id: 'data-collection-1',
          remove_case: true,
          remove_case_set: true,
          uncategorized_case_type_ids: ['unknown-case-type', 'case-type-1'],
        },
      ],
    }));

    await screen.getByRole('tab', { name: 'Additional rights' }).click();
    const panel = screen.getByRole('tabpanel');

    await expect.element(panel.getByRole('link', { name: 'unknown-case-type-set' })).toBeInTheDocument();
    await panel.getByRole('link', { name: 'Uncategorized case types' }).click();
    await expect.element(panel.getByText('unknown-case-type', { exact: true })).toBeVisible();
    await expect.element(panel.getByText('Case type one', { exact: true }).last()).toBeVisible();

    await expect.element(panel.getByRole('definition').nth(0)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(1)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(2)).toHaveTextContent('Yes');
    await expect.element(panel.getByRole('definition').nth(3)).toHaveTextContent('Yes');
  });
});
