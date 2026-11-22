import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConceptSynonym,
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

import { ConceptSynonymsAdminPage } from './ConceptSynonymsAdminPage';

type ConceptSynonymFixture = { readonly id: string } & OmopDbConceptSynonym;

const CONCEPT_SYNONYMS_PATH = '/v1/ConceptSynonyms';
const ROUTE_PATH = '/management/concept-synonyms';
const URL = '/management/concept-synonyms';

const CONCEPT_SYNONYM_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConceptSynonymCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConceptSynonymCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConceptSynonymCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conceptSynonymAlphaFixture: ConceptSynonymFixture = {
  concept_id: 'concept-1',
  concept_synonym_id: 'synonym-alpha',
  concept_synonym_name: 'Alpha',
  id: 'synonym-alpha',
  language_concept_id: 'concept-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `concept_synonym_id`.
 * The page maps the created item to a table row by `concept_synonym_id`, so the API response must include it.
 */
const mockConceptSynonymPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONCEPT_SYNONYMS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConceptSynonym>;
    postBodies.push(body);
    return Response.json({ ...body, concept_synonym_id: 'created-synonym', id: 'created-synonym' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: 'Outpatient' },
  ]));
};

const renderPage = async (initialItems: ConceptSynonymFixture[] = [conceptSynonymAlphaFixture], permissions = CONCEPT_SYNONYM_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONCEPT_SYNONYMS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptSynonymsAdminPage />, {
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

const openEditDialogForItem = async (item: Partial<ConceptSynonymFixture>) => {
  const { screen } = await renderPage([item as ConceptSynonymFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConceptSynonymsAdminPage', () => {
  it('lists the concept synonyms with option labels for the concept and language concept', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outpatient' })).toBeInTheDocument();
  });

  it('creates a concept synonym via the concept synonyms endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockConceptSynonymPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept synonym', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('textbox', { name: 'Concept Synonym Name' }).fill('Gamma');
    await screen.getByRole('combobox', { name: 'Language Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ concept_id: 'concept-1', concept_synonym_name: 'Gamma', language_concept_id: 'concept-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept synonym via the concept synonyms endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Concept Synonym Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_SYNONYMS_PATH}/synonym-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ concept_id: 'concept-1', concept_synonym_id: 'synonym-alpha', concept_synonym_name: 'Alpha renamed', language_concept_id: 'concept-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept synonym via the concept synonyms endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_SYNONYMS_PATH}/synonym-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([conceptSynonymAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a concept synonym by its concept synonym name', async () => {
    const screen = await openEditDialogForItem(conceptSynonymAlphaFixture);
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
  });

  it('names a concept synonym by its numeric concept synonym name', async () => {
    const screen = await openEditDialogForItem({ concept_synonym_id: 'synonym-number', concept_synonym_name: 5 as unknown as string, id: 'synonym-number' });
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a concept synonym by the label of its matching concept when the name is blank', async () => {
    const screen = await openEditDialogForItem({ concept_id: 'concept-1', concept_synonym_id: 'synonym-concept', concept_synonym_name: '   ', id: 'synonym-concept' });
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a concept synonym by the label of its matching language concept when the concept is not known', async () => {
    const screen = await openEditDialogForItem({ concept_id: 'concept-unknown', concept_synonym_id: 'synonym-language', id: 'synonym-language', language_concept_id: 'concept-2' });
    await expect.element(screen.getByText('Edit item: Outpatient', { exact: true })).toBeVisible();
  });

  it('names a concept synonym by its id when the language concept is not known', async () => {
    const screen = await openEditDialogForItem({ concept_synonym_id: 'synonym-unknown-language', id: 'synonym-unknown-language', language_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: synonym-unknown-language', { exact: true })).toBeVisible();
  });

  it('names a concept synonym by its id when both concepts are not known', async () => {
    const screen = await openEditDialogForItem({ concept_id: 'concept-unknown', concept_synonym_id: 'synonym-unknown-both', id: 'synonym-unknown-both', language_concept_id: 'concept-unknown-2' });
    await expect.element(screen.getByText('Edit item: synonym-unknown-both', { exact: true })).toBeVisible();
  });

  it('names an unsaved concept synonym by its selected concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage([]);
    mockApiRequest('POST', CONCEPT_SYNONYMS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { name: 'Language Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();

    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('textbox', { name: 'Concept Synonym Name' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Concept Synonym "concept-1" could not be created.')]));
  });

  it('names a concept synonym by its id when the concept id is empty', async () => {
    const screen = await openEditDialogForItem({ concept_id: '', concept_synonym_id: 'synonym-empty-concept', id: 'synonym-empty-concept' });
    await expect.element(screen.getByText('Edit item: synonym-empty-concept', { exact: true })).toBeVisible();
  });
});
