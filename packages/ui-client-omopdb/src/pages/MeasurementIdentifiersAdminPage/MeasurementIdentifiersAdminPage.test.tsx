import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbMeasurementIdentifier,
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

import { MeasurementIdentifiersAdminPage } from './MeasurementIdentifiersAdminPage';

type IssuerFixture = { id: string; name: string };

type MeasurementIdentifierFixture = { readonly id: string } & OmopDbMeasurementIdentifier;

const MEASUREMENT_IDENTIFIERS_PATH = '/v1/measurement_identifiers';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const ROUTE_PATH = '/management/measurement-identifiers';
const URL = '/management/measurement-identifiers';

const MEASUREMENT_IDENTIFIER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.MeasurementIdentifierCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.MeasurementIdentifierCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.MeasurementIdentifierCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const DEFAULT_ISSUERS: IssuerFixture[] = [
  { id: 'issuer-1', name: 'Issuer One' },
  { id: 'issuer-2', name: 'Issuer Two' },
  { id: 'issuer-blank', name: '' },
];

const alphaFixture: MeasurementIdentifierFixture = {
  external_id: 'EXT-ALPHA',
  id: 'mi-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'measurement-1',
};

const betaFixture: MeasurementIdentifierFixture = {
  external_id: 'EXT-BETA',
  id: 'mi-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'measurement-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `id`.
 * The page maps the created item to a table row by `id`, so the API response must include it.
 */
const mockMeasurementIdentifierPost = (gate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', MEASUREMENT_IDENTIFIERS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbMeasurementIdentifier>;
    postBodies.push(body);
    await gate;
    return Response.json({ ...body, id: 'created-mi' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = (issuers: IssuerFixture[]) => {
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json(issuers));
  mockApiRequest('GET', '/v1/Measurements', () => Response.json([
    { measurement_id: 'measurement-1' },
    { measurement_id: 'measurement-2' },
  ]));
};

const renderPage = async (
  initialItems: MeasurementIdentifierFixture[] = [alphaFixture, betaFixture],
  permissions = MEASUREMENT_IDENTIFIER_PERMISSIONS,
  issuers: IssuerFixture[] = DEFAULT_ISSUERS,
) => {
  mockReferenceData(issuers);
  const mock = mockCrudApi(MEASUREMENT_IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <MeasurementIdentifiersAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openEditDialogForItem = async (item: { id: string } & Partial<MeasurementIdentifierFixture>) => {
  const { screen } = await renderPage([item as MeasurementIdentifierFixture]);
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('MeasurementIdentifiersAdminPage', () => {
  it('lists the measurement identifiers with issuer name, external id and internal id', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'measurement-2' })).toBeInTheDocument();
  });

  it('creates a measurement identifier via the measurement identifiers endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockMeasurementIdentifierPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new measurement identifier', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-NEW');
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ external_id: 'EXT-NEW', identifier_issuer_id: 'issuer-2', internal_id: 'measurement-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a measurement identifier via the measurement identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('EXT-RENAMED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${MEASUREMENT_IDENTIFIERS_PATH}/mi-alpha`);
    expect(putCall?.body).toEqual({ external_id: 'EXT-RENAMED', id: 'mi-alpha', identifier_issuer_id: 'issuer-1', internal_id: 'measurement-1' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a measurement identifier via the measurement identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${MEASUREMENT_IDENTIFIERS_PATH}/mi-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([alphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a measurement identifier by its matching issuer name', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-1', id: 'mi-issuer', identifier_issuer_id: 'issuer-1', internal_id: 'unknown' });
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its matching internal id when the issuer has no name', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-2', id: 'mi-internal', identifier_issuer_id: 'issuer-blank', internal_id: 'measurement-1' });
    await expect.element(screen.getByText('Edit item: measurement-1', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its id when the issuer has no name and the internal id is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: '  ', id: 'mi-fallback', identifier_issuer_id: 'issuer-blank', internal_id: 'unknown-measurement' });
    await expect.element(screen.getByText('Edit item: mi-fallback', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its id when the issuer is unknown and the internal id is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: '   ', id: 'mi-unknown', identifier_issuer_id: 'issuer-unknown', internal_id: 'unknown-measurement' });
    await expect.element(screen.getByText('Edit item: mi-unknown', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its external id when no issuer or internal id is known', async () => {
    const screen = await openEditDialogForItem({ external_id: 'EXT-ONLY', id: 'mi-external', identifier_issuer_id: 'issuer-unknown', internal_id: 'unknown-measurement' });
    await expect.element(screen.getByText('Edit item: EXT-ONLY', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its numeric external id', async () => {
    const screen = await openEditDialogForItem({ external_id: 42 as unknown as string, id: 'mi-number', identifier_issuer_id: 'issuer-unknown', internal_id: 'unknown-measurement' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its id when the issuer id and internal id are missing', async () => {
    const screen = await openEditDialogForItem({ external_id: '  ', id: 'mi-missing' });
    await expect.element(screen.getByText('Edit item: mi-missing', { exact: true })).toBeVisible();
  });

  it('names a measurement identifier by its id when the issuer id is empty and the internal id is unknown', async () => {
    const screen = await openEditDialogForItem({ external_id: '  ', id: 'mi-no-issuer', identifier_issuer_id: '', internal_id: 'unknown-measurement' });
    await expect.element(screen.getByText('Edit item: mi-no-issuer', { exact: true })).toBeVisible();
  });

  it('names the in-flight save by the item id when the issuer has no name and the internal id is unknown', async () => {
    const { screen } = await renderPage([{ external_id: '  ', id: 'mi-saving', identifier_issuer_id: 'issuer-blank', internal_id: 'unknown-measurement' }]);
    let releaseSave: () => void = () => undefined;
    const saveReleased = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    mockApiRequest('PUT', `${MEASUREMENT_IDENTIFIERS_PATH}/mi-saving`, async (request) => {
      const body = await request.json() as Partial<OmopDbMeasurementIdentifier>;
      await saveReleased;
      return Response.json({ ...body, id: 'mi-saving' });
    });
    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"mi-saving" is being saved...')]));
    releaseSave();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('creates a measurement identifier named by its issuer id when the option lists no longer contain the selected values', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const postBodies = mockMeasurementIdentifierPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-2' }).click();

    let issuersRequestCount = 0;
    let measurementsRequestCount = 0;
    mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => {
      issuersRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Measurements', () => {
      measurementsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.MEASUREMENTS) });
    await expect.poll(() => issuersRequestCount).toBe(1);
    await expect.poll(() => measurementsRequestCount).toBe(1);

    await screen.getByRole('textbox', { name: 'External ID' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ external_id: '   ', identifier_issuer_id: 'issuer-2', internal_id: 'measurement-2' });
    // The progress notification is named from the form values while the POST is held; the unknown internal id is skipped in favour of the issuer id.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"issuer-2" is being saved...')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
