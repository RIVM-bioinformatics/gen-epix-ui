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
import { createRef } from 'react';
import {
  CaseDbColType,
  CaseDbDimType,
  CaseDbEtlStatus,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCaseDataCollectionLink,
  CaseDbCaseRights,
  CaseDbCaseSetCategory,
  CaseDbCaseSetStatus,
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationContacts } from '@gen-epix/api-commondb';
import { FeatureFlagsService } from '@gen-epix/ui-client-common/classes/services/FeatureFlagsService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TableStoreContextProvider } from '@gen-epix/ui-client-common/stores/tableStore';

import {
  mockUploadCasesJobRequest,
  renderComponent,
} from '../../../test/lib';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { CASE_INFO_DIALOG_TAB_NAME } from '../../../models/case-db.models';

import { CaseInfoDialog } from './CaseInfoDialog';
import type { CaseInfoDialogRefMethods } from './CaseInfoDialog';

const CASE_ID = 'case-1';
const CASE_TYPE_ID = 'case-type-1';
const CASE_SET_CATEGORY_ID = 'category-1';
const CASE_SET_STATUS_ID = 'status-1';
const DATA_COLLECTION_ID_1 = '3f8c1d2e-5a4b-4c6d-8e9f-0a1b2c3d4e5f';
const DATA_COLLECTION_ID_2 = '7a1b2c3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d';
const STORAGE_NAME_POST_FIX = 'case-info-dialog';
const TEXT_COL_ID = 'col-text';
const ORGANIZATION_COL_ID = 'col-organization';
const TEXT_VALUE = 'Some text value';
const ORGANIZATION: CaseDbOrganization = { code: 'EXAMPLE', id: 'organization-1', name: 'Example organization' };
const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: CASE_SET_CATEGORY_ID, name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: CASE_SET_STATUS_ID, name: 'Open', rank: 1 };
const DATA_COLLECTION_1: CaseDbDataCollection = { id: DATA_COLLECTION_ID_1, name: 'Data collection one' };
const DATA_COLLECTION_2: CaseDbDataCollection = { id: DATA_COLLECTION_ID_2, name: 'Data collection two' };
const ORGANIZATION_CONTACTS: CommonDbOrganizationContacts = {
  contacts: [],
  organization: { code: ORGANIZATION.code, id: ORGANIZATION.id, name: ORGANIZATION.name },
  sites: [],
};

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
    data_collection_id: DATA_COLLECTION_ID_1,
    is_private: false,
    read_case_set: false,
    read_col_ids: [textCol.id, organizationCol.id],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [textCol.id],
  };

  return {
    case_date_dim_id: null,
    case_type_access_abacs: { [DATA_COLLECTION_ID_1]: access },
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
    created_in_data_collection_id: DATA_COLLECTION_ID_1,
    id: CASE_ID,
  };
};

const createRights = (overrides: Partial<CaseDbCaseRights> = {}): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_id: CASE_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID_1,
    data_collection_ids: [DATA_COLLECTION_ID_1],
    is_full_access: false,
    read_col_ids: [],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_ID_1],
    write_col_ids: [],
    ...overrides,
  };
};

const createLink = (dataCollectionId: string): CaseDbCaseDataCollectionLink => {
  return {
    case_id: CASE_ID,
    data_collection_id: dataCollectionId,
    id: `link-${dataCollectionId}`,
  };
};

let store: StoreApi<DashboardStore>;
let caseRights: CaseDbCaseRights[] = [];
let caseLinks: CaseDbCaseDataCollectionLink[] = [];
let caseLoadFails = false;
let deleteFails = false;
let deleteRequestCount = 0;
let uploadRequestCount = 0;
let caseIdsQueryGate: Promise<void> | undefined;

const registerHandlers = () => {
  mockApiRequest('GET', `/v1/cases/${CASE_ID}`, () => {
    if (caseLoadFails) {
      return Response.json({ message: 'failure' }, { status: 500 });
    }
    return Response.json(createCase());
  });
  mockApiRequest('DELETE', `/v1/cases/${CASE_ID}`, () => {
    deleteRequestCount += 1;
    if (deleteFails) {
      return Response.json({ message: 'failure' }, { status: 500 });
    }
    return new Response(null, { status: 204 });
  });
  mockUploadCasesJobRequest(() => {
    uploadRequestCount += 1;
    return Response.json({ cases: [], status: CaseDbEtlStatus.SUCCESS });
  });
  mockApiRequest('POST', '/v1/retrieve/case_rights', () => Response.json(caseRights));
  mockApiRequest('POST', '/v1/case_data_collection_links/query', () => Response.json(caseLinks));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION_1, DATA_COLLECTION_2]));
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', async () => {
    if (caseIdsQueryGate) {
      await caseIdsQueryGate;
    }
    return Response.json({ case_ids: [] });
  });
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
  mockApiRequest('GET', '/v1/organizations', () => Response.json([ORGANIZATION]));
  mockApiRequest('POST', '/v1/retrieve/organization_contacts', () => Response.json(ORGANIZATION_CONTACTS));
  mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/case_sets/query', () => Response.json([]));
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
};

const renderDialog = async ({
  initialTab,
  onClose = vi.fn<() => void>(),
}: {
  initialTab?: CASE_INFO_DIALOG_TAB_NAME;
  onClose?: ReturnType<typeof vi.fn<() => void>>;
} = {}) => {
  const ref = createRef<CaseInfoDialogRefMethods>();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <TableStoreContextProvider store={store}>
        <CaseInfoDialog
          onClose={onClose}
          ref={ref}
        />
      </TableStoreContextProvider>
    </DashboardStoreContext>,
  );
  ref.current?.open({ caseId: CASE_ID, caseTypeId: CASE_TYPE_ID, initialTab });
  return { onClose, screen };
};

