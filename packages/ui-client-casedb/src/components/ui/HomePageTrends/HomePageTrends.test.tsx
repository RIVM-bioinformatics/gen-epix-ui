import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbCaseSet,
  CaseDbCaseStats,
  CaseDbCompleteCaseType,
  CaseDbRetrieveCaseTypeStatsRequestBody,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import { container } from 'tsyringe';

import { createCaseSet } from '../../../test/fixtures/caseSet';
import { createCompleteCaseType } from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

import { HomePageTrends } from './HomePageTrends';

const CASE_TYPE_ONE_ID = 'ct-1';
const CASE_TYPE_ONE_NAME = 'Case type one';
const CASE_TYPE_TWO_ID = 'ct-2';
const CASE_TYPE_TWO_NAME = 'Case type two';
const CASE_TYPE_THREE_ID = 'ct-3';
const CASE_TYPE_THREE_NAME = 'Case type three';
const STATS_PATH = '/v1/retrieve/case_type_stats';
const CASE_TYPES_PATH = '/v1/case_types';
const CASE_SETS_PATH = '/v1/case_sets';
const CASE_SETS_QUERY_PATH = '/v1/case_sets/query';
const ERROR_TITLE = 'Sorry, an unexpected error has occurred.';

const ALL_REQUIRED_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RetrieveCaseTypeStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
  { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
];

let nowStats: CaseDbCaseStats[] = [];
let pastStats: CaseDbCaseStats[] = [];
let caseTypes: CaseDbCompleteCaseType[] = [];
let caseSetsNow: CaseDbCaseSet[] = [];
let caseSetsThen: CaseDbCaseSet[] = [];
let statsRequestBodies: CaseDbRetrieveCaseTypeStatsRequestBody[] = [];
let statsStatus: number | undefined;
let caseSetsStatus: number | undefined;
let nowStatsGate: Promise<void> | undefined;

const createCaseType = (id: string, name: string) => createCompleteCaseType({ id, name });

const createCaseSets = (count: number, idPrefix: string): CaseDbCaseSet[] => Array.from(
  { length: count },
  (_, index) => createCaseSet({ id: `${idPrefix}-${index + 1}` }),
);

const getCardElements = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('[data-testid="HomePageTrendCard"]'));

const getCardHeaders = (): string[] => getCardElements().map(card => card.querySelector('h3')?.textContent ?? '');

const findCard = (header: string): HTMLElement | undefined => getCardElements().find(card => card.querySelector('h3')?.textContent === header);

const getCardText = (card: HTMLElement | undefined, testId: string): null | string | undefined => card?.querySelector(`[data-testid="${testId}"]`)?.textContent;

const createRouterService = (paths: string[]) => new RouterService({
  adminRoutes: [],
  homePageComponent: () => <div />,
  routes: [
    { element: <div />, path: '/' },
    ...paths.map(path => ({ element: <div />, path })),
  ],
});

