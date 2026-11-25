import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConceptClass,
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

import { ConceptClassesAdminPage } from './ConceptClassesAdminPage';

type ConceptClassFixture = { readonly id: string } & OmopDbConceptClass;

const CONCEPT_CLASSES_PATH = '/v1/ConceptClasss';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/concept-classes';
const URL = '/management/concept-classes';

const CONCEPT_CLASS_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConceptClassCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConceptClassCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConceptClassCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conceptClassAlphaFixture: ConceptClassFixture = {
  concept_class_concept_id: 'concept-1',
  concept_class_id: 'class-alpha',
  concept_class_name: 'Class Alpha',
  concept_class_str_id: 'alpha-str',
  id: 'class-alpha',
};

const conceptClassBetaFixture: ConceptClassFixture = {
  concept_class_concept_id: 'concept-2',
  concept_class_id: 'class-beta',
  concept_class_name: 'Class Beta',
  concept_class_str_id: 'beta-str',
  id: 'class-beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `concept_class_id`.
 * The page maps the created item to a table row by `concept_class_id`, so the API response must include it.
 */
const mockConceptClassPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONCEPT_CLASSES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConceptClass>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, concept_class_id: 'created-class', id: 'created-class' }, { status: 201 });
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

const renderPage = async (initialItems: ConceptClassFixture[] = [conceptClassAlphaFixture, conceptClassBetaFixture], permissions = CONCEPT_CLASS_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONCEPT_CLASSES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptClassesAdminPage />, {
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

const openEditDialogForItem = async (item: ConceptClassFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConceptClassesAdminPage', () => {
  it('lists the concept classes with their name, str id and concept label', async () => {
    const { screen } = await renderPage([conceptClassAlphaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Class Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'alpha-str' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
  });

  it('creates a concept class via the concept classes endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockConceptClassPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept class', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Concept Class Str ID' }).fill('gamma-str');
    await screen.getByRole('textbox', { name: 'Concept Class Name' }).fill('Class Gamma');
    await screen.getByRole('combobox', { name: 'Concept Class Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      concept_class_concept_id: 'concept-1',
      concept_class_name: 'Class Gamma',
      concept_class_str_id: 'gamma-str',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept class via the concept classes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Class Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Concept Class Name' }).fill('Class Alpha Renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_CLASSES_PATH}/class-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ concept_class_id: 'class-alpha', concept_class_name: 'Class Alpha Renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept class via the concept classes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_CLASSES_PATH}/class-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([conceptClassAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Class Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a concept class by its name', async () => {
    const screen = await openEditDialogForItem(conceptClassAlphaFixture);
    await expect.element(screen.getByText('Edit item: Class Alpha', { exact: true })).toBeVisible();
  });

  it('names a concept class by its str id when the name is blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptClassAlphaFixture, concept_class_name: '   ' });
    await expect.element(screen.getByText('Edit item: alpha-str', { exact: true })).toBeVisible();
  });

  it('names a concept class by its numeric name', async () => {
    const screen = await openEditDialogForItem({ ...conceptClassAlphaFixture, concept_class_name: 42 } as unknown as ConceptClassFixture);
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a concept class by its numeric str id when the name is blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptClassAlphaFixture, concept_class_name: '', concept_class_str_id: 7 } as unknown as ConceptClassFixture);
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a concept class by the label of its concept when the name and str id are blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptClassAlphaFixture, concept_class_name: '', concept_class_str_id: ' ' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a concept class by its id when the name and str id are blank and the concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...conceptClassAlphaFixture,
      concept_class_concept_id: 'concept-unknown',
      concept_class_name: '',
      concept_class_str_id: '',
    });
    await expect.element(screen.getByText('Edit item: class-alpha', { exact: true })).toBeVisible();
  });

  it('names a concept class by its id when the name, str id and concept id are blank', async () => {
    const screen = await openEditDialogForItem({
      ...conceptClassAlphaFixture,
      concept_class_concept_id: '',
      concept_class_name: '',
      concept_class_str_id: '',
    });
    await expect.element(screen.getByText('Edit item: class-alpha', { exact: true })).toBeVisible();
  });

  it('names an unsaved concept class by its selected concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const postBodies = mockConceptClassPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Concept Class Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();

    let conceptRequestCount = 0;
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('textbox', { name: 'Concept Class Str ID' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Concept Class Name' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ concept_class_concept_id: 'concept-1' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Concept Class "concept-1" is being saved...')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