describe('CaseInfoDialog', () => {
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
    container.resolve(FeatureFlagsService).featureFlags = {};
    caseRights = [createRights({ can_delete: true, is_full_access: true })];
    caseLinks = [createLink(DATA_COLLECTION_ID_1)];
    caseLoadFails = false;
    deleteFails = false;
    deleteRequestCount = 0;
    uploadRequestCount = 0;
    caseIdsQueryGate = undefined;
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(FeatureFlagsService).featureFlags = {};
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows the case information with all actions enabled for a user with full access', async () => {
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseInfoDialog-title')).toHaveTextContent('Case information');
    await expect.element(screen.getByText('Shared in')).toBeInTheDocument();
    await expect.element(screen.getByText('Read-only content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeEnabled();
  });

  it('disables all actions when the user has no rights to the case', async () => {
    caseRights = [];
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables editing through write column rights only', async () => {
    caseRights = [createRights({ write_col_ids: [TEXT_COL_ID] })];
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
  });

  it('enables sharing through removable data collection rights only', async () => {
    caseRights = [createRights({ remove_data_collection_ids: [DATA_COLLECTION_ID_1] })];
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables sharing through addable data collection rights only', async () => {
    caseRights = [createRights({ add_data_collection_ids: [DATA_COLLECTION_ID_2] })];
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables deleting through the can delete right only', async () => {
    caseRights = [createRights({ can_delete: true })];
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeDisabled();
  });

  it('opens the edit form, saves the case and returns to the case information', async () => {
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseInfoDialog-editCaseContentButton').click();
    await expect.element(screen.getByTestId('CaseInfoDialog-title')).toHaveTextContent('Case information - Edit');
    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).toBeEnabled();
    await screen.getByTestId('CaseInfoDialog-saveButton').click();

    await expect.poll(() => uploadRequestCount).toBe(1);
    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-title')).toHaveTextContent('Case information');
  });

  it('goes back to the case information from the edit form', async () => {
    const { screen } = await renderDialog({ initialTab: CASE_INFO_DIALOG_TAB_NAME.EDIT });

    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).toBeInTheDocument();
    await screen.getByTestId('CaseInfoDialog-goBackButton').click();

    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeInTheDocument();
    expect(uploadRequestCount).toBe(0);
  });

  it('shows a permission message instead of the edit form without edit rights', async () => {
    caseRights = [createRights({ is_full_access: false, shared_in_data_collection_ids: [] })];
    const { screen } = await renderDialog({ initialTab: CASE_INFO_DIALOG_TAB_NAME.EDIT });

    await expect.element(screen.getByText('You do not have permissions to edit this case.')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-goBackButton')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).not.toBeInTheDocument();
  });

  it('hides the edit form and disables editing when uploads are disabled by feature flag', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { disable_upload: true };
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseInfoDialog-editCaseContentButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeEnabled();
  });

  it('shows a permission message instead of the edit form when uploads are disabled by feature flag', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { disable_upload: true };
    const { screen } = await renderDialog({ initialTab: CASE_INFO_DIALOG_TAB_NAME.EDIT });

    await expect.element(screen.getByText('You do not have permissions to edit this case.')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).not.toBeInTheDocument();
  });

  it('opens the sharing form and returns to the case information with go back', async () => {
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseInfoDialog-editDataCollectionsButton').click();
    await expect.element(screen.getByTestId('CaseInfoDialog-title')).toHaveTextContent('Case information - Share');
    await expect.element(screen.getByRole('heading', { name: 'Data collections' })).toBeInTheDocument();
    await screen.getByTestId('CaseInfoDialog-goBackButton').click();

    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeInTheDocument();
  });

  it('saves the data collection changes and returns to the case information', async () => {
    const { screen } = await renderDialog({ initialTab: CASE_INFO_DIALOG_TAB_NAME.SHARING });

    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).toBeEnabled();
    await screen.getByTestId('CaseInfoDialog-saveButton').click();

    await expect.element(screen.getByTestId('CaseInfoDialog-editDataCollectionsButton')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-title')).toHaveTextContent('Case information');
  });

  it('shows a permission message instead of the sharing form without share rights', async () => {
    caseRights = [createRights({ is_full_access: false })];
    const { screen } = await renderDialog({ initialTab: CASE_INFO_DIALOG_TAB_NAME.SHARING });

    await expect.element(screen.getByText('You do not have permissions to share this case.')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-goBackButton')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseInfoDialog-saveButton')).not.toBeInTheDocument();
  });

  it('deletes the case after confirmation and closes the dialog', async () => {
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await expect.element(screen.getByText('Are you sure you want to delete the case?')).toBeInTheDocument();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(deleteRequestCount).toBe(1);
  });

  it('keeps the case when the delete confirmation is cancelled', async () => {
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-cancelButton').click();

    await expect.element(screen.getByTestId('Confirmation-confirmButton')).not.toBeInTheDocument();
    expect(deleteRequestCount).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes the dialog when deleting the case fails', async () => {
    deleteFails = true;
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(deleteRequestCount).toBe(1);
  });

  it('shows the refreshing spinner after the case is deleted until the data is refreshed', async () => {
    let releaseRefresh: () => void = () => undefined;
    caseIdsQueryGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.element(screen.getByText('Refreshing data')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    releaseRefresh();
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
  });

  it('shows an error message when the case cannot be loaded', async () => {
    caseLoadFails = true;
    const { screen } = await renderDialog();

    await expect.element(screen.getByText(/Error message:/)).toBeInTheDocument();
  });
});
