import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbNoteNlp,
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

import { NoteNlpsAdminPage } from './NoteNlpsAdminPage';

type NoteNlpFixture = { readonly note_nlp_id: string } & OmopDbNoteNlp;

const NOTE_NLPS_PATH = '/v1/NoteNlps';
const NOTES_PATH = '/v1/Notes';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/note-nlps';

const NOTE_NLP_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.NoteNlpCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.NoteNlpCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.NoteNlpCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createNoteNlpFixture = (overrides: Partial<NoteNlpFixture> & Pick<NoteNlpFixture, 'note_nlp_id'>): NoteNlpFixture => {
  return {
    lexical_variant: 'LEX-DEFAULT',
    nlp_date: '2020-01-02',
    note_id: 'note-alpha',
    ...overrides,
  };
};

const noteNlpAlphaFixture = createNoteNlpFixture({
  lexical_variant: 'LEX-ALPHA',
  note_nlp_concept_id: 'concept-2',
  note_nlp_id: 'nlp-alpha',
  provenance_id: 'PROV-ALPHA',
  section_concept_id: 'concept-1',
  snippet: 'Snippet A',
  source_traceback: 'Source A',
});

const noteNlpBetaFixture = createNoteNlpFixture({
  lexical_variant: 'LEX-BETA',
  note_id: 'note-beta',
  note_nlp_id: 'nlp-beta',
  provenance_id: 'PROV-BETA',
  section_concept_id: 'concept-2',
  source_traceback: 'Source B',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * The date inputs are serialized as Date strings, so the calendar parts are compared after parsing.
 */
const expectCalendarDate = (value: unknown, year: number, monthIndex: number, day: number) => {
  const parsed = new Date(value as string);
  expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([year, monthIndex, day]);
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `note_nlp_id`.
 * The page maps the created item by its primary key, so the API response must include it.
 */
const mockNoteNlpPost = (responseGate?: Promise<void>) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', NOTE_NLPS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbNoteNlp>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, note_nlp_id: 'created-nlp' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', NOTES_PATH, () => Response.json([
    { note_id: 'note-alpha' },
    { note_id: 'note-beta' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: '' },
  ]));
};

const renderPage = async (initialItems: NoteNlpFixture[] = [noteNlpAlphaFixture, noteNlpBetaFixture], permissions = NOTE_NLP_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(NOTE_NLPS_PATH, initialItems.map((item) => ({ ...item, id: item.note_nlp_id })));
  const screen = await renderRoutedPage(
    <NoteNlpsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: ROUTE_PATH,
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

const fillRequiredFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Note ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'note-beta' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Lexical Variant' }).fill('LEX-NEW');
  await fillDate(screen, 'NLP Date', ['2021', '02', '03']);
};

const openEditDialogForItem = async (item: NoteNlpFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('NoteNlpsAdminPage', () => {
  it('lists the note nlps with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'LEX-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'LEX-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source B' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'note-alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' }).first()).toBeInTheDocument();
  });

  it('creates a note nlp via the note nlps endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockNoteNlpPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new note nlp', { exact: true })).toBeVisible();
    await fillRequiredFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Snippet' }).fill('SNIPPET-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      lexical_variant: 'LEX-NEW',
      note_id: 'note-beta',
      snippet: 'SNIPPET-NEW',
    }));
    expectCalendarDate((postBodies[0] as Partial<OmopDbNoteNlp>).nlp_date, 2021, 1, 3);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a new note nlp by its note id when the note is no longer among the note options', async () => {
    const { screen } = await renderPage([]);
    let releasePostResponse: () => void = () => undefined;
    const postResponseGate = new Promise<void>((resolve) => {
      releasePostResponse = resolve;
    });
    const postBodies = mockNoteNlpPost(postResponseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen);

    let notesRequestCount = 0;
    mockApiRequest('GET', NOTES_PATH, () => {
      notesRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.NOTES) });
    await expect.poll(() => notesRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"note-beta"')]));
    releasePostResponse();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a note nlp via the note nlps endpoint', async () => {
    const { mock, screen } = await renderPage([noteNlpAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: note-alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Lexical Variant' }).fill('LEX-EDIT');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${NOTE_NLPS_PATH}/nlp-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ lexical_variant: 'LEX-EDIT', note_id: 'note-alpha', note_nlp_id: 'nlp-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a note nlp via the note nlps endpoint', async () => {
    const { mock, screen } = await renderPage([noteNlpAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: note-alpha', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${NOTE_NLPS_PATH}/nlp-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([noteNlpAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'LEX-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a note nlp by its note id when the note is in the note options', async () => {
    const screen = await openEditDialogForItem(noteNlpAlphaFixture);
    await expect.element(screen.getByText('Edit item: note-alpha', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its section concept label when the note id is unknown', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: 'note-unknown',
      note_nlp_id: 'nlp-section',
      section_concept_id: 'concept-1',
    }));
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its note nlp concept label when the note id and section concept are unknown', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: 'note-unknown',
      note_nlp_concept_id: 'concept-1',
      note_nlp_id: 'nlp-concept',
      section_concept_id: 'concept-unknown',
    }));
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its source concept label when the note id is blank and the note nlp concept is unknown', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: null,
      note_nlp_concept_id: 'concept-unknown',
      note_nlp_id: 'nlp-source',
      note_nlp_source_concept_id: 'concept-2',
      section_concept_id: null,
    }));
    await expect.element(screen.getByText('Edit item: concept-2', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its id when all related values are unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: 'note-unknown',
      note_nlp_concept_id: 'concept-unknown',
      note_nlp_id: 'nlp-unresolved',
      note_nlp_source_concept_id: 'concept-unknown',
      section_concept_id: null,
    }));
    await expect.element(screen.getByText('Edit item: nlp-unresolved', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its id when no related value is set', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: null,
      note_nlp_concept_id: null,
      note_nlp_id: 'nlp-empty',
      note_nlp_source_concept_id: null,
      section_concept_id: null,
    }));
    await expect.element(screen.getByText('Edit item: nlp-empty', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its id when the note id is blank and the section concept is unknown', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: '',
      note_nlp_id: 'nlp-section-unknown',
      section_concept_id: 'concept-unknown',
    }));
    await expect.element(screen.getByText('Edit item: nlp-section-unknown', { exact: true })).toBeVisible();
  });

  it('names a note nlp by its id when the note id is blank and only the source concept is unknown', async () => {
    const screen = await openEditDialogForItem(createNoteNlpFixture({
      note_id: '',
      note_nlp_concept_id: null,
      note_nlp_id: 'nlp-source-unknown',
      note_nlp_source_concept_id: 'concept-unknown',
      section_concept_id: null,
    }));
    await expect.element(screen.getByText('Edit item: nlp-source-unknown', { exact: true })).toBeVisible();
  });
});
