import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConceptRelationship,
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

import { ConceptRelationshipsAdminPage } from './ConceptRelationshipsAdminPage';

type ConceptRelationshipFixture = { readonly id: string } & OmopDbConceptRelationship;

const CONCEPT_RELATIONSHIPS_PATH = '/v1/ConceptRelationships';
const ROUTE_PATH = '/management/concept-relationships';
const URL = '/management/concept-relationships';

const CONCEPT_RELATIONSHIP_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConceptRelationshipCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConceptRelationshipCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConceptRelationshipCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conceptRelationshipAlphaFixture: ConceptRelationshipFixture = {
  concept_id_1: 'concept-1',
  concept_id_2: 'concept-2',
  concept_relationship_id: 'relationship-alpha',
  id: 'relationship-alpha',
  invalid_reason: '',
  relationship_id: 'relationship-1',
  valid_end_date: '2030-01-01',
  valid_start_date: '2020-01-01',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `concept_relationship_id`.
 * The page maps the created item to a table row by `concept_relationship_id`, so the API response must include it.
 */
const mockConceptRelationshipPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONCEPT_RELATIONSHIPS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConceptRelationship>;
    postBodies.push(body);
    return Response.json({ ...body, concept_relationship_id: 'created-relationship', id: 'created-relationship' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: 'Outpatient' },
  ]));
  mockApiRequest('GET', '/v1/Relationships', () => Response.json([
    { relationship_id: 'relationship-1', relationship_name: 'Is a' },
  ]));
};

const renderPage = async (initialItems: ConceptRelationshipFixture[] = [conceptRelationshipAlphaFixture], permissions = CONCEPT_RELATIONSHIP_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONCEPT_RELATIONSHIPS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptRelationshipsAdminPage />, {
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

const fillDate = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, [year, month, day]: [string, string, string]) => {
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { exact: true, name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Day' }).fill(day);
};

const openEditDialogForItem = async (item: Partial<ConceptRelationshipFixture>) => {
  const { screen } = await renderPage([item as ConceptRelationshipFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConceptRelationshipsAdminPage', () => {
  it('lists the concept relationships with option labels for the concepts and relationship', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Is a' })).toBeInTheDocument();
  });

  it('creates a concept relationship via the concept relationships endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockConceptRelationshipPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept relationship', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Concept ID 1' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Concept ID 2' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Relationship ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Is a' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ concept_id_1: 'concept-1', concept_id_2: 'concept-2', relationship_id: 'relationship-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a created concept relationship by its numeric valid start date when the response has no concept or relationship', async () => {
    const { screen } = await renderPage([]);
    mockApiRequest('POST', CONCEPT_RELATIONSHIPS_PATH, () => Response.json({ concept_id_1: '', concept_id_2: '', concept_relationship_id: 'created-relationship', id: 'created-relationship', relationship_id: '', valid_start_date: 20210505 }, { status: 201 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Concept ID 1' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Concept ID 2' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Relationship ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Is a' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"20210505" has been created.')]));
  });

  it('edits a concept relationship via the concept relationships endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Invalid Reason' }).fill('Obsolete');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_RELATIONSHIPS_PATH}/relationship-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ concept_id_1: 'concept-1', concept_id_2: 'concept-2', concept_relationship_id: 'relationship-alpha', invalid_reason: 'Obsolete', relationship_id: 'relationship-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept relationship via the concept relationships endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_RELATIONSHIPS_PATH}/relationship-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([conceptRelationshipAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a concept relationship by the label of its first concept when known', async () => {
    const screen = await openEditDialogForItem(conceptRelationshipAlphaFixture);
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by the label of its second concept when the first is not known', async () => {
    const screen = await openEditDialogForItem({ ...conceptRelationshipAlphaFixture, concept_id_1: 'concept-unknown', concept_relationship_id: 'relationship-second', id: 'relationship-second' });
    await expect.element(screen.getByText('Edit item: Outpatient', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by the label of its relationship when the concepts are not known', async () => {
    const screen = await openEditDialogForItem({ ...conceptRelationshipAlphaFixture, concept_id_1: 'concept-unknown', concept_id_2: 'concept-unknown-2', concept_relationship_id: 'relationship-third', id: 'relationship-third' });
    await expect.element(screen.getByText('Edit item: Is a', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by the label of its relationship when the first concept id is missing', async () => {
    const screen = await openEditDialogForItem({ ...conceptRelationshipAlphaFixture, concept_id_1: undefined, concept_id_2: 'concept-unknown', concept_relationship_id: 'relationship-no-first', id: 'relationship-no-first' });
    await expect.element(screen.getByText('Edit item: Is a', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by its valid start date when no option label matches', async () => {
    const screen = await openEditDialogForItem({ concept_id_1: 'concept-unknown', concept_id_2: 'concept-unknown-2', concept_relationship_id: 'relationship-date', id: 'relationship-date', relationship_id: 'relationship-unknown', valid_start_date: '2021-05-05' });
    await expect.element(screen.getByText('Edit item: 2021-05-05', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by its id when no option label or start date is available', async () => {
    const screen = await openEditDialogForItem({ concept_id_1: 'concept-unknown', concept_id_2: '', concept_relationship_id: 'relationship-id-only', id: 'relationship-id-only', relationship_id: 'relationship-unknown', valid_start_date: undefined });
    await expect.element(screen.getByText('Edit item: relationship-id-only', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by its id when only the relationship id is unknown', async () => {
    const screen = await openEditDialogForItem({ concept_id_1: '', concept_id_2: '', concept_relationship_id: 'relationship-rel-only', id: 'relationship-rel-only', relationship_id: 'relationship-unknown', valid_start_date: undefined });
    await expect.element(screen.getByText('Edit item: relationship-rel-only', { exact: true })).toBeVisible();
  });

  it('names a concept relationship by its id when the concept ids are empty and the second concept is not known', async () => {
    const screen = await openEditDialogForItem({ concept_id_1: '', concept_id_2: 'concept-unknown', concept_relationship_id: 'relationship-empty', id: 'relationship-empty', relationship_id: '', valid_start_date: '' });
    await expect.element(screen.getByText('Edit item: relationship-empty', { exact: true })).toBeVisible();
  });
});
