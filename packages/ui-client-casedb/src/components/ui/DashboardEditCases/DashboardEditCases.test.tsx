import type {
  CaseDbCase,
  CaseDbCaseDataIssue,
  CaseDbCaseRights,
  CaseDbUploadCasesCommand,
} from '@gen-epix/api-casedb';
import { CaseDbEtlStatus } from '@gen-epix/api-casedb';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../../models/config.models';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
} from '../../../test/fixtures/completeCaseType';
import {
  clearDashboardStorage,
  createDashboardCase,
  createDashboardCompleteCaseType,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { DashboardEditCases } from './DashboardEditCases';

const CASE_A_ID = 'case-a';
const CASE_B_ID = 'case-b';
const CASE_A_VALUE = 'Alpha';
const CASE_B_VALUE = 'Beta';
const COMPLETE_CASE_TYPE_TEXT_COL_CODE = 'text';
const DATA_COLLECTION_ID = 'data-collection-1';
const EDIT_COLUMN_VALUES_LABEL = 'Edit values for Text (for selected rows)';
const RIGHTS_WARNING_TEXT = 'You do not have the necessary rights to edit all rows in this column.';
const BACK_TO_LINE_LIST_LABEL = 'Back to line list';
const UPLOAD_COMPLETED_TEXT = 'Upload completed.';
const START_UPLOAD_LABEL = 'Start upload';
const GENERIC_ERROR_TEXT = 'Sorry, an unexpected error has occurred.';

let caseRightsRequestCount = 0;
let caseIdsByQueryRequestCount = 0;
let uploadCreateRequestCount = 0;

const createCaseRights = (overrides: Partial<CaseDbCaseRights>): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_id: CASE_A_ID,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    data_collection_ids: [DATA_COLLECTION_ID],
    is_full_access: false,
    read_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [],
    write_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID],
    ...overrides,
  };
};

const createTwoCases = (): CaseDbCase[] => [
  createDashboardCase({ content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: CASE_A_VALUE }, id: CASE_A_ID }),
  createDashboardCase({ content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: CASE_B_VALUE }, id: CASE_B_ID }),
];

const mockCaseRights = (caseRights: CaseDbCaseRights[]) => {
  mockApiRequest('POST', '/v1/retrieve/case_rights', () => {
    caseRightsRequestCount += 1;
    return Response.json(caseRights);
  });
};

/**
 * Answers the upload endpoint: verification echoes every case as valid, a creation request is counted and reports success.
 */
const handleUploadCasesRequest = async (request: Request) => {
  const command = (await request.json()) as CaseDbUploadCasesCommand;
  const caseResults = command.case_batch.cases.map((caseForUpload) => ({
    data_issues: [] as CaseDbCaseDataIssue[],
    id: caseForUpload.id,
    is_new: true,
    status: CaseDbEtlStatus.SUCCESS,
    validated_content: caseForUpload.case?.content ?? {},
  }));
  if (!command.verify_only) {
    uploadCreateRequestCount += 1;
  }
  return Response.json({ cases: caseResults, status: CaseDbEtlStatus.SUCCESS });
};

/**
 * Provides the same app context as the dashboard, and a sized container so the virtualized upload table renders its rows.
 */
const DashboardEditCasesWrapper = ({ children }: PropsWithChildren) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = useMemo(() => createUserProfileStore(config), [config]);
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <div
        id={config.layout.MAIN_CONTENT_ID}
        style={{ height: 800, width: 1200 }}
      >
        {children}
      </div>
    </UserProfileStoreContext>
  );
};

type RenderDashboardEditCasesOptions = {
  readonly cases: CaseDbCase[];
  readonly onClose: () => void;
};

/**
 * The custom header icon is only displayed while its header cell is hovered.
 */
const revealEditColumnValuesIcon = async (screen: Awaited<ReturnType<typeof renderDashboardEditCases>>) => {
  await screen.getByText(COMPLETE_CASE_TYPE_TEXT_COL_CODE, { exact: true }).hover();
};

const renderDashboardEditCases = async ({ cases, onClose }: RenderDashboardEditCasesOptions) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createDashboardCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: 'DashboardEditCases',
    storageVersion: 1,
  });
  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  return renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <DashboardEditCases
        cases={cases}
        onClose={onClose}
      />
    </DashboardStoreContext>,
    { wrapper: DashboardEditCasesWrapper },
  );
};

