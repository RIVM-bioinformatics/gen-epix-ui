import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  CaseDbColType,
  CaseDbConceptSetType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbOrganization,
} from '@gen-epix/api-casedb';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataService } from '../../../classes/services/DataService';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import type { CaseDbConfig } from '../../../models/config.models';
import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../models/case-db.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { DashboardContext } from './context/DashboardContext';
import type { DashboardContextValue } from './context/DashboardContext';
import { DashboardSearch } from './DashboardSearch';

const STORAGE_NAME_POST_FIX = 'DashboardSearch';
const SEARCH_PLACEHOLDER = 'Search listed cases';

const TEXT_COL_ID = COMPLETE_CASE_TYPE_TEXT_COL_ID;
const CONCEPT_COL_ID = 'col-concept';
const ORGANIZATION_COL_ID = 'col-organization';
const REF_COL_TEXT_ID = 'ref-col-text';
const REF_COL_CONCEPT_ID = 'ref-col-concept';
const REF_COL_ORGANIZATION_ID = 'ref-col-organization';
const CONCEPT_SET_ID = 'concept-set-1';
const COL_IDS = [TEXT_COL_ID, CONCEPT_COL_ID, ORGANIZATION_COL_ID];

const CONCEPT_SET: CaseDbConceptSet = {
  code: CONCEPT_SET_ID,
  id: CONCEPT_SET_ID,
  name: 'Concept set',
  type: CaseDbConceptSetType.NOMINAL,
};
const CONCEPTS: CaseDbConcept[] = [
  { code: 'FLU', concept_set_id: CONCEPT_SET_ID, id: 'concept-flu', name: 'Influenza' },
  { code: 'MEA', concept_set_id: CONCEPT_SET_ID, id: 'concept-measles', name: 'Measles' },
];
const ORGANIZATIONS: CaseDbOrganization[] = [
  { code: 'ORG1', id: 'organization-1', name: 'Example organization' },
  { code: 'ORG2', id: 'organization-2', name: 'Other clinic' },
];

// Case 3 has an empty value and case 4 has a content key without a matching column.
const CASES: CaseDbCase[] = [
  createDashboardCase({
    content: { [CONCEPT_COL_ID]: 'concept-flu', [ORGANIZATION_COL_ID]: 'organization-1', [TEXT_COL_ID]: 'Alpha' },
    id: 'case-1',
  }),
  createDashboardCase({
    content: { [CONCEPT_COL_ID]: 'concept-measles', [ORGANIZATION_COL_ID]: 'organization-2', [TEXT_COL_ID]: 'Alphabet' },
    id: 'case-2',
  }),
  createDashboardCase({
    content: { [TEXT_COL_ID]: null },
    id: 'case-3',
  }),
  createDashboardCase({
    content: { 'col-unknown': 'Gamma' },
    id: 'case-4',
  }),
];
const CASE_IDS = CASES.map((dashboardCase) => dashboardCase.id);

const createSearchCompleteCaseType = () => {
  const baseCompleteCaseType = createCompleteCaseType();
  const textCol = baseCompleteCaseType.cols[TEXT_COL_ID];
  const textRefCol = baseCompleteCaseType.ref_cols[REF_COL_TEXT_ID];
  const baseAccess = baseCompleteCaseType.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  return createCompleteCaseType({
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: { ...baseAccess, read_col_ids: COL_IDS },
    },
    cols: {
      [CONCEPT_COL_ID]: { ...textCol, code: 'concept', id: CONCEPT_COL_ID, label: 'Concept', rank: 2, ref_col_id: REF_COL_CONCEPT_ID },
      [ORGANIZATION_COL_ID]: { ...textCol, code: 'organization', id: ORGANIZATION_COL_ID, label: 'Organization', rank: 3, ref_col_id: REF_COL_ORGANIZATION_ID },
      [TEXT_COL_ID]: textCol,
    },
    ordered_col_ids: COL_IDS,
    ordered_col_ids_by_dim: { 'dim-other': COL_IDS },
    ref_cols: {
      [REF_COL_CONCEPT_ID]: { ...textRefCol, code: 'concept', col_type: CaseDbColType.NOMINAL, concept_set_id: CONCEPT_SET_ID },
      [REF_COL_ORGANIZATION_ID]: { ...textRefCol, code: 'organization', col_type: CaseDbColType.ORGANIZATION },
      [REF_COL_TEXT_ID]: textRefCol,
    },
  });
};

