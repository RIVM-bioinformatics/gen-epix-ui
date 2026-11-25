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
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
  CaseDbDisease,
  CaseDbEtiologicalAgent,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';

import { CaseTypeInfoDialogContent } from './CaseTypeInfoDialogContent';

const CASE_TYPE_ID = 'case-type-1';
const CASE_TYPE_NAME = 'Case type one';
const DESCRIPTION = 'Some case type description';
const DISEASE_ID = 'disease-1';
const DISEASE_WITHOUT_ICD_ID = 'disease-2';
const ETIOLOGICAL_AGENT_ID = 'agent-1';
const STORAGE_NAME_POST_FIX = 'case-type-info-dialog-content';

const DISEASES: CaseDbDisease[] = [
  { icd_code: 'B05', id: DISEASE_ID, name: 'Measles' },
  { icd_code: null, id: DISEASE_WITHOUT_ICD_ID, name: 'Influenza' },
];

const ETIOLOGICAL_AGENTS: CaseDbEtiologicalAgent[] = [
  { id: ETIOLOGICAL_AGENT_ID, name: 'Measles virus', type: 'virus' },
];

const createCompleteCaseType = (overrides: Partial<CaseDbCompleteCaseType> = {}): CaseDbCompleteCaseType => {
  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols: {},
    description: DESCRIPTION,
    dims: {},
    disease_id: DISEASE_ID,
    etiological_agent_id: ETIOLOGICAL_AGENT_ID,
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: CASE_TYPE_NAME,
    ordered_col_ids: [],
    ordered_col_ids_by_dim: {},
    ordered_dim_ids: [],
    ref_cols: {},
    ref_dims: {},
    tree_algorithms: {},
    user_id: null,
    ...overrides,
  };
};

let store: StoreApi<DashboardStore>;

const createStore = (completeCaseType: CaseDbCompleteCaseType) => {
  store = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType,
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  store.setState({ globalAbortSignal: new AbortController().signal });
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/diseases', () => Response.json(DISEASES));
  mockApiRequest('GET', '/v1/etiological_agents', () => Response.json(ETIOLOGICAL_AGENTS));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([]));
};

describe('CaseTypeInfoDialogContent', () => {
  beforeEach(() => {
    registerHandlers();
  });

  afterEach(() => {
    store.getState().destroy();
    container.resolve(QueryClientService).queryClient.clear();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('renders the disease with ICD code, the etiological agent with type, the description and reports title and permalink', async () => {
    createStore(createCompleteCaseType());
    const onPermalinkChange = vi.fn();
    const onTitleChange = vi.fn();
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseTypeInfoDialogContent
          onPermalinkChange={onPermalinkChange}
          onTitleChange={onTitleChange}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByText('Measles (ICD Code: B05)', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Measles virus (virus)', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText(DESCRIPTION, { exact: true })).toBeInTheDocument();
    expect(onTitleChange).toHaveBeenCalledWith(CASE_TYPE_NAME);
    expect(onPermalinkChange).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`/cases/.+/${CASE_TYPE_ID}$`)));
  });

  it('renders a disease without ICD code by name only', async () => {
    createStore(createCompleteCaseType({ disease_id: DISEASE_WITHOUT_ICD_ID }));
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseTypeInfoDialogContent
          onPermalinkChange={vi.fn()}
          onTitleChange={vi.fn()}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByText('Influenza', { exact: true })).toBeInTheDocument();
  });

  it('renders not applicable for an empty disease id and an unknown etiological agent id', async () => {
    createStore(createCompleteCaseType({ disease_id: '', etiological_agent_id: 'unknown-agent' }));
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseTypeInfoDialogContent
          onPermalinkChange={vi.fn()}
          onTitleChange={vi.fn()}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByText('Not applicable').nth(0)).toBeInTheDocument();
    await expect.element(screen.getByText('Not applicable').nth(1)).toBeInTheDocument();
  });

  it('renders not applicable for an unknown disease id', async () => {
    createStore(createCompleteCaseType({ disease_id: 'unknown-disease', etiological_agent_id: null }));
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseTypeInfoDialogContent
          onPermalinkChange={vi.fn()}
          onTitleChange={vi.fn()}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByText('Not applicable').nth(0)).toBeInTheDocument();
    await expect.element(screen.getByText('Not applicable').nth(1)).toBeInTheDocument();
  });

  it('renders the default text when the case type has no description', async () => {
    createStore(createCompleteCaseType({ description: null }));
    const screen = await renderComponent(
      <DashboardStoreContext value={store}>
        <CaseTypeInfoDialogContent
          onPermalinkChange={vi.fn()}
          onTitleChange={vi.fn()}
        />
      </DashboardStoreContext>,
    );

    await expect.element(screen.getByText('No description available', { exact: true })).toBeInTheDocument();
  });
});
