import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbVocabulary,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { VocabulariesAdminPage } from './VocabulariesAdminPage';

type VocabularyFixture = { readonly id: string } & OmopDbVocabulary;

const VOCABULARIES_PATH = '/v1/Vocabularies';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/vocabularies';
const URL = '/management/vocabularies';

const VOCABULARY_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const vocabularyAlphaFixture: VocabularyFixture = {
  id: 'vocab-alpha',
  vocabulary_concept_id: 'concept-1',
  vocabulary_id: 'vocab-alpha',
  vocabulary_name: 'Alpha Vocabulary',
  vocabulary_reference: 'REF-ALPHA',
  vocabulary_str_id: 'ALPHA-STR',
  vocabulary_version: 'v1',
};

const vocabularyBetaFixture: VocabularyFixture = {
  id: 'vocab-beta',
  vocabulary_concept_id: 'concept-2',
  vocabulary_id: 'vocab-beta',
  vocabulary_name: 'Beta Vocabulary',
  vocabulary_reference: null,
  vocabulary_str_id: 'BETA-STR',
  vocabulary_version: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: 'Concept Two' },
  ]));
};

const mockVocabularyPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', VOCABULARIES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbVocabulary>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-vocab', vocabulary_id: 'created-vocab' }, { status: 201 });
  });
  return postBodies;
};

const renderPage = async (initialItems: VocabularyFixture[] = [vocabularyAlphaFixture, vocabularyBetaFixture], permissions = VOCABULARY_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(VOCABULARIES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <VocabulariesAdminPage />, {
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

const openEditDialogForItem = async (item: VocabularyFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('VocabulariesAdminPage', () => {
  it('lists the vocabularies from the vocabularies endpoint with the concept label for the vocabulary concept', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Vocabulary' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta Vocabulary' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'ALPHA-STR' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept Two' })).toBeInTheDocument();
  });

  it('creates a vocabulary via the vocabularies endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockVocabularyPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new vocabulary', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Vocabulary Str ID' }).fill('NEW-STR');
    await screen.getByRole('textbox', { name: 'Vocabulary Name' }).fill('New Vocabulary');
    await screen.getByRole('textbox', { name: 'Vocabulary Version' }).fill('v2');
    await screen.getByRole('combobox', { name: 'Vocabulary Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      vocabulary_concept_id: 'concept-2',
      vocabulary_name: 'New Vocabulary',
      vocabulary_str_id: 'NEW-STR',
      vocabulary_version: 'v2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a vocabulary via the vocabularies endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha Vocabulary', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Vocabulary Name' }).fill('Alpha Vocabulary Revised');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${VOCABULARIES_PATH}/vocab-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ vocabulary_id: 'vocab-alpha', vocabulary_name: 'Alpha Vocabulary Revised' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a vocabulary via the vocabularies endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Alpha Vocabulary', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${VOCABULARIES_PATH}/vocab-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([vocabularyAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Vocabulary' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a vocabulary by its name when the name is set', async () => {
    const screen = await openEditDialogForItem(vocabularyAlphaFixture);
    await expect.element(screen.getByText('Edit item: Alpha Vocabulary', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its numeric name', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-number-name', vocabulary_id: 'vocab-number-name', vocabulary_name: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its str id when the name is blank', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-blank-name', vocabulary_id: 'vocab-blank-name', vocabulary_name: '   ' });
    await expect.element(screen.getByText('Edit item: ALPHA-STR', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its numeric str id when the name is empty', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-number-str', vocabulary_id: 'vocab-number-str', vocabulary_name: '', vocabulary_str_id: 9 as unknown as string });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by the label of its concept when the name and str id are empty', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-concept', vocabulary_concept_id: 'concept-2', vocabulary_id: 'vocab-concept', vocabulary_name: '', vocabulary_str_id: '' });
    await expect.element(screen.getByText('Edit item: Concept Two', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its reference when the concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-ref', vocabulary_concept_id: 'concept-unknown', vocabulary_id: 'vocab-ref', vocabulary_name: '', vocabulary_reference: 'REF-ONLY', vocabulary_str_id: '' });
    await expect.element(screen.getByText('Edit item: REF-ONLY', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its numeric reference when the concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-number-ref', vocabulary_concept_id: 'concept-unknown', vocabulary_id: 'vocab-number-ref', vocabulary_name: '', vocabulary_reference: 5 as unknown as string, vocabulary_str_id: '' });
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its id when no name, str id, concept or reference is usable', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-unknown', vocabulary_concept_id: 'concept-unknown', vocabulary_id: 'vocab-unknown', vocabulary_name: '', vocabulary_reference: '', vocabulary_str_id: '' });
    await expect.element(screen.getByText('Edit item: vocab-unknown', { exact: true })).toBeVisible();
  });

  it('names a vocabulary by its id when the concept id is empty and no other name is usable', async () => {
    const screen = await openEditDialogForItem({ ...vocabularyAlphaFixture, id: 'vocab-empty-concept', vocabulary_concept_id: '', vocabulary_id: 'vocab-empty-concept', vocabulary_name: '', vocabulary_reference: null, vocabulary_str_id: '' });
    await expect.element(screen.getByText('Edit item: vocab-empty-concept', { exact: true })).toBeVisible();
  });

  it('names a new vocabulary by the label of its concept in the progress notification', async () => {
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Vocabulary Str ID' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Vocabulary Name' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Vocabulary Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    mockVocabularyPost();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Concept One')]));
  });

  it('falls back to the concept id in the progress notification when the refetched concepts no longer list the selected concept', async () => {
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Vocabulary Str ID' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Vocabulary Name' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Vocabulary Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();

    let conceptsRequestCount = 0;
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptsRequestCount).toBe(1);

    let releaseResponse: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const postBodies = mockVocabularyPost(responseGate);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-2" is being saved...')]));
    releaseResponse();
    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ vocabulary_concept_id: 'concept-2' }));
  });
});
