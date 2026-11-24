import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbFactRelationship,
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

import { FactRelationshipsAdminPage } from './FactRelationshipsAdminPage';

type FactRelationshipFixture = { readonly id: string } & OmopDbFactRelationship;

const FACT_RELATIONSHIPS_PATH = '/v1/FactRelationships';
const ROUTE_PATH = '/management/fact-relationships';
const URL = '/management/fact-relationships';

const FACT_RELATIONSHIP_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.FactRelationshipCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.FactRelationshipCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.FactRelationshipCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const factRelationshipAlphaFixture: FactRelationshipFixture = {
  domain_concept_id_1: 'domain-alpha-1',
  domain_concept_id_2: 'domain-alpha-2',
  fact_id_1: 10,
  fact_id_2: 20,
  fact_relationship_id: 'fact-relationship-alpha',
  id: 'fact-relationship-alpha',
  relationship_concept_id: 'concept-1',
};

const factRelationshipBetaFixture: FactRelationshipFixture = {
  domain_concept_id_1: 'domain-beta-1',
  domain_concept_id_2: 'domain-beta-2',
  fact_id_1: 30,
  fact_id_2: 40,
  fact_relationship_id: 'fact-relationship-beta',
  id: 'fact-relationship-beta',
  relationship_concept_id: 'concept-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `fact_relationship_id`.
 * The page maps the created item to a table row by `fact_relationship_id`, so the API response must include it.
 */
const mockFactRelationshipPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', FACT_RELATIONSHIPS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbFactRelationship>;
    postBodies.push(body);
    return Response.json({ ...body, fact_relationship_id: 'created-fact-relationship', id: 'created-fact-relationship' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Visit start' },
    { concept_id: 'concept-2', concept_name: 'Visit end' },
  ]));
};

const renderPage = async (initialItems: FactRelationshipFixture[] = [factRelationshipAlphaFixture, factRelationshipBetaFixture], permissions = FACT_RELATIONSHIP_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(FACT_RELATIONSHIPS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <FactRelationshipsAdminPage />, {
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

const openEditDialogForItem = async (item: FactRelationshipFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('FactRelationshipsAdminPage', () => {
  it('lists the fact relationships from the fact relationships endpoint with domain and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'domain-alpha-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'domain-beta-2' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Visit start' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Visit end' }).first()).toBeInTheDocument();
  });

  it('creates a fact relationship via the fact relationships endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockFactRelationshipPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new fact relationship', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 1' }).fill('domain-new-1');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 1' }).fill('50');
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 2' }).fill('domain-new-2');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 2' }).fill('60');
    await screen.getByRole('combobox', { exact: true, name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit end' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      domain_concept_id_1: 'domain-new-1',
      domain_concept_id_2: 'domain-new-2',
      fact_id_1: 50,
      fact_id_2: 60,
      relationship_concept_id: 'concept-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a fact relationship after its selected relationship concept when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', FACT_RELATIONSHIPS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 1' }).fill('domain-new-1');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 1' }).fill('50');
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 2' }).fill('domain-new-2');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 2' }).fill('60');
    await screen.getByRole('combobox', { exact: true, name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit end' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Fact Relationship "Visit end" could not be created.')]));
  });

  it('names a new fact relationship by its relationship concept id when that concept is missing from the refetched options', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', FACT_RELATIONSHIPS_PATH, () => new Response(null, { status: 500 }));
    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 1' }).fill('   ');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 1' }).fill('50');
    await screen.getByRole('textbox', { exact: true, name: 'Domain Concept ID 2' }).fill('   ');
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 2' }).fill('60');
    await screen.getByRole('combobox', { exact: true, name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Visit end' }).click();
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Fact Relationship "concept-2" could not be created.')]));
  });

  it('edits a fact relationship via the fact relationships endpoint', async () => {
    const { mock, screen } = await renderPage([factRelationshipAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Visit start', { exact: true })).toBeVisible();
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 2' }).fill('21');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${FACT_RELATIONSHIPS_PATH}/fact-relationship-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      domain_concept_id_1: 'domain-alpha-1',
      domain_concept_id_2: 'domain-alpha-2',
      fact_id_1: 10,
      fact_id_2: 21,
      fact_relationship_id: 'fact-relationship-alpha',
      relationship_concept_id: 'concept-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('names a fact relationship after its relationship concept when saving it fails', async () => {
    const { screen } = await renderPage([factRelationshipAlphaFixture]);
    mockApiRequest('PUT', `${FACT_RELATIONSHIPS_PATH}/fact-relationship-alpha`, () => new Response(null, { status: 500 }));

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('spinbutton', { exact: true, name: 'Fact ID 2' }).fill('21');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Fact Relationship "Visit start" could not be saved.')]));
  });

  it('deletes a fact relationship via the fact relationships endpoint', async () => {
    const { mock, screen } = await renderPage([factRelationshipAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${FACT_RELATIONSHIPS_PATH}/fact-relationship-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([factRelationshipAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'domain-alpha-1' }).first()).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a fact relationship by the label of its relationship concept', async () => {
    const screen = await openEditDialogForItem(factRelationshipBetaFixture);
    await expect.element(screen.getByText('Edit item: Visit end', { exact: true })).toBeVisible();
  });

  it('names a fact relationship by its first domain concept when its relationship concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...factRelationshipAlphaFixture, relationship_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: domain-alpha-1', { exact: true })).toBeVisible();
  });

  it('names a fact relationship by its second domain concept when its first domain concept is blank', async () => {
    const screen = await openEditDialogForItem({
      ...factRelationshipAlphaFixture,
      domain_concept_id_1: '   ',
      relationship_concept_id: 'concept-unknown',
    });
    await expect.element(screen.getByText('Edit item: domain-alpha-2', { exact: true })).toBeVisible();
  });

  it('names a fact relationship by its numeric first domain concept', async () => {
    const screen = await openEditDialogForItem({
      ...factRelationshipAlphaFixture,
      domain_concept_id_1: 7 as unknown as string,
      relationship_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a fact relationship by its numeric second domain concept when its first domain concept is blank', async () => {
    const screen = await openEditDialogForItem({
      ...factRelationshipAlphaFixture,
      domain_concept_id_1: '',
      domain_concept_id_2: 8 as unknown as string,
      relationship_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a fact relationship by its id when no other identifying value is set', async () => {
    const screen = await openEditDialogForItem({
      ...factRelationshipAlphaFixture,
      domain_concept_id_1: '',
      domain_concept_id_2: '',
      relationship_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: fact-relationship-alpha', { exact: true })).toBeVisible();
  });
});
