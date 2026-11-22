import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDeath,
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

import { DeathsAdminPage } from './DeathsAdminPage';

type DeathFixture = { readonly id: string } & OmopDbDeath;

const DEATHS_PATH = '/v1/Deaths';
const CONCEPTS_PATH = '/v1/Concepts';
const PERSONS_PATH = '/v1/Persons';
const ORGANIZATIONS_PATH = '/v1/organizations';
const ROUTE_PATH = '/management/deaths';
const URL = '/management/deaths';

const DEATH_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DeathCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DeathCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DeathCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const deathAlphaFixture: DeathFixture = {
  cause_concept_id: 'concept-2',
  cause_source_value: 'Heart failure',
  death_date: '2024-01-02',
  death_id: 'death-alpha',
  death_type_concept_id: 'concept-1',
  id: 'death-alpha',
  person_id: 'person-1',
  provided_by_organization_id: 'org-1',
};

const deathBetaFixture: DeathFixture = {
  cause_source_value: null,
  death_date: '2024-02-03',
  death_id: 'death-beta',
  id: 'death-beta',
  person_id: 'person-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `death_id`.
 * The page maps the created item to a table row by `death_id`, so the API response must include it.
 */
const mockDeathPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DEATHS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDeath>;
    postBodies.push(body);
    return Response.json({ ...body, death_id: 'created-death', id: 'created-death' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([{ id: 'org-1', name: 'Org One' }]));
};

const renderPage = async (initialItems: DeathFixture[] = [deathAlphaFixture, deathBetaFixture], permissions = DEATH_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DEATHS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DeathsAdminPage />, {
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

/**
 * Opens the edit dialog for a row. Accepts partial rows, including null fields, to reach the name fallbacks.
 */
const openEditDialogForItem = async (item: object) => {
  const { screen } = await renderPage([item as unknown as DeathFixture]);
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

describe('DeathsAdminPage', () => {
  it('lists the deaths with the person, concept and cause source value', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Heart failure' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates a death via the deaths endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDeathPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new death', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await fillDateField(screen, 'Death Date', '2024-03-04');
    await screen.getByRole('textbox', { name: 'Cause Source Value' }).fill('Stroke');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cause_source_value: 'Stroke', person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a death via the deaths endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Heart failure', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Source Traceback' }).fill('Traceback text');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DEATHS_PATH}/death-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ death_id: 'death-alpha', person_id: 'person-1', source_traceback: 'Traceback text' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a death via the deaths endpoint', async () => {
    const { mock, screen } = await renderPage([deathAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Heart failure', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DEATHS_PATH}/death-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([deathAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Heart failure' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a death by its cause source value when it is a non-blank string', async () => {
    const screen = await openEditDialogForItem(deathAlphaFixture);
    await expect.element(screen.getByText('Edit item: Heart failure', { exact: true })).toBeVisible();
  });

  it('names a death by its cause source value when it is a number', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: 42 });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a death by the person when the cause source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: '   ' });
    await expect.element(screen.getByText('Edit item: person-2', { exact: true })).toBeVisible();
  });

  it('names a death by the concept when the person is unknown', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: null, death_type_concept_id: 'concept-1', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a death by its id when the person and the death type concept are both unknown', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: null, death_id: 'death-both-unknown', death_type_concept_id: 'concept-unknown', id: 'death-both-unknown', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: death-both-unknown', { exact: true })).toBeVisible();
  });

  it('names a death by the cause concept when the person is unknown and the death type concept is empty', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_concept_id: 'concept-1', cause_source_value: null, death_type_concept_id: null, person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a death by its id when the person and the cause concept are unknown', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_concept_id: 'concept-unknown', cause_source_value: null, death_id: 'death-cause-unknown', death_type_concept_id: null, id: 'death-cause-unknown', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: death-cause-unknown', { exact: true })).toBeVisible();
  });

  it('names a death by its id when no person, concept or cause source value is set', async () => {
    const screen = await openEditDialogForItem({ death_date: '2024-05-06', death_id: 'death-bare', id: 'death-bare' });
    await expect.element(screen.getByText('Edit item: death-bare', { exact: true })).toBeVisible();
  });

  it('names a death by its id when the person is absent and the death type concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: null, death_id: 'death-type-unknown', death_type_concept_id: 'concept-unknown', id: 'death-type-unknown', person_id: null });
    await expect.element(screen.getByText('Edit item: death-type-unknown', { exact: true })).toBeVisible();
  });

  it('names a death by its id when the person and the death type concept are absent and the cause concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_concept_id: 'concept-unknown', cause_source_value: null, death_id: 'death-cause-only', death_type_concept_id: null, id: 'death-cause-only', person_id: null });
    await expect.element(screen.getByText('Edit item: death-cause-only', { exact: true })).toBeVisible();
  });

  it('names a death by its id when the person id is empty', async () => {
    const screen = await openEditDialogForItem({ ...deathBetaFixture, cause_source_value: null, death_id: 'death-empty-person', id: 'death-empty-person', person_id: '' });
    await expect.element(screen.getByText('Edit item: death-empty-person', { exact: true })).toBeVisible();
  });

  it('creates a death named by its person id when the person options no longer include the selected person', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDeathPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new death', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await fillDateField(screen, 'Death Date', '2024-03-04');

    let personRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await expect.poll(() => personRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