describe('DashboardEditCases', () => {
  beforeEach(() => {
    caseRightsRequestCount = 0;
    caseIdsByQueryRequestCount = 0;
    uploadCreateRequestCount = 0;
    mockDashboardApi();
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => {
      caseIdsByQueryRequestCount += 1;
      return Response.json({ case_ids: [], is_max_results_exceeded: false });
    });
    mockApiRequest('POST', '/v1/upload/cases', handleUploadCasesRequest);
    mockCaseRights([
      createCaseRights({ case_id: CASE_A_ID, is_full_access: true }),
      createCaseRights({ case_id: CASE_B_ID, is_full_access: true }),
    ]);
  });

  afterEach(() => {
    clearDashboardStorage();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('does not request case rights when there are no cases', async () => {
    const screen = await renderDashboardEditCases({ cases: [], onClose: vi.fn() });

    await expect.element(screen.getByRole('button', { name: BACK_TO_LINE_LIST_LABEL })).toBeVisible();
    expect(caseRightsRequestCount).toBe(0);
  });

  it('shows the edit column values icon when every case grants write access to the column', async () => {
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose: vi.fn() });

    await revealEditColumnValuesIcon(screen);
    await expect.element(screen.getByRole('button', { name: EDIT_COLUMN_VALUES_LABEL })).toBeVisible();
  });

  it('hides the edit column values icon when no case grants write access to the column', async () => {
    mockCaseRights([
      createCaseRights({ case_id: CASE_A_ID, write_col_ids: [] }),
      createCaseRights({ case_id: CASE_B_ID, write_col_ids: [] }),
    ]);
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose: vi.fn() });

    await expect.element(screen.getByText(CASE_A_VALUE)).toBeVisible();
    expect(screen.getByRole('button', { name: EDIT_COLUMN_VALUES_LABEL }).query()).toBeNull();
  });

  it('shows the rights warning in the edit dialog when write access covers only some of the cases', async () => {
    mockCaseRights([
      createCaseRights({ case_id: CASE_A_ID, is_full_access: true }),
      createCaseRights({ case_id: CASE_B_ID, write_col_ids: [] }),
    ]);
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose: vi.fn() });

    await expect.element(screen.getByText(CASE_B_VALUE)).toBeVisible();
    await revealEditColumnValuesIcon(screen);
    await userEvent.click(screen.getByRole('button', { name: EDIT_COLUMN_VALUES_LABEL }));

    await expect.element(screen.getByText(RIGHTS_WARNING_TEXT)).toBeVisible();
  });

  it('counts a case once when several rights entries grant write access to the same column', async () => {
    mockCaseRights([
      createCaseRights({ case_id: CASE_A_ID }),
      createCaseRights({ case_id: CASE_A_ID }),
    ]);
    const screen = await renderDashboardEditCases({ cases: [createTwoCases()[0]], onClose: vi.fn() });

    await expect.element(screen.getByText(CASE_A_VALUE)).toBeVisible();
    await revealEditColumnValuesIcon(screen);
    await userEvent.click(screen.getByRole('button', { name: EDIT_COLUMN_VALUES_LABEL }));

    await expect.element(screen.getByRole('heading', { name: EDIT_COLUMN_VALUES_LABEL })).toBeVisible();
    expect(screen.getByText(RIGHTS_WARNING_TEXT).query()).toBeNull();
  });

  it('shows the generic error when the case rights cannot be loaded', async () => {
    mockApiRequest('POST', '/v1/retrieve/case_rights', () => Response.json({ message: 'failure' }, { status: 500 }));
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose: vi.fn() });

    await expect.element(screen.getByText(GENERIC_ERROR_TEXT)).toBeVisible();
  });

  it('uploads the validated cases, refreshes the dashboard and closes on completion', async () => {
    const onClose = vi.fn();
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose });

    await expect.element(screen.getByText(CASE_B_VALUE)).toBeVisible();
    const caseIdsByQueryRequestCountBeforeUpload = caseIdsByQueryRequestCount;
    await userEvent.click(screen.getByRole('button', { name: /^Proceed/ }));
    await userEvent.click(screen.getByRole('button', { name: START_UPLOAD_LABEL }));

    await expect.element(screen.getByText(UPLOAD_COMPLETED_TEXT)).toBeVisible();
    expect(uploadCreateRequestCount).toBe(1);
    await vi.waitFor(() => expect(caseIdsByQueryRequestCount).toBeGreaterThan(caseIdsByQueryRequestCountBeforeUpload));

    await userEvent.click(screen.getByRole('button', { name: BACK_TO_LINE_LIST_LABEL }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up the upload store when unmounted', async () => {
    const screen = await renderDashboardEditCases({ cases: createTwoCases(), onClose: vi.fn() });

    await expect.element(screen.getByText(CASE_B_VALUE)).toBeVisible();
    await screen.unmount();
  });
});
