import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDrugExposureIdentifier,
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

import { DrugExposureIdentifiersAdminPage } from './DrugExposureIdentifiersAdminPage';

type IdentifierFixture = { readonly id: string } & OmopDbDrugExposureIdentifier;

const IDENTIFIERS_PATH = '/v1/drug_exposure_identifiers';
const ISSUERS_PATH = '/v1/identifier_issuers';
const DRUG_EXPOSURES_PATH = '/v1/DrugExposures';
const ROUTE_PATH = '/management/drug-exposure-identifiers';
const URL = '/management/drug-exposure-identifiers';

const IDENTIFIER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DrugExposureIdentifierCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DrugExposureIdentifierCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DrugExposureIdentifierCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const identifierAlphaFixture: IdentifierFixture = {
  external_id: 'ext-alpha',
  id: 'dei-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'drug-exposure-1',
};

const identifierBetaFixture: IdentifierFixture = {
  external_id: 'ext-beta',
  id: 'dei-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'drug-exposure-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', ISSUERS_PATH, () => Response.json([
    { id: 'issuer-1', name: 'Issuer One' },
    { id: 'issuer-2', name: 'Issuer Two' },
  ]));
  mockApiRequest('GET', DRUG_EXPOSURES_PATH, () => Response.json([
    { drug_exposure_id: 'drug-exposure-1' },
    { drug_exposure_id: 'drug-exposure-2' },
  ]));
};

const renderPage = async (initialItems: IdentifierFixture[] = [identifierAlphaFixture, identifierBetaFixture], permissions = IDENTIFIER_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DrugExposureIdentifiersAdminPage />, {
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

const openEditDialogForItem = async (item: IdentifierFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

const mockIdentifierPost = (responseGate: Promise<void>) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', IDENTIFIERS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDrugExposureIdentifier>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-dei' }, { status: 201 });
  });
  return postBodies;
};

describe('DrugExposureIdentifiersAdminPage', () => {
  it('lists the identifiers with the issuer name, external id and drug exposure', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'ext-alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'drug-exposure-1' })).toBeInTheDocument();
  });

  it('creates an identifier via the drug exposure identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new drug exposure identifier', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('ext-gamma');
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { name: 'Issuer Two' }).click();
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { name: 'drug-exposure-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(IDENTIFIERS_PATH);
    expect(postCall?.body).toEqual({ external_id: 'ext-gamma', identifier_issuer_id: 'issuer-2', internal_id: 'drug-exposure-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an identifier via the drug exposure identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('ext-renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${IDENTIFIERS_PATH}/dei-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ external_id: 'ext-renamed', id: 'dei-alpha', identifier_issuer_id: 'issuer-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an identifier via the drug exposure identifiers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${IDENTIFIERS_PATH}/dei-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([identifierAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ext-alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an identifier by the label of its identifier issuer', async () => {
    const screen = await openEditDialogForItem(identifierAlphaFixture);
    await expect.element(screen.getByText('Edit item: Issuer One', { exact: true })).toBeVisible();
  });

  it('names an identifier by the label of its drug exposure when the issuer is unknown', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, id: 'dei-unknown-issuer', identifier_issuer_id: 'issuer-unknown' });
    await expect.element(screen.getByText('Edit item: drug-exposure-1', { exact: true })).toBeVisible();
  });

  it('names an identifier by the label of its drug exposure when the issuer is blank', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, id: 'dei-blank-issuer', identifier_issuer_id: '' });
    await expect.element(screen.getByText('Edit item: drug-exposure-1', { exact: true })).toBeVisible();
  });

  it('names an identifier by its id when the drug exposure is unknown and the external id is blank', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, external_id: '', id: 'dei-unknown-drug', identifier_issuer_id: '', internal_id: 'drug-exposure-unknown' });
    await expect.element(screen.getByText('Edit item: dei-unknown-drug', { exact: true })).toBeVisible();
  });

  it('names an identifier by its external id when the issuer and drug exposure are unknown', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, external_id: 'ext-only', id: 'dei-ext', identifier_issuer_id: 'issuer-unknown', internal_id: 'drug-exposure-unknown' });
    await expect.element(screen.getByText('Edit item: ext-only', { exact: true })).toBeVisible();
  });

  it('names an identifier by its numeric external id', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, external_id: 42 as unknown as string, id: 'dei-number', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names an identifier by its id when the external id is blank', async () => {
    const screen = await openEditDialogForItem({ ...identifierAlphaFixture, external_id: '   ', id: 'dei-blank-ext', identifier_issuer_id: '', internal_id: '' });
    await expect.element(screen.getByText('Edit item: dei-blank-ext', { exact: true })).toBeVisible();
  });

  it('names an identifier by its identifier issuer id when the selected options are gone from the refetched options', async () => {
    const { screen } = await renderPage();
    let issuerRequestCount = 0;
    let drugExposureRequestCount = 0;
    mockApiRequest('GET', ISSUERS_PATH, () => {
      issuerRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', DRUG_EXPOSURES_PATH, () => {
      drugExposureRequestCount += 1;
      return Response.json([]);
    });
    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'External ID' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Identifier Issuer ID' }).click();
    await screen.getByRole('option', { name: 'Issuer Two' }).click();
    await screen.getByRole('combobox', { name: 'Internal ID' }).click();
    await screen.getByRole('option', { name: 'drug-exposure-2' }).click();
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.DRUG_EXPOSURES) });
    await expect.poll(() => issuerRequestCount).toBe(1);
    await expect.poll(() => drugExposureRequestCount).toBe(1);

    let releasePost: () => void = () => undefined;
    const postBodies = mockIdentifierPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ external_id: '   ', identifier_issuer_id: 'issuer-2', internal_id: 'drug-exposure-2' });
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"issuer-2"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
