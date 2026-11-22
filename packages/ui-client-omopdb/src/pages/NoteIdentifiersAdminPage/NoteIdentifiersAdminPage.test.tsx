import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbNoteIdentifier,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { NoteIdentifiersAdminPage } from './NoteIdentifiersAdminPage';

type NoteIdentifierFixture = { readonly id: string } & OmopDbNoteIdentifier;

const NOTE_IDENTIFIERS_PATH = '/v1/note_identifiers';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const NOTES_PATH = '/v1/Notes';
const ROUTE_PATH = '/management/note-identifiers';
const URL = '/management/note-identifiers';

const NOTE_IDENTIFIER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.NoteIdentifierCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.NoteIdentifierCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.NoteIdentifierCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const noteIdentifierAlphaFixture: NoteIdentifierFixture = {
  external_id: 'EXT-ALPHA',
  id: 'ni-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'note-1',
};

const noteIdentifierBetaFixture: NoteIdentifierFixture = {
  external_id: 'EXT-BETA',
  id: 'ni-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'note-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json([
    { id: 'issuer-1', name: 'Issuer One' },
    { id: 'issuer-2', name: 'Issuer Two' },
  ]));
  mockApiRequest('GET', NOTES_PATH, () => Response.json([
    { note_id: 'note-1' },
    { note_id: 'note-2' },
  ]));
};

const renderPage = async (
  initialItems: NoteIdentifierFixture[] = [noteIdentifierAlphaFixture, noteIdentifierBetaFixture],
  permissions = NOTE_IDENTIFIER_PERMISSIONS,
) => {
  mockReferenceData();
  const mock = mockCrudApi(NOTE_IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <NoteIdentifiersAdminPage />, {
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

const openEditDialogForItem = async (item: NoteIdentifierFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('NoteIdentifiersAdminPage', () => {
  it('lists the note identifiers with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'note-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'note-2' })).toBeInTheDocument();
  });

  it('creates a note identifier via the note identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new note identifier', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-NEW');
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'note-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(NOTE_IDENTIFIERS_PATH);
    expect(postCall?.body).toEqual({ external_id: 'EXT-NEW', identifier_issuer_id: 'issuer-2', internal_id: 'note-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a note identifier via the note identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-ALPHA-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${NOTE_IDENTIFIERS_PATH}/ni-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ external_id: 'EXT-ALPHA-2', id: 'ni-alpha', identifier_issuer_id: 'issuer-1', internal_id: 'note-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a note identifier via the note identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${NOTE_IDENTIFIERS_PATH}/ni-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([noteIdentifierAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a note identifier by the label of its identifier issuer when the issuer is known', async () => {
    const screen = await openEditDialogForItem(noteIdentifierAlphaFixture);
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
  });

  it('names a note identifier by the label of its note when the identifier issuer is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-X', id: 'ni-unknown-issuer', identifier_issuer_id: 'issuer-unknown', internal_id: 'note-2' });
    await expect.element(screen.getByText('Edit item: note-2', { exact: true })).toBeVisible();
  });

  it('names a note identifier by its external id when neither related option is known', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-X', id: 'ni-unknown-both', identifier_issuer_id: 'issuer-unknown', internal_id: 'note-unknown' });
    await expect.element(screen.getByText('Edit item: EXT-X', { exact: true })).toBeVisible();
  });

  it('names a note identifier by its external id when the identifier issuer and internal id are empty', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-EMPTY', id: 'ni-empty-refs', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: EXT-EMPTY', { exact: true })).toBeVisible();
  });

  it('names a note identifier by its numeric external id', async () => {
    const screen = await openEditDialogForItem({ external_id: 42 as unknown as string, id: 'ni-numeric', identifier_issuer_id: 'issuer-unknown', internal_id: 'note-unknown' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a note identifier by its id when the external id is blank', async () => {
    const screen = await openEditDialogForItem({ external_id: '   ', id: 'ni-blank', identifier_issuer_id: 'issuer-unknown', internal_id: 'note-unknown' });
    await expect.element(screen.getByText('Edit item: ni-blank', { exact: true })).toBeVisible();
  });

  it('names a note identifier by its external id when the identifier issuer is empty and the internal id is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-Y', id: 'ni-empty-issuer', identifier_issuer_id: '', internal_id: 'note-unknown' });
    await expect.element(screen.getByText('Edit item: EXT-Y', { exact: true })).toBeVisible();
  });

  it('creates a note identifier after the related options were refreshed without the selected values', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'note-2' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('   ');

    let identifierIssuersRequestCount = 0;
    let notesRequestCount = 0;
    mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => {
      identifierIssuersRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', NOTES_PATH, () => {
      notesRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.NOTES) });
    await expect.poll(() => identifierIssuersRequestCount).toBe(1);
    await expect.poll(() => notesRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({ external_id: '   ', identifier_issuer_id: 'issuer-2', internal_id: 'note-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
