import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbSourceToConceptMap,
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

import { SourceToConceptMapsAdminPage } from './SourceToConceptMapsAdminPage';

type SourceToConceptMapFixture = { readonly id: string } & OmopDbSourceToConceptMap;

const SOURCE_TO_CONCEPT_MAPS_PATH = '/v1/SourceToConceptMaps';
const CONCEPTS_PATH = '/v1/Concepts';
const VOCABULARIES_PATH = '/v1/Vocabularies';
const ROUTE_PATH = '/management/source-to-concept-maps';
const URL = '/management/source-to-concept-maps';

const SOURCE_TO_CONCEPT_MAP_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.SourceToConceptMapCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.SourceToConceptMapCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.SourceToConceptMapCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createSourceToConceptMapFixture = (overrides: Partial<SourceToConceptMapFixture> & Pick<SourceToConceptMapFixture, 'id'>): SourceToConceptMapFixture => {
  return {
    invalid_reason: null,
    source_code: 'SRC-DEFAULT',
    source_code_description: null,
    source_concept_id: 'concept-1',
    source_to_concept_map_id: overrides.id,
    source_vocabulary_id: 'vocab-1',
    target_concept_id: 'concept-2',
    target_vocabulary_id: 'vocab-1',
    valid_end_date: '2030-01-01',
    valid_start_date: '2020-01-01',
    ...overrides,
  };
};

const sourceToConceptMapAlphaFixture = createSourceToConceptMapFixture({
  id: 'stcm-alpha',
  source_code: 'SRC-ALPHA',
  source_code_description: 'Alpha description',
});

const sourceToConceptMapBetaFixture = createSourceToConceptMapFixture({
  id: 'stcm-beta',
  source_code: 'SRC-BETA',
  source_concept_id: 'concept-2',
  source_vocabulary_id: 'vocab-1',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `source_to_concept_map_id`.
 * The page maps the created item to a table row by its primary key, so the API response must include it.
 */
const mockSourceToConceptMapPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SOURCE_TO_CONCEPT_MAPS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbSourceToConceptMap>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-stcm', source_to_concept_map_id: 'created-stcm' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: 'Outpatient' },
  ]));
  mockApiRequest('GET', VOCABULARIES_PATH, () => Response.json([
    { vocabulary_id: 'vocab-1', vocabulary_name: 'Vocabulary One' },
  ]));
};

const renderPage = async (initialItems: SourceToConceptMapFixture[] = [sourceToConceptMapAlphaFixture, sourceToConceptMapBetaFixture], permissions = SOURCE_TO_CONCEPT_MAP_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(SOURCE_TO_CONCEPT_MAPS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SourceToConceptMapsAdminPage />, {
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

/**
 * Renders the page with a single item and opens its edit dialog. The edit dialog title is derived by getName.
 */
const openEditDialogForItem = async (item: Partial<SourceToConceptMapFixture> & Pick<SourceToConceptMapFixture, 'id'>) => {
  const { screen } = await renderPage([createSourceToConceptMapFixture(item)]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('SourceToConceptMapsAdminPage', () => {
  it('lists the source to concept maps with option labels for the concepts and vocabularies', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Vocabulary One' }).first()).toBeInTheDocument();
  });

  it('creates a source to concept map via the source to concept maps endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockSourceToConceptMapPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new source to concept map', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Source Code' }).fill('SRC-NEW');
    await screen.getByRole('combobox', { exact: true, name: 'Source Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Source Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Vocabulary One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Target Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Target Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Vocabulary One' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      source_code: 'SRC-NEW',
      source_concept_id: 'concept-1',
      source_vocabulary_id: 'vocab-1',
      target_concept_id: 'concept-2',
      target_vocabulary_id: 'vocab-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a source to concept map via the source to concept maps endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Source Code' }).fill('SRC-ALPHA-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SOURCE_TO_CONCEPT_MAPS_PATH}/stcm-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      source_code: 'SRC-ALPHA-2',
      source_concept_id: 'concept-1',
      source_to_concept_map_id: 'stcm-alpha',
      source_vocabulary_id: 'vocab-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a source to concept map via the source to concept maps endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SOURCE_TO_CONCEPT_MAPS_PATH}/stcm-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([sourceToConceptMapAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a source to concept map by its source code when it is a non-blank string', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-string', source_code: 'SRC-STRING' });
    await expect.element(screen.getByText('Edit item: SRC-STRING', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its numeric source code', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-number', source_code: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its source code description when the source code is blank', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-desc', source_code: '   ', source_code_description: 'Described code' });
    await expect.element(screen.getByText('Edit item: Described code', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its numeric source code description when the source code is empty', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-desc-number', source_code: '', source_code_description: 9 as unknown as string });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by the label of its source concept when the code and description are blank', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-concept', source_code: '', source_code_description: '  ', source_concept_id: 'concept-1' });
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by the label of its source vocabulary when the source concept is unknown', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-vocab', source_code: '', source_code_description: null, source_concept_id: 'concept-unknown', source_vocabulary_id: 'vocab-1' });
    await expect.element(screen.getByText('Edit item: Vocabulary One', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its id when neither the source concept nor the source vocabulary is known', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-id', source_code: '', source_code_description: null, source_concept_id: 'concept-unknown', source_vocabulary_id: 'vocab-unknown' });
    await expect.element(screen.getByText('Edit item: stcm-name-id', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its id when the source concept is empty and the source vocabulary is unknown', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-empty-concept', source_code: '', source_code_description: null, source_concept_id: '', source_vocabulary_id: 'vocab-unknown' });
    await expect.element(screen.getByText('Edit item: stcm-name-empty-concept', { exact: true })).toBeVisible();
  });

  it('names a source to concept map by its id when the source concept and source vocabulary are empty', async () => {
    const screen = await openEditDialogForItem({ id: 'stcm-name-empty-both', source_code: '', source_code_description: null, source_concept_id: '', source_vocabulary_id: '' });
    await expect.element(screen.getByText('Edit item: stcm-name-empty-both', { exact: true })).toBeVisible();
  });

  it('creates a source to concept map when the related options no longer include the selected values and names it by its returned id', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockSourceToConceptMapPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new source to concept map', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Source Code' }).fill('   ');
    await screen.getByRole('combobox', { exact: true, name: 'Source Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Source Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Vocabulary One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Target Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Target Vocabulary ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Vocabulary One' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);

    let conceptsRequestCount = 0;
    let vocabulariesRequestCount = 0;
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', VOCABULARIES_PATH, () => {
      vocabulariesRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.VOCABULARIES) });
    await expect.poll(() => conceptsRequestCount).toBe(1);
    await expect.poll(() => vocabulariesRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ source_concept_id: 'concept-1', source_vocabulary_id: 'vocab-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-stcm"')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
