import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseStats,
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
  CaseDbCaseTypeSetMember,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseTypeSetCategoryPurpose,
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import type { CaseDbConfig } from '../../models/config.models';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../test/fixtures/completeCaseType';

import { CasesPage } from './CasesPage';

const CASE_TYPES_PATH = '/v1/case_types';
const CASE_TYPE_SETS_PATH = '/v1/case_type_sets';
const CASE_TYPE_SET_MEMBERS_PATH = '/v1/case_type_set_members';
const CASE_TYPE_SET_CATEGORIES_PATH = '/v1/case_type_set_categories';
const CASE_TYPE_STATS_PATH = '/v1/retrieve/case_type_stats';
const CASE_IDS_BY_QUERY_PATH = '/v1/retrieve/case_ids_by_query';
const COMPLETE_CASE_TYPES_PATH = '/v1/complete_case_types';
const ROUTE_PATH = '/cases';
const URL = '/cases';
const TABLE_STORE_STORAGE_KEY = 'GENEPIX-TableStore-cases';
const CASE_TYPE_ONE_LINK = '/cases/case-type-one/case-type-1';
const EXCEL_ERROR_MESSAGE = 'Excel template could not be created';

const PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.RetrieveCaseTypeStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
];

const CASE_TYPE_TWO_NAME = 'Case type two';
const CASE_TYPE_THREE_NAME = 'Case type three';

const CASE_TYPES = [
  { code: 'case-type-code-one', id: COMPLETE_CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME },
  { code: 'case-type-code-two', id: 'case-type-2', name: CASE_TYPE_TWO_NAME },
  { code: 'case-type-code-three', id: 'case-type-3', name: CASE_TYPE_THREE_NAME },
];

const CASE_TYPE_STATS: CaseDbCaseStats[] = [
  {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    first_case_date: '2024-01-01',
    last_case_date: '2024-02-01',
    n_cases: 5,
    n_own_cases: 3,
  },
  {
    case_type_id: 'case-type-2',
    n_cases: 0,
  },
];

const CASE_TYPE_SET_CATEGORIES: CaseDbCaseTypeSetCategory[] = [
  { id: 'category-content', name: 'Pathogen', purpose: CaseDbCaseTypeSetCategoryPurpose.CONTENT, rank: 1 },
  { id: 'category-security', name: 'Access', purpose: CaseDbCaseTypeSetCategoryPurpose.SECURITY, rank: 2 },
];

const CASE_TYPE_SETS: CaseDbCaseTypeSet[] = [
  { case_type_set_category_id: 'category-content', id: 'set-alpha', name: 'Alpha', rank: 1 },
  { case_type_set_category_id: 'category-content', id: 'set-beta', name: 'Beta', rank: 2 },
  { case_type_set_category_id: 'category-security', id: 'set-secure', name: 'Secure set', rank: 1 },
];

const CASE_TYPE_SET_MEMBERS: CaseDbCaseTypeSetMember[] = [
  { case_type_id: COMPLETE_CASE_TYPE_ID, case_type_set_id: 'set-alpha', id: 'member-1' },
  { case_type_id: COMPLETE_CASE_TYPE_ID, case_type_set_id: 'set-alpha', id: 'member-2' },
  { case_type_id: COMPLETE_CASE_TYPE_ID, case_type_set_id: 'set-secure', id: 'member-3' },
  { case_type_id: COMPLETE_CASE_TYPE_ID, case_type_set_id: 'missing-set', id: 'member-4' },
  { case_type_id: 'case-type-2', case_type_set_id: 'set-beta', id: 'member-5' },
];

// Rows are sorted by name ascending by default: "Case type one", "Case type three", "Case type two".
const ROW_INDEX_CASE_TYPE_ONE = 0;
const ROW_INDEX_CASE_TYPE_TWO = 2;

const mockCasesPageApi = () => {
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json(CASE_TYPES));
  mockApiRequest('GET', CASE_TYPE_SETS_PATH, () => Response.json(CASE_TYPE_SETS));
  mockApiRequest('GET', CASE_TYPE_SET_MEMBERS_PATH, () => Response.json(CASE_TYPE_SET_MEMBERS));
  mockApiRequest('GET', CASE_TYPE_SET_CATEGORIES_PATH, () => Response.json(CASE_TYPE_SET_CATEGORIES));
  mockApiRequest('POST', CASE_TYPE_STATS_PATH, () => Response.json(CASE_TYPE_STATS));
  mockCompleteCaseTypeLoaderApi();
  mockApiRequest('POST', CASE_IDS_BY_QUERY_PATH, () => Response.json({ case_ids: [], is_max_results_exceeded: false }));
};

const renderPage = async () => {
  return renderRoutedPage(
    <CasesPage />, {
      path: ROUTE_PATH,
      permissions: PERMISSIONS as CommonDbApiPermission[],
      url: URL,
    },
  );
};

type Screen = Awaited<ReturnType<typeof renderPage>>;

