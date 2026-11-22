import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConcept,
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

import { ConceptsAdminPage } from './ConceptsAdminPage';

type ConceptFixture = { readonly id: string } & OmopDbConcept;

const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/concepts';
const URL = '/management/concepts';

const CONCEPT_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conceptAlphaFixture: ConceptFixture = {
  concept_class_id: 'class-1',
  concept_code: 'A1',
  concept_id: 'concept-1',
  concept_name: 'Alpha Concept',
  domain_id: 'domain-1',
  id: 'concept-1',
  valid_end_date: '2099-12-31',
  valid_start_date: '2020-01-01',
  vocabulary_id: 'vocab-1',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `concept_id`.
 * The page maps the created item to a table row by `concept_id`, so the API response must include it.
 */
const mockConceptPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONCEPTS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConcept>;
    postBodies.push(body);
    return Response.json({ ...body, concept_id: 'created-concept', id: 'created-concept' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Domains', () => Response.json([
    { domain_id: 'domain-1', domain_name: 'Drug' },
  ]));
  mockApiRequest('GET', '/v1/Vocabularies', () => Response.json([
    { vocabulary_id: 'vocab-1', vocabulary_name: 'SNOMED' },
  ]));
  mockApiRequest('GET', '/v1/ConceptClasss', () => Response.json([
    { concept_class_id: 'class-1', concept_class_name: 'Clinical Drug' },
  ]));
};

const renderPage = async (initialItems: ConceptFixture[] = [conceptAlphaFixture], permissions = CONCEPT_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONCEPTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptsAdminPage />, {
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

const openEditDialogForItem = async (item: ConceptFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConceptsAdminPage', () => {
  it('lists the concepts with option labels for the domain, vocabulary and concept class', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Concept' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Drug' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SNOMED' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Clinical Drug' })).toBeInTheDocument();
  });

  it('creates a concept via the concepts endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockConceptPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Concept Name' }).fill('Gamma Concept');
    await screen.getByRole('textbox', { name: 'Concept Code' }).fill('G1');
    await screen.getByRole('combobox', { name: 'Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Drug' }).click();
    await screen.getByRole('combobox', { name: 'Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'SNOMED' }).click();
    await screen.getByRole('combobox', { name: 'Concept Class ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Clinical Drug' }).click();
    await fillDate(screen, 'Valid Start Date', ['2021', '03', '04']);
    await fillDate(screen, 'Valid End Date', ['2099', '12', '31']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      concept_class_id: 'class-1',
      concept_code: 'G1',
      concept_name: 'Gamma Concept',
      domain_id: 'domain-1',
      vocabulary_id: 'vocab-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept via the concepts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha Concept', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Concept Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPTS_PATH}/concept-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ concept_code: 'A1', concept_id: 'concept-1', concept_name: 'Alpha renamed', domain_id: 'domain-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept via the concepts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPTS_PATH}/concept-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([conceptAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Concept' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a concept by its concept name', async () => {
    const screen = await openEditDialogForItem(conceptAlphaFixture);
    await expect.element(screen.getByText('Edit item: Alpha Concept', { exact: true })).toBeVisible();
  });

  it('names a concept by its numeric concept name', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_id: 'concept-number', concept_name: 5 as unknown as string, id: 'concept-number' });
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a concept by its concept code when the concept name is blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: 'CODE-7', concept_id: 'concept-code', concept_name: '   ', id: 'concept-code' });
    await expect.element(screen.getByText('Edit item: CODE-7', { exact: true })).toBeVisible();
  });

  it('names a concept by its numeric concept code when the concept name is blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: 42 as unknown as string, concept_id: 'concept-code-number', concept_name: '', id: 'concept-code-number' });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a concept by the label of its domain when the name and code are blank', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: '', concept_id: 'concept-domain', concept_name: '', domain_id: 'domain-1', id: 'concept-domain' });
    await expect.element(screen.getByText('Edit item: Drug', { exact: true })).toBeVisible();
  });

  it('names a concept by the label of its vocabulary when the domain is not known', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: '', concept_id: 'concept-vocab', concept_name: '', domain_id: 'domain-unknown', id: 'concept-vocab', vocabulary_id: 'vocab-1' });
    await expect.element(screen.getByText('Edit item: SNOMED', { exact: true })).toBeVisible();
  });

  it('names a concept by its id when neither the domain nor the vocabulary is known', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: '', concept_id: 'concept-unknown', concept_name: '', domain_id: 'domain-unknown', id: 'concept-unknown', vocabulary_id: 'vocab-unknown' });
    await expect.element(screen.getByText('Edit item: concept-unknown', { exact: true })).toBeVisible();
  });

  it('names a concept by its id when the domain is empty and the vocabulary is missing', async () => {
    const screen = await openEditDialogForItem({ concept_class_id: 'class-1', concept_code: '', concept_id: 'concept-empty-domain', concept_name: '', domain_id: '', id: 'concept-empty-domain', valid_end_date: '2099-12-31', valid_start_date: '2020-01-01' } as ConceptFixture);
    await expect.element(screen.getByText('Edit item: concept-empty-domain', { exact: true })).toBeVisible();
  });

  it('names a concept by its id when the domain is empty and the vocabulary is not known', async () => {
    const screen = await openEditDialogForItem({ ...conceptAlphaFixture, concept_code: '', concept_id: 'concept-vocab-unknown', concept_name: '', domain_id: '', id: 'concept-vocab-unknown', vocabulary_id: 'vocab-unknown' });
    await expect.element(screen.getByText('Edit item: concept-vocab-unknown', { exact: true })).toBeVisible();
  });

  it('names an unsaved concept by its selected domain id when that domain and vocabulary are no longer among the options', async () => {
    const { screen } = await renderPage([]);
    mockApiRequest('POST', CONCEPTS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Concept Name' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Concept Code' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Drug' }).click();
    await screen.getByRole('combobox', { name: 'Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'SNOMED' }).click();
    await screen.getByRole('combobox', { name: 'Concept Class ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Clinical Drug' }).click();
    await fillDate(screen, 'Valid Start Date', ['2021', '03', '04']);
    await fillDate(screen, 'Valid End Date', ['2099', '12', '31']);

    let domainRequestCount = 0;
    let vocabularyRequestCount = 0;
    mockApiRequest('GET', '/v1/Domains', () => {
      domainRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Vocabularies', () => {
      vocabularyRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.DOMAINS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.VOCABULARIES) });
    await expect.poll(() => domainRequestCount).toBe(1);
    await expect.poll(() => vocabularyRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Concept "domain-1" could not be created.')]));
  });
});
