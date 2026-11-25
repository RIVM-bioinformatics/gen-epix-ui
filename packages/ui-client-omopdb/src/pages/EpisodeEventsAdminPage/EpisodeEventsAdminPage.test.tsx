import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbEpisodeEvent,
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

import { EpisodeEventsAdminPage } from './EpisodeEventsAdminPage';

type EpisodeEventFixture = { readonly id: string } & OmopDbEpisodeEvent;

const EPISODE_EVENTS_PATH = '/v1/EpisodeEvents';
const ROUTE_PATH = '/management/episode-events';
const URL = '/management/episode-events';

const EPISODE_EVENT_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.EpisodeEventCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.EpisodeEventCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.EpisodeEventCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const episodeEventAlphaFixture: EpisodeEventFixture = {
  episode_event_field_concept_id: 'concept-1',
  episode_event_id: 'episode-event-alpha',
  episode_id: 'episode-1',
  event_id: 'event-1',
  id: 'episode-event-alpha',
  provenance_id: 'Provenance alpha',
  source_traceback: 'Traceback alpha',
};

const episodeEventBetaFixture: EpisodeEventFixture = {
  episode_event_field_concept_id: 'concept-2',
  episode_event_id: 'episode-event-beta',
  episode_id: 'episode-2',
  event_id: 'event-2',
  id: 'episode-event-beta',
  provenance_id: null,
  source_traceback: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `episode_event_id`.
 * The page maps the created item to a table row by `episode_event_id`, so the API response must include it.
 */
const mockEpisodeEventPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', EPISODE_EVENTS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbEpisodeEvent>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, episode_event_id: 'created-episode-event', id: 'created-episode-event' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Visit start' },
    { concept_id: 'concept-2', concept_name: 'Visit end' },
  ]));
  mockApiRequest('GET', '/v1/Episodes', () => Response.json([
    { episode_id: 'episode-1' },
    { episode_id: 'episode-2' },
  ]));
};

const renderPage = async (initialItems: EpisodeEventFixture[] = [episodeEventAlphaFixture, episodeEventBetaFixture], permissions = EPISODE_EVENT_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(EPISODE_EVENTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <EpisodeEventsAdminPage />, {
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

const openEditDialogForItem = async (item: EpisodeEventFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('EpisodeEventsAdminPage', () => {
  it('lists the episode events from the episode events endpoint with episode and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provenance alpha' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'episode-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Visit end' }).first()).toBeInTheDocument();
  });

  it('creates an episode event via the episode events endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockEpisodeEventPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new episode event', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Episode ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'episode-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Event Field Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit start' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Event ID' }).fill('event-3');
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Typed provenance');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      episode_event_field_concept_id: 'concept-1',
      episode_id: 'episode-2',
      event_id: 'event-3',
      provenance_id: 'Typed provenance',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an episode event after its selected episode when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', EPISODE_EVENTS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'episode-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Event Field Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit start' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Event ID' }).fill('event-3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Episode Event "episode-2" could not be created.')]));
  });

  it('names an unsaved episode event by its episode id when the option lists no longer include the selected episode and concept', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'episode-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Episode Event Field Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit start' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Event ID' }).fill('event-3');
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('   ');

    let episodeRequestCount = 0;
    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Episodes', () => {
      episodeRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.EPISODES) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => episodeRequestCount).toBe(1);
    await expect.poll(() => conceptRequestCount).toBe(1);

    let releasePost: () => void = () => undefined;
    const postBodies = mockEpisodeEventPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"episode-2"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an episode event via the episode events endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: episode-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Changed provenance');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${EPISODE_EVENTS_PATH}/episode-event-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      episode_event_field_concept_id: 'concept-1',
      episode_event_id: 'episode-event-alpha',
      episode_id: 'episode-1',
      provenance_id: 'Changed provenance',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('names an episode event after its episode when saving it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${EPISODE_EVENTS_PATH}/episode-event-alpha`, () => new Response(null, { status: 500 }));

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Changed provenance');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Episode Event "episode-1" could not be saved.')]));
  });

  it('deletes an episode event via the episode events endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${EPISODE_EVENTS_PATH}/episode-event-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([episodeEventAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provenance alpha' }).first()).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an episode event by the label of its episode', async () => {
    const screen = await openEditDialogForItem(episodeEventAlphaFixture);
    await expect.element(screen.getByText('Edit item: episode-1', { exact: true })).toBeVisible();
  });

  it('names an episode event by the label of its concept when its episode is missing', async () => {
    const screen = await openEditDialogForItem({ ...episodeEventAlphaFixture, episode_id: null });
    await expect.element(screen.getByText('Edit item: Visit start', { exact: true })).toBeVisible();
  });

  it('names an episode event by the label of its concept when its episode is unknown', async () => {
    const screen = await openEditDialogForItem({ ...episodeEventAlphaFixture, episode_id: 'episode-unknown' });
    await expect.element(screen.getByText('Edit item: Visit start', { exact: true })).toBeVisible();
  });

  it('names an episode event by its provenance when its episode and concept are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: 'concept-unknown',
      episode_id: 'episode-unknown',
    });
    await expect.element(screen.getByText('Edit item: Provenance alpha', { exact: true })).toBeVisible();
  });

  it('names an episode event by its provenance when its episode is missing and its concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: 'concept-unknown',
      episode_id: null,
    });
    await expect.element(screen.getByText('Edit item: Provenance alpha', { exact: true })).toBeVisible();
  });

  it('names an episode event by a numeric provenance when its episode and concept are missing', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: null,
      episode_id: null,
      provenance_id: 12 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 12', { exact: true })).toBeVisible();
  });

  it('names an episode event by its source traceback when its provenance is blank', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: null,
      episode_id: null,
      provenance_id: '   ',
    });
    await expect.element(screen.getByText('Edit item: Traceback alpha', { exact: true })).toBeVisible();
  });

  it('names an episode event by a numeric source traceback when its provenance is empty', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: null,
      episode_id: null,
      provenance_id: null,
      source_traceback: 9 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names an episode event by its id when no other identifying value is set', async () => {
    const screen = await openEditDialogForItem({
      ...episodeEventAlphaFixture,
      episode_event_field_concept_id: null,
      episode_id: null,
      provenance_id: null,
      source_traceback: null,
    });
    await expect.element(screen.getByText('Edit item: episode-event-alpha', { exact: true })).toBeVisible();
  });
});
