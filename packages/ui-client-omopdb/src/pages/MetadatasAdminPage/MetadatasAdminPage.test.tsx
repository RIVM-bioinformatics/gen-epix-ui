import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbMetadata,
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
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { MetadatasAdminPage } from './MetadatasAdminPage';

type MetadataFixture = { readonly id: string } & OmopDbMetadata;

const METADATAS_PATH = '/v1/Metadatas';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/metadatas';
const URL = '/management/metadatas';

const METADATA_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.MetadataCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.MetadataCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.MetadataCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const metadataAlphaFixture: MetadataFixture = {
  id: 'metadata-alpha',
  metadata_concept_id: 'concept-1',
  metadata_date: '2024-01-02',
  metadata_datetime: null,
  metadata_id: 'metadata-alpha',
  metadata_type_concept_id: 'concept-2',
  name: 'Metadata Alpha',
  value_as_concept_id: null,
  value_as_number: 3.5,
  value_as_string: 'Value Alpha',
};

const metadataBetaFixture: MetadataFixture = {
  id: 'metadata-beta',
  metadata_concept_id: 'concept-2',
  metadata_date: null,
  metadata_datetime: '2024-02-03T04:05:06',
  metadata_id: 'metadata-beta',
  metadata_type_concept_id: 'concept-1',
  name: 'Metadata Beta',
  value_as_concept_id: 'concept-1',
  value_as_number: null,
  value_as_string: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockOrganizations();
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `metadata_id`.
 * The page maps the created item to a table row by `metadata_id`, so the API response must include it.
 */
const mockMetadataPost = (calls: ReturnType<typeof mockCrudApi>['calls']) => {
  mockApiRequest('POST', METADATAS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbMetadata>;
    calls.push({ body, method: 'POST', pathname: METADATAS_PATH });
    return Response.json({ ...body, id: 'created-metadata', metadata_id: 'created-metadata' }, { status: 201 });
  });
};

const renderPage = async (
  initialItems: MetadataFixture[] = [metadataAlphaFixture, metadataBetaFixture],
  permissions = METADATA_PERMISSIONS,
) => {
  mockReferenceData();
  const mock = mockCrudApi(METADATAS_PATH, initialItems);
  mockMetadataPost(mock.calls);
  const screen = await renderRoutedPage(
    <MetadatasAdminPage />, {
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

const openEditDialogForItem = async (item: MetadataFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('MetadatasAdminPage', () => {
  it('lists the metadatas with the name and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Metadata Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Metadata Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Value Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' }).first()).toBeInTheDocument();
  });

  it('names a metadata by its name when the name is a number', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-number',
      metadata_id: 'metadata-number',
      name: 7 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a metadata by its metadata concept label when the name is blank', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-blank-name',
      metadata_id: 'metadata-blank-name',
      name: '   ',
    });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a metadata by its type concept label when the name and metadata concept are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-type-label',
      metadata_concept_id: 'concept-unknown',
      metadata_id: 'metadata-type-label',
      metadata_type_concept_id: 'concept-1',
      name: '',
    });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a metadata by its value concept label when only the value concept is known', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-value-label',
      metadata_concept_id: null,
      metadata_id: 'metadata-value-label',
      metadata_type_concept_id: 'type-unknown',
      name: '',
      value_as_concept_id: 'concept-1',
    });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a metadata by its id when all concept ids are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-unknown-concepts',
      metadata_concept_id: 'concept-unknown',
      metadata_id: 'metadata-unknown-concepts',
      metadata_type_concept_id: 'type-unknown',
      name: '',
      value_as_concept_id: 'value-unknown',
    });
    await expect.element(screen.getByText('Edit item: metadata-unknown-concepts', { exact: true })).toBeVisible();
  });

  it('names a metadata by its id when the concept ids are blank or null', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-blank-concepts',
      metadata_concept_id: '',
      metadata_id: 'metadata-blank-concepts',
      metadata_type_concept_id: null,
      name: '',
      value_as_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: metadata-blank-concepts', { exact: true })).toBeVisible();
  });

  it('names a metadata by its id when only an unknown value concept is set', async () => {
    const screen = await openEditDialogForItem({
      ...metadataAlphaFixture,
      id: 'metadata-unknown-value',
      metadata_concept_id: '',
      metadata_id: 'metadata-unknown-value',
      metadata_type_concept_id: null,
      name: '',
      value_as_concept_id: 'value-unknown',
    });
    await expect.element(screen.getByText('Edit item: metadata-unknown-value', { exact: true })).toBeVisible();
  });

  it('creates a metadata via the metadatas endpoint', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new metadata', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Created metadata');
    await screen.getByRole('combobox', { exact: true, name: 'Metadata Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Metadata Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Value As String' }).fill('Created value');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(METADATAS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      metadata_concept_id: 'concept-1',
      metadata_type_concept_id: 'concept-2',
      name: 'Created metadata',
      value_as_string: 'Created value',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a metadata via the metadatas endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Metadata Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Metadata Alpha Edited');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${METADATAS_PATH}/metadata-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      metadata_concept_id: 'concept-1',
      metadata_id: 'metadata-alpha',
      name: 'Metadata Alpha Edited',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a metadata via the metadatas endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Metadata Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${METADATAS_PATH}/metadata-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([metadataAlphaFixture], []);

    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('rejects a whitespace-only name without posting', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Only digits, letters (including diacritics) and punctuation marks are allowed.').first()).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });
});
