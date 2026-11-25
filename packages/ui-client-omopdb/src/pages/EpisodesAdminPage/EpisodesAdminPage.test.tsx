import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbEpisode,
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

import { EpisodesAdminPage } from './EpisodesAdminPage';

type EpisodeFixture = { readonly id: string } & OmopDbEpisode;

const EPISODES_PATH = '/v1/Episodes';
const ROUTE_PATH = '/management/episodes';
const URL = '/management/episodes';

const EPISODE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.EpisodeCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.EpisodeCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.EpisodeCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const episodeAlphaFixture: EpisodeFixture = {
  episode_concept_id: 'concept-1',
  episode_end_date: null,
  episode_end_datetime: null,
  episode_id: 'episode-alpha',
  episode_number: 1,
  episode_object_concept_id: 'concept-3',
  episode_parent_id: null,
  episode_source_concept_id: null,
  episode_source_value: 'Source alpha',
  episode_start_date: '2022-01-01',
  episode_start_datetime: null,
  episode_type_concept_id: 'concept-3',
  id: 'episode-alpha',
  person_id: 'person-1',
  provenance_id: null,
  source_traceback: null,
};

const episodeBetaFixture: EpisodeFixture = {
  ...episodeAlphaFixture,
  episode_concept_id: 'concept-2',
  episode_id: 'episode-beta',
  episode_number: 2,
  episode_source_value: null,
  id: 'episode-beta',
  person_id: 'person-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `episode_id`.
 * The page maps the created item to a table row by `episode_id`, so the API response must include it.
 */
const mockEpisodePost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', EPISODES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbEpisode>;
    postBodies.push(body);
    return Response.json({ ...body, episode_id: 'created-episode', id: 'created-episode' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Aspirin' },
    { concept_id: 'concept-2', concept_name: 'Caffeine' },
    { concept_id: 'concept-3', concept_name: 'Oral' },
  ]));
  mockApiRequest('GET', '/v1/Episodes', () => Response.json([
    { episode_id: 'episode-alpha' },
    { episode_id: 'episode-beta' },
  ]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
};

const renderPage = async (initialItems: EpisodeFixture[] = [episodeAlphaFixture, episodeBetaFixture], permissions = EPISODE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(EPISODES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <EpisodesAdminPage />, {
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

const fillDate = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, [year, month, day]: [string, string, string]) => {
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { exact: true, name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Day' }).fill(day);
};

const openEditDialogForItem = async (item: EpisodeFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('EpisodesAdminPage', () => {
  it('lists the episodes from the episodes endpoint with person and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source alpha' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Caffeine' }).first()).toBeInTheDocument();
  });

  it('creates an episode via the episodes endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockEpisodePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new episode', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Object Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Episode Start Date', ['2022', '01', '01']);
    await screen.getByRole('textbox', { exact: true, name: 'Episode Source Value' }).fill('Typed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      episode_concept_id: 'concept-1',
      episode_object_concept_id: 'concept-3',
      episode_source_value: 'Typed source',
      episode_type_concept_id: 'concept-3',
      person_id: 'person-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an episode after the typed source value when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', EPISODES_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Object Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Episode Start Date', ['2022', '01', '01']);
    await screen.getByRole('textbox', { exact: true, name: 'Episode Source Value' }).fill('Typed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Episode "Typed source" could not be created.')]));
  });

  it('edits an episode via the episodes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Source alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Episode Source Value' }).fill('Changed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${EPISODES_PATH}/episode-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      episode_concept_id: 'concept-1',
      episode_id: 'episode-alpha',
      episode_source_value: 'Changed source',
      person_id: 'person-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('names an episode after its row when saving it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${EPISODES_PATH}/episode-alpha`, () => new Response(null, { status: 500 }));

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Episode Source Value' }).fill('Changed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Episode "Source alpha" could not be saved.')]));
  });

  it('deletes an episode via the episodes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${EPISODES_PATH}/episode-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([episodeAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source alpha' }).first()).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an episode by its numeric source value', async () => {
    const screen = await openEditDialogForItem({ ...episodeAlphaFixture, episode_source_value: 12 as unknown as string });
    await expect.element(screen.getByText('Edit item: 12', { exact: true })).toBeVisible();
  });

  it('names an episode by its person when its source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...episodeAlphaFixture, episode_source_value: '   ', person_id: 'person-2' });
    await expect.element(screen.getByText('Edit item: person-2', { exact: true })).toBeVisible();
  });

  it('names an episode by its concept when its source value and person are missing', async () => {
    const screen = await openEditDialogForItem({
      ...episodeAlphaFixture,
      episode_source_value: null,
      person_id: null,
    });
    await expect.element(screen.getByText('Edit item: Aspirin', { exact: true })).toBeVisible();
  });

  it('names an episode by its concept when its person is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...episodeAlphaFixture,
      episode_concept_id: 'concept-2',
      episode_source_value: null,
      person_id: 'person-unknown',
    });
    await expect.element(screen.getByText('Edit item: Caffeine', { exact: true })).toBeVisible();
  });

  it('names an episode by its parent episode when its person and concept are unknown', async () => {
    const { screen } = await renderPage([
      {
        ...episodeAlphaFixture,
        episode_concept_id: 'concept-unknown',
        episode_parent_id: 'episode-beta',
        episode_source_value: null,
        person_id: 'person-unknown',
      },
      episodeBetaFixture,
    ]);
    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: episode-beta', { exact: true })).toBeVisible();
  });

  it('names an episode by its id when no other identifying value resolves', async () => {
    const screen = await openEditDialogForItem({
      ...episodeAlphaFixture,
      episode_concept_id: 'concept-unknown',
      episode_parent_id: 'episode-unknown',
      episode_source_value: null,
      person_id: 'person-unknown',
    });
    await expect.element(screen.getByText('Edit item: episode-alpha', { exact: true })).toBeVisible();
  });

  it('keeps the id as the name when the person is missing and the concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...episodeAlphaFixture,
      episode_concept_id: 'concept-unknown',
      episode_parent_id: null,
      episode_source_value: null,
      person_id: null,
    });
    await expect.element(screen.getByText('Edit item: episode-alpha', { exact: true })).toBeVisible();
  });

  it('keeps the id as the name when the person and concept are missing and the parent is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...episodeAlphaFixture,
      episode_concept_id: null,
      episode_parent_id: 'episode-unknown',
      episode_source_value: null,
      person_id: null,
    });
    await expect.element(screen.getByText('Edit item: episode-alpha', { exact: true })).toBeVisible();
  });

  it('names a new episode after its person when creating it fails and the person and concept options no longer contain them', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', EPISODES_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Object Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Episode Start Date', ['2022', '01', '01']);

    let personRequestCount = 0;
    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personRequestCount).toBe(1);
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Episode "person-2" could not be created.')]));
  });

  it('loads the episodes list from the episodes endpoint when the options request fails', async () => {
    mockReferenceData();
    mockCrudApi(EPISODES_PATH, [episodeAlphaFixture]);
    let episodesRequestCount = 0;
    mockApiRequest('GET', EPISODES_PATH, () => {
      episodesRequestCount += 1;
      if (episodesRequestCount === 1) {
        return new Response(null, { status: 500 });
      }
      return Response.json([episodeAlphaFixture]);
    });
    const screen = await renderRoutedPage(
      <EpisodesAdminPage />, {
        path: ROUTE_PATH,
        permissions: EPISODE_PERMISSIONS as unknown as CommonDbApiPermission[],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source alpha' }).first()).toBeInTheDocument();
    await expect.poll(() => episodesRequestCount).toBe(2);
  });
});