describe('HomePageTrends', () => {
  beforeEach(() => {
    nowStats = [];
    pastStats = [];
    caseTypes = [];
    caseSetsNow = [];
    caseSetsThen = [];
    statsRequestBodies = [];
    statsStatus = undefined;
    caseSetsStatus = undefined;
    nowStatsGate = undefined;
    // AuthorizationService is typed for common permissions only, while the case DB routes check case DB command names at runtime.
    container.resolve(AuthorizationService).apiPermissions = ALL_REQUIRED_PERMISSIONS as unknown as CommonDbApiPermission[];

    mockApiRequest('POST', STATS_PATH, async (request) => {
      const body = (await request.json()) as CaseDbRetrieveCaseTypeStatsRequestBody;
      statsRequestBodies.push(body);
      const isNowRequest = body.case_type_ids === undefined;
      if (isNowRequest && nowStatsGate) {
        await nowStatsGate;
      }
      if (statsStatus) {
        return new Response(null, { status: statsStatus });
      }
      return Response.json(isNowRequest ? nowStats : pastStats);
    });
    mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json(caseTypes));
    mockApiRequest('GET', CASE_SETS_PATH, () => {
      if (caseSetsStatus) {
        return new Response(null, { status: caseSetsStatus });
      }
      return Response.json(caseSetsNow);
    });
    mockApiRequest('POST', CASE_SETS_QUERY_PATH, () => Response.json(caseSetsThen));
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(AuthorizationService).apiPermissions = [];
  });

  it('renders the cases, events and per case type trends with their diffs', async () => {
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME), createCaseType(CASE_TYPE_TWO_ID, CASE_TYPE_TWO_NAME)];
    nowStats = [
      { case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 },
      { case_type_id: CASE_TYPE_TWO_ID, n_cases: 5 },
    ];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(2, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(getCardHeaders).toEqual(['Cases', 'Events', `${CASE_TYPE_ONE_NAME} cases`, `${CASE_TYPE_TWO_NAME} cases`]);

    const casesCard = findCard('Cases');
    expect(getCardText(casesCard, 'HomePageTrendCard-value')).toBe((15).toLocaleString());
    expect(getCardText(casesCard, 'HomePageTrendCard-diffPercentage')).toBe('+200%');
    expect(getCardText(casesCard, 'HomePageTrendCard-diffPercentage-label')).toContain('since last year');

    const eventsCard = findCard('Events');
    expect(getCardText(eventsCard, 'HomePageTrendCard-value')).toBe((2).toLocaleString());
    expect(getCardText(eventsCard, 'HomePageTrendCard-diffPercentage')).toBe('+100%');

    const caseTypeOneCard = findCard(`${CASE_TYPE_ONE_NAME} cases`);
    expect(getCardText(caseTypeOneCard, 'HomePageTrendCard-value')).toBe((10).toLocaleString());
    expect(getCardText(caseTypeOneCard, 'HomePageTrendCard-diffPercentage')).toBe('+100%');

    const caseTypeTwoCard = findCard(`${CASE_TYPE_TWO_NAME} cases`);
    expect(getCardText(caseTypeTwoCard, 'HomePageTrendCard-value')).toBe((5).toLocaleString());
    expect(getCardText(caseTypeTwoCard, 'HomePageTrendCard-diffPercentage')).toBeUndefined();
    expect(getCardText(caseTypeTwoCard, 'HomePageTrendCard-diffPercentage-label')).toBe('No change');

    await expect.element(screen.getByRole('button', { name: 'View more trends' })).toBeDisabled();
  });

  it('uses a base of one when there are no case sets or cases in the past', async () => {
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 0 }];
    caseSetsNow = createCaseSets(2, 'now');
    caseSetsThen = [];

    await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(getCardHeaders).toEqual(['Cases', 'Events', `${CASE_TYPE_ONE_NAME} cases`]);
    expect(getCardText(findCard('Cases'), 'HomePageTrendCard-diffPercentage')).toBe(`+${(1000).toLocaleString()}%`);
    expect(getCardText(findCard('Events'), 'HomePageTrendCard-diffPercentage')).toBe('+200%');
    expect(getCardText(findCard(`${CASE_TYPE_ONE_NAME} cases`), 'HomePageTrendCard-diffPercentage-label')).toBe('No change');
  });

  it('only requests past statistics for case types that have cases now', async () => {
    caseTypes = [
      createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME),
      createCaseType(CASE_TYPE_TWO_ID, CASE_TYPE_TWO_NAME),
      createCaseType(CASE_TYPE_THREE_ID, CASE_TYPE_THREE_NAME),
    ];
    nowStats = [
      { case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 },
      { case_type_id: CASE_TYPE_TWO_ID, n_cases: 5 },
      { case_type_id: CASE_TYPE_THREE_ID, n_cases: 0 },
    ];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(getCardHeaders).toEqual([
      'Cases',
      'Events',
      `${CASE_TYPE_ONE_NAME} cases`,
      `${CASE_TYPE_TWO_NAME} cases`,
      `${CASE_TYPE_THREE_NAME} cases`,
    ]);
    await expect.poll(() => statsRequestBodies.length).toBe(2);
    expect(statsRequestBodies[0]).toEqual({});
    expect(statsRequestBodies[1]?.case_type_ids).toEqual([CASE_TYPE_ONE_ID, CASE_TYPE_TWO_ID]);
    expect(statsRequestBodies[1]?.datetime_range_filter).toMatchObject({ type: 'DATETIME_RANGE', upper_bound_censor: '<=' });
  });

  it('skips per case type trends for case types that are unknown or have no name', async () => {
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME), createCaseType(CASE_TYPE_TWO_ID, '')];
    nowStats = [
      { case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 },
      { case_type_id: CASE_TYPE_THREE_ID, n_cases: 3 },
      { case_type_id: CASE_TYPE_TWO_ID, n_cases: 4 },
    ];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(getCardHeaders).toEqual(['Cases', 'Events', `${CASE_TYPE_ONE_NAME} cases`]);
  });

  it('shows at most six per case type trends, ordered by diff percentage', async () => {
    const caseTypeCount = 7;
    caseTypes = Array.from({ length: caseTypeCount }, (_, index) => createCaseType(`ct-${index + 1}`, `Type ${index + 1}`));
    nowStats = caseTypes.map((caseType, index) => ({ case_type_id: caseType.id ?? '', n_cases: index + 1 }));
    pastStats = caseTypes.map(caseType => ({ case_type_id: caseType.id ?? '', n_cases: 1 }));
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(getCardHeaders).toEqual([
      'Cases',
      'Events',
      'Type 7 cases',
      'Type 6 cases',
      'Type 5 cases',
      'Type 4 cases',
      'Type 3 cases',
      'Type 2 cases',
    ]);
  });

  it('shows the loading skeletons until the statistics are loaded', async () => {
    let releaseNowStats: () => void = () => undefined;
    nowStatsGate = new Promise<void>((resolve) => {
      releaseNowStats = () => resolve();
    });
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(() => document.querySelectorAll('.MuiSkeleton-root').length).toBe(8);
    expect(getCardHeaders()).toEqual([]);

    releaseNowStats();

    await expect.poll(getCardHeaders).toEqual(['Cases', 'Events', `${CASE_TYPE_ONE_NAME} cases`]);
  });

  it('shows that no trends are available when there are no current case type statistics', async () => {
    nowStats = [];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByText('No trends available.')).toBeInTheDocument();
    expect(getCardHeaders()).toEqual([]);
  });

  it('shows that no trends are available when there are no past case type statistics', async () => {
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByText('No trends available.')).toBeInTheDocument();
    expect(getCardHeaders()).toEqual([]);
  });

  it('renders nothing when the statistics request is forbidden', async () => {
    statsStatus = 403;
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(() => screen.getByText('Trends summary').elements().length).toBe(0);
  });

  it('renders nothing when the user lacks the required permissions', async () => {
    container.resolve(AuthorizationService).apiPermissions = [];

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.poll(() => screen.getByText('Trends summary').elements().length).toBe(0);
    expect(statsRequestBodies).toHaveLength(0);
  });

  it('shows an error when a required request fails', async () => {
    caseSetsStatus = 500;
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByText(ERROR_TITLE)).toBeVisible();
    expect(getCardHeaders()).toEqual([]);
  });

  it('navigates to the cases page when the cases trend is clicked', async () => {
    const routerService = createRouterService(['/cases']);
    container.registerInstance(RouterService, routerService);
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: 'View all cases' })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'View all cases' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/cases');
    await routerService.router.navigate('/');
  });

  it('navigates to the events page when the events trend is clicked', async () => {
    const routerService = createRouterService(['/events']);
    container.registerInstance(RouterService, routerService);
    caseTypes = [createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME)];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: 'View all events' })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'View all events' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/events');
    await routerService.router.navigate('/');
  });

  it('navigates to the case type page when a per case type trend is clicked', async () => {
    const caseType = createCaseType(CASE_TYPE_ONE_ID, CASE_TYPE_ONE_NAME);
    const caseTypePath = CaseTypeUtil.createCaseTypeLink(caseType);
    const routerService = createRouterService([caseTypePath]);
    container.registerInstance(RouterService, routerService);
    caseTypes = [caseType];
    nowStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 10 }];
    pastStats = [{ case_type_id: CASE_TYPE_ONE_ID, n_cases: 5 }];
    caseSetsNow = createCaseSets(1, 'now');
    caseSetsThen = createCaseSets(1, 'then');

    const screen = await renderComponent(
      <HomePageTrends />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: 'View cases' })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'View cases' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe(caseTypePath);
    await routerService.router.navigate('/');
  });
});
