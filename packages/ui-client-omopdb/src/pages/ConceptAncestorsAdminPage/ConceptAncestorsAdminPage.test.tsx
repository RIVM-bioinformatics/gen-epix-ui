import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConceptAncestor,
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

import { ConceptAncestorsAdminPage } from './ConceptAncestorsAdminPage';

type ConceptAncestorFixture = { readonly id: string } & OmopDbConceptAncestor;

const CONCEPT_ANCESTORS_PATH = '/v1/ConceptAncestors';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/concept-ancestors';
const URL = '/management/concept-ancestors';

const CONCEPT_ANCESTOR_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConceptAncestorCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConceptAncestorCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConceptAncestorCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conceptAncestorAlphaFixture: ConceptAncestorFixture = {
  ancestor_concept_id: 'concept-1',
  concept_ancestor_id: 'ancestor-alpha',
  descendant_concept_id: 'concept-2',
  id: 'ancestor-alpha',
  max_levels_of_separation: 5,
  min_levels_of_separation: 1,
};

const conceptAncestorBetaFixture: ConceptAncestorFixture = {
  ancestor_concept_id: 'concept-2',
  concept_ancestor_id: 'ancestor-beta',
  descendant_concept_id: 'concept-1',
  id: 'ancestor-beta',
  max_levels_of_separation: 7,
  min_levels_of_separation: 2,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `concept_ancestor_id`.
 * The page maps the created item to a table row by `concept_ancestor_id`, so the API response must include it.
 */
const mockConceptAncestorPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONCEPT_ANCESTORS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConceptAncestor>;
    postBodies.push(body);
    return Response.json({ ...body, concept_ancestor_id: 'created-ancestor', id: 'created-ancestor' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: 'Concept Two' },
    { concept_id: 'concept-3', concept_name: '   ' },
  ]));
};

const renderPage = async (initialItems: ConceptAncestorFixture[] = [conceptAncestorAlphaFixture, conceptAncestorBetaFixture], permissions = CONCEPT_ANCESTOR_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONCEPT_ANCESTORS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptAncestorsAdminPage />, {
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

const openEditDialogForItem = async (item: ConceptAncestorFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConceptAncestorsAdminPage', () => {
  it('lists the concept ancestors with their ancestor and descendant concept labels', async () => {
    const { screen } = await renderPage([conceptAncestorAlphaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept Two' })).toBeInTheDocument();
  });

  it('creates a concept ancestor via the concept ancestors endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockConceptAncestorPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept ancestor', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Ancestor Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { name: 'Descendant Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('spinbutton', { name: 'Min Levels Of Separation' }).fill('3');
    await screen.getByRole('spinbutton', { name: 'Max Levels Of Separation' }).fill('4');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      ancestor_concept_id: 'concept-1',
      descendant_concept_id: 'concept-2',
      max_levels_of_separation: 4,
      min_levels_of_separation: 3,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept ancestor via the concept ancestors endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
    await screen.getByRole('spinbutton', { name: 'Max Levels Of Separation' }).fill('9');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_ANCESTORS_PATH}/ancestor-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ concept_ancestor_id: 'ancestor-alpha', max_levels_of_separation: 9 }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept ancestor via the concept ancestors endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_ANCESTORS_PATH}/ancestor-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([conceptAncestorAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a concept ancestor by the label of its ancestor concept', async () => {
    const screen = await openEditDialogForItem(conceptAncestorAlphaFixture);
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a concept ancestor by the label of its descendant concept when the ancestor concept id is empty', async () => {
    const screen = await openEditDialogForItem({ ...conceptAncestorAlphaFixture, ancestor_concept_id: '' });
    await expect.element(screen.getByText('Edit item: Concept Two', { exact: true })).toBeVisible();
  });

  it('names a concept ancestor by the label of its descendant concept when the ancestor concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...conceptAncestorAlphaFixture, ancestor_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: Concept Two', { exact: true })).toBeVisible();
  });

  it('names a concept ancestor by its id when the ancestor concept id is empty and the descendant concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...conceptAncestorAlphaFixture,
      ancestor_concept_id: '',
      descendant_concept_id: 'concept-unknown',
    });
    await expect.element(screen.getByText('Edit item: ancestor-alpha', { exact: true })).toBeVisible();
  });

  it('names a concept ancestor by its id when both concept ids are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...conceptAncestorAlphaFixture,
      ancestor_concept_id: 'concept-unknown',
      descendant_concept_id: 'concept-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: ancestor-alpha', { exact: true })).toBeVisible();
  });

  it('names an unsaved concept ancestor by its ancestor concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    const postBodies: unknown[] = [];
    mockApiRequest('POST', CONCEPT_ANCESTORS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ detail: 'Rejected' }, { status: 400 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Ancestor Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { name: 'Descendant Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('spinbutton', { name: 'Min Levels Of Separation' }).fill('3');
    await screen.getByRole('spinbutton', { name: 'Max Levels Of Separation' }).fill('4');

    let conceptRequestCount = 0;
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ ancestor_concept_id: 'concept-1', descendant_concept_id: 'concept-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-1" could not be created.')]));
  });

  it('names a concept ancestor by its id when both concept ids are empty', async () => {
    const screen = await openEditDialogForItem({
      ...conceptAncestorAlphaFixture,
      ancestor_concept_id: '',
      descendant_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: ancestor-alpha', { exact: true })).toBeVisible();
  });
});