const openRowActions = async (screen: Screen, rowIndex: number) => {
  await screen.getByRole('button', { name: 'Row actions' }).nth(rowIndex).click();
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

describe('CasesPage', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(TABLE_STORE_STORAGE_KEY);
  });

  it('shows a spinner while the data is loading', async () => {
    let releaseCaseTypes: () => void = () => undefined;
    const caseTypesReleased = new Promise<void>((resolve) => {
      releaseCaseTypes = resolve;
    });
    mockCasesPageApi();
    mockApiRequest('GET', CASE_TYPES_PATH, async () => {
      await caseTypesReleased;
      return Response.json(CASE_TYPES);
    });

    const screen = await renderPage();

    await expect.element(screen.getByRole('status')).toBeInTheDocument();

    releaseCaseTypes();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
  });

  it('shows an error when the case types cannot be loaded', async () => {
    mockCasesPageApi();
    mockApiRequest('GET', CASE_TYPES_PATH, () => new Response(null, { status: 500 }));

    const screen = await renderPage();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByText('Error message: Request failed with status code 500', { exact: false })).toBeInTheDocument();
  });

  it('shows an error when the case type statistics cannot be loaded', async () => {
    mockCasesPageApi();
    mockApiRequest('POST', CASE_TYPE_STATS_PATH, () => new Response(null, { status: 500 }));

    const screen = await renderPage();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
  });

  it('shows a message when there are no case types', async () => {
    mockCasesPageApi();
    mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([]));

    const screen = await renderPage();

    await expect.element(screen.getByText('No cases found')).toBeInTheDocument();
    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).not.toBeInTheDocument();
  });

  it('renders the case types with their categories and statistics', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText(CASE_TYPE_TWO_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText(CASE_TYPE_THREE_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText('Pathogen')).toBeInTheDocument();
    await expect.element(screen.getByText('Alpha')).toBeInTheDocument();
    await expect.element(screen.getByText('Own cases')).toBeInTheDocument();
  });

  it('does not show columns for security categories', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await expect.element(screen.getByText('Access')).not.toBeInTheDocument();
  });

  it('disables "Go to cases" for a case type without cases', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(CASE_TYPE_TWO_NAME)).toBeInTheDocument();
    await openRowActions(screen, ROW_INDEX_CASE_TYPE_TWO);

    await expect.element(screen.getByRole('menuitem', { name: 'Go to cases' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { name: 'Show case type information' })).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('navigates to the cases of a case type via the "Go to cases" menu item', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await openRowActions(screen, ROW_INDEX_CASE_TYPE_ONE);
    await screen.getByRole('menuitem', { name: 'Go to cases' }).click();

    await expect.poll(() => window.location.pathname).toBe(CASE_TYPE_ONE_LINK);
  });

  it('navigates to the cases of a case type when its row is clicked', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await screen.getByText(COMPLETE_CASE_TYPE_NAME).click();

    await expect.poll(() => window.location.pathname).toBe(CASE_TYPE_ONE_LINK);
  });

  it('navigates when a row is clicked with page events enabled', async () => {
    mockCasesPageApi();

    const screen = await renderPage();
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const originalEnablePageEvents = config.enablePageEvents;
    config.enablePageEvents = true;

    try {
      await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
      await screen.getByText(COMPLETE_CASE_TYPE_NAME).click();

      await expect.poll(() => window.location.pathname).toBe(CASE_TYPE_ONE_LINK);
    } finally {
      config.enablePageEvents = originalEnablePageEvents;
    }
  });

  it('opens the case type information dialog from the readable index cell', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await screen.getByRole('button', { name: `Open case type information for ${COMPLETE_CASE_TYPE_NAME}` }).click();

    await expect.element(screen.getByRole('heading', { name: new RegExp(`^${COMPLETE_CASE_TYPE_NAME}`) })).toBeInTheDocument();
  });

  it('opens the case type information dialog from the row actions menu', async () => {
    mockCasesPageApi();

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await openRowActions(screen, ROW_INDEX_CASE_TYPE_ONE);
    await screen.getByRole('menuitem', { name: 'Show case type information' }).click();

    await expect.element(screen.getByRole('heading', { name: new RegExp(`^${COMPLETE_CASE_TYPE_NAME}`) })).toBeInTheDocument();
  });

  it('downloads the Excel template without an error notification', async () => {
    mockCasesPageApi();
    let completeCaseTypeRequestCount = 0;
    mockApiRequest('GET', COMPLETE_CASE_TYPES_PATH, () => {
      completeCaseTypeRequestCount += 1;
      return Response.json(createCompleteCaseType());
    });

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await openRowActions(screen, ROW_INDEX_CASE_TYPE_ONE);
    await screen.getByRole('menuitem', { name: 'Download Excel template' }).click();

    await expect.poll(() => completeCaseTypeRequestCount).toBe(1);
    expect(getNotificationMessages()).not.toContain(EXCEL_ERROR_MESSAGE);
  });

  it('shows an error notification when the Excel template cannot be created', async () => {
    mockCasesPageApi();
    mockApiRequest('GET', COMPLETE_CASE_TYPES_PATH, () => new Response(null, { status: 500 }));

    const screen = await renderPage();

    await expect.element(screen.getByText(COMPLETE_CASE_TYPE_NAME)).toBeInTheDocument();
    await openRowActions(screen, ROW_INDEX_CASE_TYPE_ONE);
    await screen.getByRole('menuitem', { name: 'Download Excel template' }).click();

    await expect.poll(() => getNotificationMessages()).toContain(EXCEL_ERROR_MESSAGE);
  });
});
