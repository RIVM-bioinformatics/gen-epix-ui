import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbProvider,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ProvidersAdminPage } from './ProvidersAdminPage';

type ProviderFixture = { readonly id: string } & OmopDbProvider;
type ProvidersScreen = Awaited<ReturnType<typeof renderPage>>['screen'];

const PROVIDERS_PATH = '/v1/Providers';
const ROUTE_PATH = '/management/providers';
const URL = '/management/providers';

const PROVIDER_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

/**
 * Builds a provider with every field unset, so that individual tests only override the fields under test.
 */
const buildProviderFixture = (providerId: string, overrides: Partial<ProviderFixture> = {}): ProviderFixture => {
  return {
    care_site_id: null,
    dea: null,
    gender_concept_id: null,
    gender_source_concept_id: null,
    gender_source_value: null,
    id: providerId,
    npi: null,
    provider_id: providerId,
    provider_name: null,
    provider_source_value: null,
    specialty_concept_id: null,
    specialty_source_concept_id: null,
    specialty_source_value: null,
    year_of_birth: 1975,
    ...overrides,
  };
};

const providerAlphaFixture = buildProviderFixture('provider-alpha', {
  care_site_id: 'care-site-1',
  dea: 'DEA-ALPHA',
  gender_concept_id: 'concept-female',
  npi: '1234567890',
  provider_name: 'Provider Alpha',
  specialty_concept_id: 'concept-cardiology',
});

const providerBetaFixture = buildProviderFixture('provider-beta', {
  gender_concept_id: 'concept-male',
  provider_name: 'Provider Beta',
  year_of_birth: 1990,
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `provider_id`.
 * The page maps the created item to a table row by `provider_id`, so the API response must include it.
 */
const mockProviderPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', PROVIDERS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbProvider>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-provider', provider_id: 'created-provider' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-female', concept_name: 'Female' },
    { concept_id: 'concept-male', concept_name: 'Male' },
    { concept_id: 'concept-cardiology', concept_name: 'Cardiology' },
  ]));
  mockApiRequest('GET', '/v1/CareSites', () => Response.json([{ care_site_id: 'care-site-1', care_site_name: 'Care Site One' }]));
};

const renderPage = async (initialItems: ProviderFixture[] = [providerAlphaFixture, providerBetaFixture], permissions = PROVIDER_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(PROVIDERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ProvidersAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: ProvidersScreen) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForItem = async (item: ProviderFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

const selectOption = async (screen: ProvidersScreen, comboboxName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: comboboxName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

describe('ProvidersAdminPage', () => {
  it('lists the providers from the providers endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DEA-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Female' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Cardiology' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Care Site One' })).toBeInTheDocument();
  });

  it('creates a provider via the providers endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProviderPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new provider', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provider Name' }).fill('Provider New');
    await screen.getByRole('textbox', { exact: true, name: 'Npi' }).fill('9876543210');
    await screen.getByRole('textbox', { exact: true, name: 'Year Of Birth' }).fill('1985');
    await selectOption(screen, 'Care Site ID', 'Care Site One');
    await selectOption(screen, 'Gender Concept ID', 'Female');
    await selectOption(screen, 'Specialty Concept ID', 'Cardiology');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    const postBody = postBodies[0] as Record<string, unknown>;
    expect(postBody.provider_name).toBe('Provider New');
    expect(postBody.npi).toBe('9876543210');
    expect(Number(postBody.year_of_birth)).toBe(1985);
    expect(postBody.care_site_id).toBe('care-site-1');
    expect(postBody.gender_concept_id).toBe('concept-female');
    expect(postBody.specialty_concept_id).toBe('concept-cardiology');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Provider New')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved provider without any name fields as new while the create request is pending', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    mockProviderPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New provider')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a provider via the providers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Provider Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Dea' }).fill('DEA-RENAMED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROVIDERS_PATH}/provider-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ dea: 'DEA-RENAMED', provider_id: 'provider-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a provider via the providers endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PROVIDERS_PATH}/provider-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([providerAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a provider by its provider name', async () => {
    const screen = await openEditDialogForItem(providerAlphaFixture);
    await expect.element(screen.getByText('Edit item: Provider Alpha', { exact: true })).toBeVisible();
  });

  it('names a provider by its numeric provider name', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-number-name', { provider_name: 5 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a provider by its provider source value when the provider name is blank', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-source', { provider_name: '   ', provider_source_value: 'Source Gamma' }));
    await expect.element(screen.getByText('Edit item: Source Gamma', { exact: true })).toBeVisible();
  });

  it('names a provider by its numeric provider source value when the provider name is missing', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-number-source', { provider_source_value: 6 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 6', { exact: true })).toBeVisible();
  });

  it('names a provider by its specialty source value when the provider and provider source values are blank', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-specialty', { provider_source_value: '  ', specialty_source_value: 'Specialty Delta' }));
    await expect.element(screen.getByText('Edit item: Specialty Delta', { exact: true })).toBeVisible();
  });

  it('names a provider by its numeric specialty source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-number-specialty', { specialty_source_value: 7 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a provider by its gender source value when the other source values are blank', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-gender', { gender_source_value: 'Gender Epsilon', specialty_source_value: '' }));
    await expect.element(screen.getByText('Edit item: Gender Epsilon', { exact: true })).toBeVisible();
  });

  it('names a provider by its numeric gender source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-number-gender', { gender_source_value: 8 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a provider by its id when none of the name or source values are set', async () => {
    const screen = await openEditDialogForItem(buildProviderFixture('provider-no-names', { gender_source_value: '  ' }));
    await expect.element(screen.getByText('Edit item: provider-no-names', { exact: true })).toBeVisible();
  });
});
