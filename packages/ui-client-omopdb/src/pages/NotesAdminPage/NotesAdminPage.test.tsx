import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbNote,
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

import { NotesAdminPage } from './NotesAdminPage';

type NoteFixture = { readonly id: string } & OmopDbNote;

const NOTES_PATH = '/v1/Notes';
const PERSONS_PATH = '/v1/Persons';
const CONCEPTS_PATH = '/v1/Concepts';
const ORGANIZATIONS_PATH = '/v1/organizations';
const PROVIDERS_PATH = '/v1/Providers';
const VISIT_DETAILS_PATH = '/v1/VisitDetails';
const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';
const ROUTE_PATH = '/management/notes';

const NOTE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createNoteFixture = (overrides: Partial<NoteFixture> & Pick<NoteFixture, 'id'>): NoteFixture => {
  return {
    encoding_concept_id: 'concept-1',
    language_concept_id: 'concept-1',
    note_class_concept_id: 'concept-2',
    note_date: '2020-06-15',
    note_datetime: null,
    note_event_field_concept_id: null,
    note_event_id: null,
    note_id: overrides.id,
    note_source_value: null,
    note_text: 'Note body',
    note_title: null,
    note_type_concept_id: 'concept-2',
    person_id: 'person-1',
    provenance_id: null,
    provided_by_organization_id: null,
    provider_id: null,
    source_traceback: null,
    visit_detail_id: null,
    visit_occurrence_id: null,
    ...overrides,
  };
};

const noteAlphaFixture = createNoteFixture({
  id: 'note-alpha',
  note_source_value: 'SRC-ALPHA',
  provenance_id: 'PROV-ALPHA',
  provided_by_organization_id: 'org-1',
  source_traceback: 'Source A',
});

const noteBetaFixture = createNoteFixture({
  id: 'note-beta',
  note_source_value: 'SRC-BETA',
  person_id: 'person-2',
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
 * Overrides the POST handler of mockCrudApi, which returns items without `note_id`.
 * The page maps the created item by its primary key, so the API response must include it.
 */
const mockNotePost = (responseGate?: Promise<void>) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', NOTES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbNote>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, note_id: 'created-note' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: '' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([
    { id: 'org-1', name: 'Org One' },
  ]));
  mockApiRequest('GET', PROVIDERS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_DETAILS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => Response.json([]));
};

const renderPage = async (initialItems: NoteFixture[] = [noteAlphaFixture, noteBetaFixture], permissions = NOTE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(NOTES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <NotesAdminPage />, {
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
  await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Note Type Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Note Class Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Encoding Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Language Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
  await fillDate(screen, 'Note Date', ['2021', '02', '03']);
  await screen.getByRole('textbox', { exact: true, name: 'Note Text' }).fill('Note body');
};

const openEditDialogForItem = async (item: NoteFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('NotesAdminPage', () => {
  it('lists the notes from the notes endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates a note via the notes endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockNotePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new note', { exact: true })).toBeVisible();
    await fillRequiredFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Note Source Value' }).fill('SRC-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      encoding_concept_id: 'concept-1',
      language_concept_id: 'concept-1',
      note_class_concept_id: 'concept-2',
      note_source_value: 'SRC-NEW',
      note_text: 'Note body',
      note_type_concept_id: 'concept-1',
      person_id: 'person-2',
      provenance_id: 'PROV-NEW',
    }));
    expectCalendarDate((postBodies[0] as Partial<OmopDbNote>).note_date, 2021, 1, 3);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a new note by its person id when the related options no longer include the selected values', async () => {
    const { screen } = await renderPage([]);
    let releasePostResponse: () => void = () => undefined;
    const postResponseGate = new Promise<void>((resolve) => {
      releasePostResponse = resolve;
    });
    const postBodies = mockNotePost(postResponseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen);

    let personsRequestCount = 0;
    let conceptsRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personsRequestCount).toBe(1);
    await expect.poll(() => conceptsRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-2"')]));
    releasePostResponse();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a note via the notes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-EDIT');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${NOTES_PATH}/note-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ note_id: 'note-alpha', person_id: 'person-1', provenance_id: 'PROV-EDIT' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a note via the notes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${NOTES_PATH}/note-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([noteAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a note by its source value', async () => {
    const screen = await openEditDialogForItem(noteAlphaFixture);
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
  });

  it('names a note by its numeric source value', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-numeric-source',
      note_source_value: 7 as unknown as string,
    }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a note by its resolved person label when the source value is blank', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-blank-source',
      note_source_value: '   ',
      person_id: 'person-1',
    }));
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a note by its resolved note type label when the person is unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-unresolved-person',
      note_source_value: null,
      note_type_concept_id: 'concept-1',
      person_id: 'person-unknown',
    }));
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a note by its resolved note class label when the person and note type are unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-unresolved-type',
      note_class_concept_id: 'concept-1',
      note_source_value: '',
      note_type_concept_id: 'concept-unknown',
      person_id: 'person-unknown',
    }));
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a note by its id when the person, note type and note class are unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-all-unresolved',
      note_class_concept_id: 'concept-unknown',
      note_source_value: null,
      note_type_concept_id: 'concept-unknown',
      person_id: 'person-unknown',
    }));
    await expect.element(screen.getByText('Edit item: note-all-unresolved', { exact: true })).toBeVisible();
  });

  it('names a note by its id when the person is null and the note type is unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-null-person',
      note_class_concept_id: 'concept-unknown',
      note_source_value: null,
      note_type_concept_id: 'concept-unknown',
      person_id: null,
    }));
    await expect.element(screen.getByText('Edit item: note-null-person', { exact: true })).toBeVisible();
  });

  it('names a note by its id when the person is empty and the note class is unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-empty-person',
      note_class_concept_id: 'concept-unknown',
      note_source_value: null,
      note_type_concept_id: null,
      person_id: '',
    }));
    await expect.element(screen.getByText('Edit item: note-empty-person', { exact: true })).toBeVisible();
  });

  it('names a note by its id when the note class is null and the person and note type are unresolved', async () => {
    const screen = await openEditDialogForItem(createNoteFixture({
      id: 'note-null-class',
      note_class_concept_id: null,
      note_source_value: null,
      note_type_concept_id: 'concept-unknown',
      person_id: 'person-unknown',
    }));
    await expect.element(screen.getByText('Edit item: note-null-class', { exact: true })).toBeVisible();
  });
});
