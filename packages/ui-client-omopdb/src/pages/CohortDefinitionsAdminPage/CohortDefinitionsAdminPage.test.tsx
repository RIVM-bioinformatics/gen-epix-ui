import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbCohortDefinition,
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

import { CohortDefinitionsAdminPage } from './CohortDefinitionsAdminPage';

type CohortDefinitionFixture = { readonly id: string } & OmopDbCohortDefinition;

const COHORT_DEFINITIONS_PATH = '/v1/CohortDefinitions';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/cohort-definitions';
const URL = '/management/cohort-definitions';

const COHORT_DEFINITION_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.CohortDefinitionCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.CohortDefinitionCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.CohortDefinitionCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const cohortDefinitionAlphaFixture: CohortDefinitionFixture = {
  cohort_definition_description: 'Description Alpha',
  cohort_definition_id: 'def-alpha',
  cohort_definition_name: 'Definition Alpha',
  cohort_definition_syntax: 'Syntax Alpha',
  cohort_initiation_date: '2024-01-01',
  definition_type_concept_id: 'concept-1',
  id: 'def-alpha',
  subject_concept_id: 'concept-2',
};

const cohortDefinitionBetaFixture: CohortDefinitionFixture = {
  cohort_definition_description: 'Description Beta',
  cohort_definition_id: 'def-beta',
  cohort_definition_name: 'Definition Beta',
  cohort_definition_syntax: 'Syntax Beta',
  cohort_initiation_date: '2024-02-01',
  definition_type_concept_id: 'concept-2',
  id: 'def-beta',
  subject_concept_id: 'concept-1',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `cohort_definition_id`.
 * The page maps the created item to a table row by `cohort_definition_id`, so the API response must include it.
 */
const mockCohortDefinitionPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', COHORT_DEFINITIONS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbCohortDefinition>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, cohort_definition_id: 'created-def', id: 'created-def' }, { status: 201 });
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

const renderPage = async (initialItems: CohortDefinitionFixture[] = [cohortDefinitionAlphaFixture, cohortDefinitionBetaFixture], permissions = COHORT_DEFINITION_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(COHORT_DEFINITIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CohortDefinitionsAdminPage />, {
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

const openEditDialogForItem = async (item: CohortDefinitionFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('CohortDefinitionsAdminPage', () => {
  it('lists the cohort definitions with their name, description and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Description Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept Two' }).first()).toBeInTheDocument();
  });

  it('creates a cohort definition via the cohort definitions endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCohortDefinitionPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new cohort definition', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Cohort Definition Name' }).fill('Definition Gamma');
    await screen.getByRole('textbox', { name: 'Cohort Definition Description' }).fill('Description Gamma');
    await screen.getByRole('textbox', { name: 'Cohort Definition Syntax' }).fill('Syntax Gamma');
    await screen.getByRole('combobox', { name: 'Definition Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { name: 'Subject Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      cohort_definition_description: 'Description Gamma',
      cohort_definition_name: 'Definition Gamma',
      cohort_definition_syntax: 'Syntax Gamma',
      definition_type_concept_id: 'concept-1',
      subject_concept_id: 'concept-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a cohort definition via the cohort definitions endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Definition Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Cohort Definition Description' }).fill('Description renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${COHORT_DEFINITIONS_PATH}/def-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ cohort_definition_description: 'Description renamed', cohort_definition_id: 'def-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a cohort definition via the cohort definitions endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${COHORT_DEFINITIONS_PATH}/def-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([cohortDefinitionAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Definition Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a cohort definition by its name', async () => {
    const screen = await openEditDialogForItem(cohortDefinitionAlphaFixture);
    await expect.element(screen.getByText('Edit item: Definition Alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its numeric name', async () => {
    const screen = await openEditDialogForItem({ ...cohortDefinitionAlphaFixture, cohort_definition_name: 42 as unknown as string });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by the label of its definition type concept when the name is blank', async () => {
    const screen = await openEditDialogForItem({ ...cohortDefinitionAlphaFixture, cohort_definition_name: '   ' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by the label of its subject concept when the definition type concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...cohortDefinitionAlphaFixture, cohort_definition_name: '', definition_type_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: Concept Two', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its id when both concept ids are unknown and no text is set', async () => {
    const screen = await openEditDialogForItem({
      ...cohortDefinitionAlphaFixture,
      cohort_definition_description: '',
      cohort_definition_name: '',
      definition_type_concept_id: 'concept-unknown',
      subject_concept_id: 'concept-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: def-alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its id when only the subject concept id is unknown and no text is set', async () => {
    const screen = await openEditDialogForItem({
      ...cohortDefinitionAlphaFixture,
      cohort_definition_description: '',
      cohort_definition_name: '',
      definition_type_concept_id: '',
      subject_concept_id: 'concept-unknown',
    });
    await expect.element(screen.getByText('Edit item: def-alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its description when the concept ids are empty', async () => {
    const screen = await openEditDialogForItem({
      ...cohortDefinitionAlphaFixture,
      cohort_definition_name: '',
      definition_type_concept_id: '',
      subject_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: Description Alpha', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its numeric description when the concept ids are empty', async () => {
    const screen = await openEditDialogForItem({
      ...cohortDefinitionAlphaFixture,
      cohort_definition_description: 77 as unknown as string,
      cohort_definition_name: '',
      definition_type_concept_id: '',
      subject_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: 77', { exact: true })).toBeVisible();
  });

  it('names a cohort definition by its id when the description is blank', async () => {
    const screen = await openEditDialogForItem({
      ...cohortDefinitionAlphaFixture,
      cohort_definition_description: '  ',
      cohort_definition_name: '',
      definition_type_concept_id: '',
      subject_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: def-alpha', { exact: true })).toBeVisible();
  });

  it('saves a new cohort definition whose selected concepts are no longer among the concept options', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCohortDefinitionPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Cohort Definition Name' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Cohort Definition Description' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Definition Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { name: 'Subject Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();

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
    expect(postBodies[0]).toEqual(expect.objectContaining({ definition_type_concept_id: 'concept-1', subject_concept_id: 'concept-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved cohort definition by its selected definition type concept id when no text is set and the concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockCohortDefinitionPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Cohort Definition Name' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Cohort Definition Description' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Definition Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { name: 'Subject Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();

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
    expect(postBodies[0]).toEqual(expect.objectContaining({ cohort_definition_description: '   ', cohort_definition_name: '   ', definition_type_concept_id: 'concept-1', subject_concept_id: 'concept-2' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
