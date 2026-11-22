import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConditionOccurrenceIdentifier,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { ConditionOccurrenceIdentifiersAdminPage } from './ConditionOccurrenceIdentifiersAdminPage';

type ConditionOccurrenceIdentifierFixture = { readonly id: string } & OmopDbConditionOccurrenceIdentifier;

const CONDITION_OCCURRENCE_IDENTIFIERS_PATH = '/v1/condition_occurrence_identifiers';
const ROUTE_PATH = '/management/condition-occurrence-identifiers';
const URL = '/management/condition-occurrence-identifiers';

const CONDITION_OCCURRENCE_IDENTIFIER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConditionOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConditionOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConditionOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const alphaFixture: ConditionOccurrenceIdentifierFixture = {
  external_id: 'EXT-ALPHA',
  id: 'coi-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'co-1',
};

const betaFixture: ConditionOccurrenceIdentifierFixture = {
  external_id: 'EXT-BETA',
  id: 'coi-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'co-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/identifier_issuers', () => Response.json([
    { id: 'issuer-1', name: 'Issuer One' },
    { id: 'issuer-2', name: 'Issuer Two' },
    { id: 'issuer-blank', name: '' },
  ]));
  mockApiRequest('GET', '/v1/ConditionOccurrences', () => Response.json([
    { condition_occurrence_id: 'co-1' },
    { condition_occurrence_id: 'co-2' },
  ]));
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `id`.
 * The page maps the created item to a table row by `id`, so the API response must include it.
 */
const mockConditionOccurrenceIdentifierPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONDITION_OCCURRENCE_IDENTIFIERS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConditionOccurrenceIdentifier>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'coi-created' }, { status: 201 });
  });
  return postBodies;
};

const renderPage = async (initialItems: ConditionOccurrenceIdentifierFixture[] = [alphaFixture, betaFixture], permissions = CONDITION_OCCURRENCE_IDENTIFIER_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONDITION_OCCURRENCE_IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConditionOccurrenceIdentifiersAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openEditDialogForItem = async (item: Partial<ConditionOccurrenceIdentifierFixture>) => {
  const { screen } = await renderPage([item as ConditionOccurrenceIdentifierFixture]);
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConditionOccurrenceIdentifiersAdminPage', () => {
  it('lists the condition occurrence identifiers with issuer name and internal id', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'co-2' })).toBeInTheDocument();
  });

  it('creates a condition occurrence identifier via the condition occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new condition occurrence identifier', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-NEW');
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'co-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CONDITION_OCCURRENCE_IDENTIFIERS_PATH);
    expect(postCall?.body).toEqual({ external_id: 'EXT-NEW', identifier_issuer_id: 'issuer-2', internal_id: 'co-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a condition occurrence identifier via the condition occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-RENAMED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONDITION_OCCURRENCE_IDENTIFIERS_PATH}/coi-alpha`);
    expect(putCall?.body).toEqual({ external_id: 'EXT-RENAMED', id: 'coi-alpha', identifier_issuer_id: 'issuer-1', internal_id: 'co-1' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a condition occurrence identifier via the condition occurrence identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONDITION_OCCURRENCE_IDENTIFIERS_PATH}/coi-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([alphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an identifier by the name of its identifier issuer', async () => {
    const screen = await openEditDialogForItem(alphaFixture);
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
  });

  it('names an identifier by its internal id when the identifier issuer is not known', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-INTERNAL', id: 'coi-internal', identifier_issuer_id: 'issuer-unknown', internal_id: 'co-2' });
    await expect.element(screen.getByText('Edit item: co-2', { exact: true })).toBeVisible();
  });

  it('names an identifier by its id when neither the identifier issuer nor the internal id is known', async () => {
    const screen = await openEditDialogForItem({ id: 'coi-both-unknown', identifier_issuer_id: 'issuer-unknown', internal_id: 'co-unknown' });
    await expect.element(screen.getByText('Edit item: coi-both-unknown', { exact: true })).toBeVisible();
  });

  it('names an identifier by its id when the identifier issuer has no name', async () => {
    const screen = await openEditDialogForItem({ id: 'coi-blank-issuer', identifier_issuer_id: 'issuer-blank' });
    await expect.element(screen.getByText('Edit item: coi-blank-issuer', { exact: true })).toBeVisible();
  });

  it('names an identifier by its internal id when the identifier issuer id is empty', async () => {
    const screen = await openEditDialogForItem({ id: 'coi-empty-issuer', identifier_issuer_id: '', internal_id: 'co-1' });
    await expect.element(screen.getByText('Edit item: co-1', { exact: true })).toBeVisible();
  });

  it('names an identifier by its external id when the issuer and internal id are absent', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-ONLY', id: 'coi-external' });
    await expect.element(screen.getByText('Edit item: EXT-ONLY', { exact: true })).toBeVisible();
  });

  it('names an identifier by its internal id when the identifier issuer id is empty and the internal id is not known', async () => {
    const screen = await openEditDialogForItem({ id: 'coi-unknown-internal', identifier_issuer_id: '', internal_id: 'co-unknown' });
    await expect.element(screen.getByText('Edit item: coi-unknown-internal', { exact: true })).toBeVisible();
  });

  it('names a new identifier by its selected identifier issuer id when both selected options are no longer listed', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postBodies = mockConditionOccurrenceIdentifierPost(responseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'co-2' }).click();

    let identifierIssuerRequestCount = 0;
    let conditionOccurrenceRequestCount = 0;
    mockApiRequest('GET', '/v1/identifier_issuers', () => {
      identifierIssuerRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/ConditionOccurrences', () => {
      conditionOccurrenceRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONDITION_OCCURRENCES) });
    await expect.poll(() => identifierIssuerRequestCount).toBe(1);
    await expect.poll(() => conditionOccurrenceRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ external_id: '   ', identifier_issuer_id: 'issuer-2', internal_id: 'co-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"issuer-2" is being saved')]));
    releasePost();
  });

  it('names an identifier by its numeric external id', async () => {
    const screen = await openEditDialogForItem({ external_id: 42 as unknown as string, id: 'coi-number' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names an identifier by its id when the external id is blank', async () => {
    const screen = await openEditDialogForItem({ external_id: '   ', id: 'coi-blank-external' });
    await expect.element(screen.getByText('Edit item: coi-blank-external', { exact: true })).toBeVisible();
  });
});
