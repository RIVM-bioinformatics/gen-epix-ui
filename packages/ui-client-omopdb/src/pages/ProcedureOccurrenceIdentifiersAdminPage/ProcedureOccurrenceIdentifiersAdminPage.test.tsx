import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbProcedureOccurrenceIdentifier,
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

import { ProcedureOccurrenceIdentifiersAdminPage } from './ProcedureOccurrenceIdentifiersAdminPage';

type ProcedureOccurrenceIdentifierFixture = { readonly id: string } & OmopDbProcedureOccurrenceIdentifier;

const PROCEDURE_OCCURRENCE_IDENTIFIERS_PATH = '/v1/procedure_occurrence_identifiers';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const PROCEDURE_OCCURRENCES_PATH = '/v1/ProcedureOccurrences';
const ROUTE_PATH = '/management/procedure-occurrence-identifiers';
const URL = '/management/procedure-occurrence-identifiers';

const PROCEDURE_OCCURRENCE_IDENTIFIER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ProcedureOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ProcedureOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ProcedureOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const procedureOccurrenceIdentifierAlphaFixture: ProcedureOccurrenceIdentifierFixture = {
  external_id: 'EXT-ALPHA',
  id: 'poi-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'procedure-1',
};

const procedureOccurrenceIdentifierBetaFixture: ProcedureOccurrenceIdentifierFixture = {
  external_id: 'EXT-BETA',
  id: 'poi-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'procedure-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json([
    { id: 'issuer-1', name: 'Issuer One' },
    { id: 'issuer-2', name: 'Issuer Two' },
    { id: 'issuer-blank', name: '' },
  ]));
  mockApiRequest('GET', PROCEDURE_OCCURRENCES_PATH, () => Response.json([
    { procedure_occurrence_id: 'procedure-1' },
    { procedure_occurrence_id: 'procedure-2' },
  ]));
};

const renderPage = async (initialItems: ProcedureOccurrenceIdentifierFixture[] = [procedureOccurrenceIdentifierAlphaFixture, procedureOccurrenceIdentifierBetaFixture], permissions = PROCEDURE_OCCURRENCE_IDENTIFIER_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(PROCEDURE_OCCURRENCE_IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ProcedureOccurrenceIdentifiersAdminPage />, {
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

const openEditDialogForItem = async (item: ProcedureOccurrenceIdentifierFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ProcedureOccurrenceIdentifiersAdminPage', () => {
  it('lists the procedure occurrence identifiers from the procedure occurrence identifiers endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'procedure-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'procedure-2' })).toBeInTheDocument();
  });

  it('creates a procedure occurrence identifier via the procedure occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new procedure occurrence identifier', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-NEW');
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'procedure-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(PROCEDURE_OCCURRENCE_IDENTIFIERS_PATH);
    expect(postCall?.body).toEqual({ external_id: 'EXT-NEW', identifier_issuer_id: 'issuer-2', internal_id: 'procedure-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a procedure occurrence identifier via the procedure occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-ALPHA-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROCEDURE_OCCURRENCE_IDENTIFIERS_PATH}/poi-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ external_id: 'EXT-ALPHA-2', id: 'poi-alpha', identifier_issuer_id: 'issuer-1', internal_id: 'procedure-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a procedure occurrence identifier via the procedure occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PROCEDURE_OCCURRENCE_IDENTIFIERS_PATH}/poi-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([procedureOccurrenceIdentifierAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a procedure occurrence identifier by the label of its identifier issuer when the issuer is known', async () => {
    const screen = await openEditDialogForItem(procedureOccurrenceIdentifierAlphaFixture);
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by the label of its procedure occurrence when the identifier issuer is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-X', id: 'poi-unknown-issuer', identifier_issuer_id: 'issuer-unknown', internal_id: 'procedure-2' });
    await expect.element(screen.getByText('Edit item: procedure-2', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its external id when neither related option is known', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-X', id: 'poi-unknown-external', identifier_issuer_id: 'issuer-unknown', internal_id: 'procedure-unknown' });
    await expect.element(screen.getByText('Edit item: EXT-X', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its id when its identifier issuer has an empty label and the external id is blank', async () => {
    const screen = await openEditDialogForItem({ external_id: '', id: 'poi-blank-label', identifier_issuer_id: 'issuer-blank', internal_id: '' });
    await expect.element(screen.getByText('Edit item: poi-blank-label', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its external id when the identifier issuer and internal id are empty', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-EMPTY', id: 'poi-empty-refs', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: EXT-EMPTY', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its numeric external id', async () => {
    const screen = await openEditDialogForItem({ external_id: 42 as unknown as string, id: 'poi-number', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its id when the external id is blank', async () => {
    const screen = await openEditDialogForItem({ external_id: '   ', id: 'poi-blank', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: poi-blank', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence identifier by its id when the external id is empty and no related option is known', async () => {
    const screen = await openEditDialogForItem({ external_id: '', id: 'poi-empty-external', identifier_issuer_id: '', internal_id: 'procedure-unknown' });
    await expect.element(screen.getByText('Edit item: poi-empty-external', { exact: true })).toBeVisible();
  });

  it('names a new procedure occurrence identifier by its identifier issuer id when the related options no longer include the selected values', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'procedure-2' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('   ');

    let identifierIssuersRequestCount = 0;
    let procedureOccurrencesRequestCount = 0;
    mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => {
      identifierIssuersRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', PROCEDURE_OCCURRENCES_PATH, () => {
      procedureOccurrencesRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PROCEDURE_OCCURRENCES) });
    await expect.poll(() => identifierIssuersRequestCount).toBe(1);
    await expect.poll(() => procedureOccurrencesRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({ external_id: '   ', identifier_issuer_id: 'issuer-2', internal_id: 'procedure-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
