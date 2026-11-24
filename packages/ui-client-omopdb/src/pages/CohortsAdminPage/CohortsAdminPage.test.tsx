import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbCohort,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { CohortsAdminPage } from './CohortsAdminPage';

type CohortFixture = { readonly id: string } & OmopDbCohort;

const COHORTS_PATH = '/v1/Cohorts';
const COHORT_DEFINITIONS_PATH = '/v1/CohortDefinitions';
const ROUTE_PATH = '/management/cohorts';
const URL = '/management/cohorts';

const COHORT_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.CohortCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.CohortCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.CohortCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const cohortAlphaFixture: CohortFixture = {
  cohort_definition_id: 'def-1',
  cohort_end_date: '2024-02-01',
  cohort_id: 'cohort-alpha',
  cohort_start_date: '2024-01-01',
  id: 'cohort-alpha',
  subject_id: 'Subject Alpha',
};

const cohortBetaFixture: CohortFixture = {
  cohort_definition_id: 'def-2',
  cohort_end_date: '2024-03-01',
  cohort_id: 'cohort-beta',
  cohort_start_date: '2024-02-01',
  id: 'cohort-beta',
  subject_id: 'Subject Beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `cohort_id`.
 * The page maps the created item to a table row by `cohort_id`, so the API response must include it.
 */
const mockCohortPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', COHORTS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbCohort>;
    postBodies.push(body);
    return Response.json({ ...body, cohort_id: 'created-cohort', id: 'created-cohort' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', COHORT_DEFINITIONS_PATH, () => Response.json([
    { cohort_definition_id: 'def-1', cohort_definition_name: 'Definition One' },
    { cohort_definition_id: 'def-2', cohort_definition_name: 'Definition Two' },
    { cohort_definition_id: 'def-unnamed' },
  ]));
};

const renderPage = async (initialItems: CohortFixture[] = [cohortAlphaFixture, cohortBetaFixture], permissions = COHORT_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(COHORTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CohortsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForItem = async (item: CohortFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

/**
 * Fills a date field group (Year, Month, Day spinbuttons) with the given ISO date.
 */
const fillDateField = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  const dateField = screen.getByRole('group', { name: label });
  await dateField.getByRole('spinbutton', { name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { name: 'Day' }).fill(day);
};

describe('CohortsAdminPage', () => {
  it('lists the cohorts with the cohort definition name and the subject', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Subject Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Subject Beta' })).toBeInTheDocument();
  });

  it('creates a cohort via the cohorts endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCohortPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new cohort', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Cohort Definition ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Definition Two' }).click();
    await screen.getByRole('textbox', { name: 'Subject ID' }).fill('Subject Gamma');
    await fillDateField(screen, 'Cohort Start Date', '2024-04-01');
    await fillDateField(screen, 'Cohort End Date', '2024-05-01');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cohort_definition_id: 'def-2', subject_id: 'Subject Gamma' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a cohort via the cohorts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Definition One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Subject ID' }).fill('Subject renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${COHORTS_PATH}/cohort-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ cohort_id: 'cohort-alpha', subject_id: 'Subject renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a cohort via the cohorts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${COHORTS_PATH}/cohort-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([cohortAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition One' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a cohort by the label of its known cohort definition', async () => {
    const screen = await openEditDialogForItem(cohortAlphaFixture);
    await expect.element(screen.getByText('Edit item: Definition One', { exact: true })).toBeVisible();
  });

  it('names a cohort by its subject when the cohort definition is unknown', async () => {
    const screen = await openEditDialogForItem({ ...cohortAlphaFixture, cohort_definition_id: 'def-unknown' });
    await expect.element(screen.getByText('Edit item: Subject Alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort by the id of a cohort definition that has no name', async () => {
    const screen = await openEditDialogForItem({ ...cohortAlphaFixture, cohort_definition_id: 'def-unnamed' });
    await expect.element(screen.getByText('Edit item: def-unnamed', { exact: true })).toBeVisible();
  });

  it('names a cohort by its subject when the cohort definition id is empty', async () => {
    const screen = await openEditDialogForItem({ ...cohortAlphaFixture, cohort_definition_id: '' });
    await expect.element(screen.getByText('Edit item: Subject Alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort by its id when the subject is blank', async () => {
    const screen = await openEditDialogForItem({ ...cohortAlphaFixture, cohort_definition_id: '', subject_id: '   ' });
    await expect.element(screen.getByText('Edit item: cohort-alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort by its id when no other name field is set', async () => {
    const screen = await openEditDialogForItem({ cohort_definition_id: '', cohort_end_date: '', cohort_id: 'cohort-bare', cohort_start_date: '', id: 'cohort-bare', subject_id: '' });
    await expect.element(screen.getByText('Edit item: cohort-bare', { exact: true })).toBeVisible();
  });

  it('names a created cohort by its id when the subject is blank and its definition is no longer an option', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCohortPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Cohort Definition ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Definition Two' }).click();
    await screen.getByRole('textbox', { name: 'Subject ID' }).fill('   ');
    await fillDateField(screen, 'Cohort Start Date', '2024-04-01');
    await fillDateField(screen, 'Cohort End Date', '2024-05-01');

    let cohortDefinitionRequestCount = 0;
    mockApiRequest('GET', COHORT_DEFINITIONS_PATH, () => {
      cohortDefinitionRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    const cohortDefinitionsQueryKey = queryClientService.getGenericKey(OMOPDB_QUERY_KEY.COHORT_DEFINITIONS);
    await queryClientService.queryClient.invalidateQueries({ queryKey: cohortDefinitionsQueryKey });
    await expect.poll(() => cohortDefinitionRequestCount).toBe(1);
    await expect.poll(() => queryClientService.queryClient.getQueryData(cohortDefinitionsQueryKey)).toEqual([]);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cohort_definition_id: 'def-2', subject_id: '   ' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-cohort" has been created.')]));
  });
});
