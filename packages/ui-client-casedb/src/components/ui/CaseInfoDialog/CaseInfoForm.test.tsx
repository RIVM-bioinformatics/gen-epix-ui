import { container } from 'tsyringe';
import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
  CaseDbEtlStatus,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCaseRights,
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../../test/lib';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import { CASEDB_QUERY_KEY } from '../../../constants/query.constants';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';

import { CaseInfoForm } from './CaseInfoForm';

const CASE_ID = 'case-1';
const CASE_TYPE_ID = 'case-type-1';
const DATA_COLLECTION_ID = '3f8c1d2e-5a4b-4c6d-8e9f-0a1b2c3d4e5f';
const FORM_ID = 'case-info-form';
const STORAGE_NAME_POST_FIX = 'case-info-form';
const TEXT_COL_ID = 'col-text';
const ORGANIZATION_COL_ID = 'col-organization';
const TEXT_VALUE = 'Some text value';
const UPDATED_TEXT_VALUE = 'Updated text value';
const ORGANIZATION: CaseDbOrganization = { code: 'EXAMPLE', id: '9b1e2f3a-4c5d-4e6f-8a7b-1c2d3e4f5a6b', name: 'Example organization' };
const SAVE_SUCCESS_MESSAGE = 'Successfully saved case data.';
const SAVE_ERROR_MESSAGE = 'Could not save case data.';

type UploadRequestBody = {
  case_batch: {
    cases: { case: Pick<CaseDbCase, 'case_type_id' | 'content' | 'created_in_data_collection_id' | 'id'> }[];
  };
  case_type_id: string;
  on_exists: string;
};

let store: StoreApi<DashboardStore>;
let uploadBodies: UploadRequestBody[];
let uploadStatus: CaseDbEtlStatus;
let uploadFails: boolean;
let uploadGate: Promise<void> | undefined;

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: 'ref-dim-other' };
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-other': { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  };
  const textCol = { case_type_id: CASE_TYPE_ID, code: 'text', dim_id: dim.id, id: TEXT_COL_ID, label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const organizationCol = { case_type_id: CASE_TYPE_ID, code: 'organization', dim_id: dim.id, id: ORGANIZATION_COL_ID, label: 'Organization', rank: 2, ref_col_id: 'ref-col-organization' } as CaseDbCol;
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-organization': { code: 'organization', col_type: CaseDbColType.ORGANIZATION, ref_dim_id: 'ref-dim-other' },
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
  };
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: [textCol.id, organizationCol.id],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [textCol.id, organizationCol.id],
  };

  return {
    case_date_dim_id: null,
    case_type_access_abacs: { [DATA_COLLECTION_ID]: access },
    case_type_share_abacs: {},
    cols: { [organizationCol.id]: organizationCol, [textCol.id]: textCol },
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: [textCol.id, organizationCol.id],
    ordered_col_ids_by_dim: { [dim.id]: [textCol.id, organizationCol.id] },
    ordered_dim_ids: [dim.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

const createCase = (): CaseDbCase => {
  return {
    case_type_id: CASE_TYPE_ID,
    content: {
      [ORGANIZATION_COL_ID]: ORGANIZATION.id,
      [TEXT_COL_ID]: TEXT_VALUE,
    },
    created_in_data_collection_id: DATA_COLLECTION_ID,
    id: CASE_ID,
  };
};

const createRights = (): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_id: CASE_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    data_collection_ids: [DATA_COLLECTION_ID],
    is_full_access: true,
    read_col_ids: [TEXT_COL_ID, ORGANIZATION_COL_ID],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [],
    write_col_ids: [TEXT_COL_ID, ORGANIZATION_COL_ID],
  };
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(notification => notification.message);

const registerHandlers = () => {
  mockApiRequest('POST', '/v1/upload/cases', async (request) => {
    uploadBodies.push(await request.json() as UploadRequestBody);
    if (uploadGate) {
      await uploadGate;
    }
    if (uploadFails) {
      return Response.json({ cases: [] }, { status: 500 });
    }
    return Response.json({ cases: [], status: uploadStatus });
  });
  mockApiRequest('GET', '/v1/organizations', () => Response.json([ORGANIZATION]));
};

const renderForm = async ({
  onFinish = vi.fn<() => void>(),
  onIsSavingChange = vi.fn<(isSaving: boolean) => void>(),
}: {
  onFinish?: ReturnType<typeof vi.fn<() => void>>;
  onIsSavingChange?: ReturnType<typeof vi.fn<(isSaving: boolean) => void>>;
} = {}) => {
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <CaseInfoForm
        caseDbCase={createCase()}
        caseRights={createRights()}
        formId={FORM_ID}
        onFinish={onFinish}
        onIsSavingChange={onIsSavingChange}
      />
      <button
        form={FORM_ID}
        type={'submit'}
        {...TestIdUtil.createAttributes('CaseInfoForm-submitButton')}
      >
        {'Submit'}
      </button>
    </DashboardStoreContext>,
  );
  return { onFinish, onIsSavingChange, screen };
};