const createDashboardContextValue = (highlight: DashboardContextValue['highlight']): DashboardContextValue => ({
  highlight,
  highlightSubject: new Subject<Highlighting>(),
  lineListRangeSubject: new Subject<LineListRangeSubjectValue>(),
  linkedScrollSubject: new Subject<LinkedScrollSubjectValue>(),
  reset: vi.fn(),
});

const expectFocused = async (element: Element) => {
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(element);
  });
};

const getHtmlElement = (locator: { element: () => Element }) => locator.element() as HTMLElement;

let activeDashboardStore: ReturnType<typeof createDashboardStore> | undefined;

const renderSearch = async (highlight: DashboardContextValue['highlight']) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const dashboardStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createSearchCompleteCaseType(),
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;
  dashboardStore.setState({ globalAbortSignal: new AbortController().signal });
  await dashboardStore.getState().fetchData();

  const screen = await renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <DashboardContext value={createDashboardContextValue(highlight)}>
        <div style={{ height: 600, width: 800 }}>
          <DashboardSearch />
        </div>
      </DashboardContext>
    </DashboardStoreContext>,
  );
  return { dashboardStore, screen };
};

describe('DashboardSearch', () => {
  beforeEach(async () => {
    clearDashboardStorage();
    mockDashboardApi(createSearchCompleteCaseType());
    mockApiRequest('GET', '/v1/organizations', () => Response.json(ORGANIZATIONS));
    mockApiRequest('GET', '/v1/concept_sets', () => Response.json([CONCEPT_SET]));
    mockApiRequest('GET', '/v1/concepts', () => Response.json(CONCEPTS));
    mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: CASE_IDS, is_max_results_exceeded: false }));
    mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(CASES));

    const dataService = container.resolve(DataService);
    await dataService.loadOrganizations(new AbortController().signal);
    await dataService.loadConcepts(new AbortController().signal);
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('opens the search input and focuses it when the search button is clicked', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();

    await expect.element(screen.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeInTheDocument();
    await expectFocused(screen.getByPlaceholder(SEARCH_PLACEHOLDER).element());
  });

  it('shows the number of matching cases while typing', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alphabet');
    await expect.element(screen.getByRole('status')).toHaveTextContent('1 results');
  });

  it('finds cases by their mapped concept and organization values', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Influenza');
    await expect.element(screen.getByRole('status')).toHaveTextContent('1 results');

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('clinic');
    await expect.element(screen.getByRole('status')).toHaveTextContent('1 results');
  });

  it('shows no results for values without a known column', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Gamma');
    await expect.element(screen.getByRole('status')).toHaveTextContent('No results');
  });

  it('applies the selected search mode to the search text', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByTestId('DashboardSearch-SettingsButton').click();
    await screen.getByRole('menuitem', { exact: true, name: 'Exact match' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('1 results');

    await screen.getByTestId('DashboardSearch-SettingsButton').click();
    await screen.getByRole('menuitem', { exact: true, name: 'Ends with' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('1 results');

    await screen.getByTestId('DashboardSearch-SettingsButton').click();
    await screen.getByRole('menuitem', { exact: true, name: 'Starts with' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByTestId('DashboardSearch-SettingsButton').click();
    await screen.getByRole('menuitem', { exact: true, name: 'Fuzzy match' }).click();
    await vi.waitFor(() => {
      expect(screen.getByRole('status').element().textContent).toMatch(/results$/);
    });
  });

  it('highlights the first result on Enter and cycles through results with the next and previous buttons', async () => {
    const highlight = vi.fn();
    const { screen } = await renderSearch(highlight);
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByRole('status')).toHaveTextContent('1/2 results');
    await expectFocused(screen.getByTestId('DashboardSearch-NextButton').element());
    await vi.waitFor(() => {
      expect(highlight).toHaveBeenLastCalledWith({
        caseIds: ['case-1'],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
        scrollIntoView: true,
      });
    });

    await screen.getByTestId('DashboardSearch-NextButton').click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('2/2 results');
    await vi.waitFor(() => {
      expect(highlight).toHaveBeenLastCalledWith({
        caseIds: ['case-2'],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
        scrollIntoView: true,
      });
    });

    await screen.getByTestId('DashboardSearch-NextButton').click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('1/2 results');

    await screen.getByTestId('DashboardSearch-PreviousButton').click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('2/2 results');

    await screen.getByTestId('DashboardSearch-PreviousButton').click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('1/2 results');
  });

  it('does not highlight a result on Enter when there are no results', async () => {
    const highlight = vi.fn();
    const { screen } = await renderSearch(highlight);
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Gamma');
    await expect.element(screen.getByRole('status')).toHaveTextContent('No results');

    await userEvent.keyboard('{Enter}');

    await expect.element(screen.getByRole('status')).toHaveTextContent('No results');
    expect(highlight).not.toHaveBeenCalledWith(expect.objectContaining({ scrollIntoView: true }));
  });

  it('clears the results and the highlight when the search text is emptied', async () => {
    const highlight = vi.fn();
    const { screen } = await renderSearch(highlight);
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('');

    await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(highlight).toHaveBeenLastCalledWith({
        caseIds: [],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
      });
    });
  });

  it('closes the search with Escape and restores focus to the search button', async () => {
    const highlight = vi.fn();
    const { screen } = await renderSearch(highlight);
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeInTheDocument();
    await expect.element(screen.getByPlaceholder(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    await expectFocused(screen.getByRole('button', { exact: true, name: 'Search' }).element());
    await vi.waitFor(() => {
      expect(highlight).toHaveBeenLastCalledWith({
        caseIds: [],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
      });
    });
  });

  it('closes the search with the close button and restores focus to the search button', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByTestId('DashboardSearch-CloseButton').click();

    await expect.element(screen.getByPlaceholder(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    await expectFocused(screen.getByRole('button', { exact: true, name: 'Search' }).element());
  });

  it('moves focus between the search controls with the arrow keys', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    const previousButton = getHtmlElement(screen.getByTestId('DashboardSearch-PreviousButton'));
    const nextButton = getHtmlElement(screen.getByTestId('DashboardSearch-NextButton'));
    const settingsButton = getHtmlElement(screen.getByTestId('DashboardSearch-SettingsButton'));
    const closeButton = getHtmlElement(screen.getByTestId('DashboardSearch-CloseButton'));

    nextButton.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expectFocused(settingsButton);

    await userEvent.keyboard('{ArrowRight}');
    await expectFocused(closeButton);

    // The close button is the last control, so ArrowRight keeps the focus in place.
    await userEvent.keyboard('{ArrowRight}');
    await expectFocused(closeButton);

    await userEvent.keyboard('{ArrowLeft}');
    await expectFocused(settingsButton);

    await userEvent.keyboard('{ArrowLeft}');
    await expectFocused(nextButton);

    await userEvent.keyboard('{ArrowLeft}');
    await expectFocused(previousButton);

    // ArrowLeft from the previous button returns the focus to the search input.
    await userEvent.keyboard('{ArrowLeft}');
    await expectFocused(screen.getByPlaceholder(SEARCH_PLACEHOLDER).element());
  });

  it('closes the settings with Escape and keeps the search open', async () => {
    const { screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    await screen.getByTestId('DashboardSearch-SettingsButton').click();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Exact match' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Exact match' })).not.toBeInTheDocument();
    await expectFocused(getHtmlElement(screen.getByTestId('DashboardSearch-SettingsButton')));
    await expect.element(screen.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeInTheDocument();
  });

  it('clears the search when the list of cases changes', async () => {
    const { dashboardStore: store, screen } = await renderSearch(vi.fn());
    await screen.getByRole('button', { exact: true, name: 'Search' }).click();
    await screen.getByPlaceholder(SEARCH_PLACEHOLDER).fill('Alpha');
    await expect.element(screen.getByRole('status')).toHaveTextContent('2 results');

    store.getState().setBaseData([...CASES]);

    await expect.element(screen.getByPlaceholder(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Search' })).toBeInTheDocument();
  });
});
