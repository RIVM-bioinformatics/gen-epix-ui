import { container } from 'tsyringe';
import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganizationContacts } from '@gen-epix/api-commondb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import { DataService } from '../../../classes/services/DataService';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';

import { CaseContent } from './CaseContent';

const CASE_TYPE_ID = 'case-type-1';
const DATA_COLLECTION_ID = 'data-collection-1';
const STORAGE_NAME_POST_FIX = 'case-content';
const TEXT_COL_ID = 'col-text';
const ORGANIZATION_COL_ID = 'col-organization';
const TEXT_VALUE = 'Some text value';
const ORGANIZATION: CaseDbOrganization = { code: 'EXAMPLE', id: 'organization-1', name: 'Example organization' };
const UNLOADED_ORGANIZATION_ID = 'organization-not-loaded';
const CONTACT_NAME = 'Alice';

const ORGANIZATION_CONTACTS: CommonDbOrganizationContacts = {
  contacts: [
    {
      email: 'alice@example.com',
      id: 'contact-1',
      name: CONTACT_NAME,
      phone: '+31 000 000 001',
      site_id: 'site-1',
    },
  ],
  organization: {
    code: ORGANIZATION.code,
    id: ORGANIZATION.id,
    name: ORGANIZATION.name,
  },
  sites: [
    {
      id: 'site-1',
      name: 'Site one',
      organization_id: ORGANIZATION.id,
    },
  ],
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
    data_collection_id: DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: [textCol.id, organizationCol.id],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [],
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

const createCase = (organizationId: string): CaseDbCase => {
  return {
    case_type_id: CASE_TYPE_ID,
    content: {
      [ORGANIZATION_COL_ID]: organizationId,
      [TEXT_COL_ID]: TEXT_VALUE,
    },
    created_in_data_collection_id: DATA_COLLECTION_ID,
    id: 'case-1',
  };
};

let store: StoreApi<DashboardStore>;

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/organizations', () => Response.json([ORGANIZATION]));
  mockApiRequest('POST', '/v1/retrieve/organization_contacts', () => Response.json(ORGANIZATION_CONTACTS));
};

const renderCaseContent = async (caseDbCase: CaseDbCase) => {
  return renderComponent(
    <DashboardStoreContext value={store}>
      <CaseContent caseDbCase={caseDbCase} />
    </DashboardStoreContext>,
  );
};

describe('CaseContent', () => {
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
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows an error message when the case could not be found', async () => {
    const screen = await renderCaseContent(undefined);

    await expect.element(screen.getByText('Content')).toBeInTheDocument();
    await expect.element(screen.getByText(/Error message: Case could not be found/)).toBeInTheDocument();
  });

  it('renders the column values and opens the contact details of a loaded organization', async () => {
    await container.resolve(DataService).loadOrganizations(new AbortController().signal);
    const screen = await renderCaseContent(createCase(ORGANIZATION.id));

    await expect.element(screen.getByText('Column')).toBeInTheDocument();
    await expect.element(screen.getByText('Value')).toBeInTheDocument();
    await expect.element(screen.getByText(TEXT_VALUE)).toBeInTheDocument();

    await screen.getByText(ORGANIZATION.name, { exact: true }).click();

    await expect.element(screen.getByText(`${ORGANIZATION.name} contact details`)).toBeVisible();
    await expect.element(screen.getByText(CONTACT_NAME)).toBeVisible();
  });

  it('renders the organization value without a link when the organization is not loaded', async () => {
    await container.resolve(DataService).loadOrganizations(new AbortController().signal);
    const screen = await renderCaseContent(createCase(UNLOADED_ORGANIZATION_ID));

    await expect.element(screen.getByText(TEXT_VALUE)).toBeInTheDocument();
    await expect.element(screen.getByText('Organization', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText(ORGANIZATION.name, { exact: true })).not.toBeInTheDocument();
  });

  it('renders plain text values for non-organization columns', async () => {
    const screen = await renderCaseContent(createCase(UNLOADED_ORGANIZATION_ID));

    await expect.element(screen.getByText('Text', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText(TEXT_VALUE, { exact: true })).toBeInTheDocument();
  });
});