describe('CaseInfoForm', () => {
  beforeEach(() => {
    store = createDashboardStore({
      caseSetId: 'case-set-1',
      completeCaseType: createCompleteCaseType(),
      config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
      idSelectorCallback: (row: CaseDbCase) => row.id,
      storageNamePostFix: STORAGE_NAME_POST_FIX,
      storageVersion: 1,
    });
    store.setState({ globalAbortSignal: new AbortController().signal });
    container.resolve(QueryClientService).queryClient.setQueryData(
      container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.CASES_LAZY),
      [createCase()],
    );
    uploadBodies = [];
    uploadStatus = CaseDbEtlStatus.SUCCESS;
    uploadFails = false;
    uploadGate = undefined;
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows the current case content in the editable form', async () => {
    const { screen } = await renderForm();

    await expect.element(screen.getByRole('heading', { name: 'Content' })).toBeInTheDocument();
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(TEXT_VALUE);
  });

  it('saves the edited content and reports success', async () => {
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(TEXT_VALUE);
    await screen.getByRole('textbox', { name: 'Text' }).fill(UPDATED_TEXT_VALUE);
    await screen.getByTestId('CaseInfoForm-submitButton').click();

    await expect.poll(() => getNotificationMessages()).toContain(SAVE_SUCCESS_MESSAGE);
    expect(uploadBodies).toHaveLength(1);
    expect(uploadBodies[0].on_exists).toBe('UPDATE');
    expect(uploadBodies[0].case_type_id).toBe(CASE_TYPE_ID);
    expect(uploadBodies[0].case_batch.cases[0].case).toEqual({
      case_type_id: CASE_TYPE_ID,
      content: {
        [ORGANIZATION_COL_ID]: ORGANIZATION.id,
        [TEXT_COL_ID]: UPDATED_TEXT_VALUE,
      },
      created_in_data_collection_id: DATA_COLLECTION_ID,
      id: CASE_ID,
    });
    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
  });

  it.each([
    CaseDbEtlStatus.SKIPPED,
    CaseDbEtlStatus.SUCCESS,
    CaseDbEtlStatus.UPDATED,
  ])('treats an upload with status %s as saved', async (status) => {
    uploadStatus = status;
    const { screen } = await renderForm();

    await screen.getByTestId('CaseInfoForm-submitButton').click();

    await expect.poll(() => uploadBodies.length).toBe(1);
    await expect.poll(() => getNotificationMessages()).toContain(SAVE_SUCCESS_MESSAGE);
    expect(getNotificationMessages()).not.toContain(SAVE_ERROR_MESSAGE);
  });

  it('reports an error when the upload status is not accepted', async () => {
    uploadStatus = CaseDbEtlStatus.FAILED;
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await screen.getByTestId('CaseInfoForm-submitButton').click();

    await expect.poll(() => getNotificationMessages()).toContain(SAVE_ERROR_MESSAGE);
    expect(getNotificationMessages()).not.toContain(SAVE_SUCCESS_MESSAGE);
    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('reports an error when the upload request fails', async () => {
    uploadFails = true;
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await screen.getByTestId('CaseInfoForm-submitButton').click();

    await expect.poll(() => getNotificationMessages()).toContain(SAVE_ERROR_MESSAGE);
    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a saving spinner in place of the form while the upload is in progress', async () => {
    let releaseUpload: () => void = () => undefined;
    uploadGate = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    const { screen } = await renderForm();

    await screen.getByTestId('CaseInfoForm-submitButton').click();

    await expect.element(screen.getByText('Saving case data')).toBeInTheDocument();
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).not.toBeInTheDocument();

    releaseUpload();

    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toBeInTheDocument();
    await expect.poll(() => getNotificationMessages()).toContain(SAVE_SUCCESS_MESSAGE);
  });

  it('disables fields that are readable but not writable', async () => {
    const readOnlyRights = { ...createRights(), write_col_ids: [TEXT_COL_ID] };
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseInfoForm
          caseDbCase={createCase()}
          caseRights={readOnlyRights}
          formId={FORM_ID}
          onFinish={vi.fn<() => void>()}
          onIsSavingChange={vi.fn<(isSaving: boolean) => void>()}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toBeEnabled();
    await expect.element(screen.getByRole('combobox', { name: 'Organization' })).toBeDisabled();
  });
});
