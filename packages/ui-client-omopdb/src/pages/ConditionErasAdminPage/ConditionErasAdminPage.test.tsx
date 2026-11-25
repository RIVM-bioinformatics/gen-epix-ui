import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConditionEra,
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

import { ConditionErasAdminPage } from './ConditionErasAdminPage';

type ConditionEraFixture = { readonly id: string } & OmopDbConditionEra;

const CONDITION_ERAS_PATH = '/v1/ConditionEras';
const ROUTE_PATH = '/management/condition-eras';
const URL = '/management/condition-eras';

const CONDITION_ERA_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConditionEraCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConditionEraCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConditionEraCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conditionEraAlphaFixture: ConditionEraFixture = {
  condition_concept_id: 'concept-1',
  condition_era_end_date: '2020-01-31',
  condition_era_id: 'era-alpha',
  condition_era_start_date: '2020-01-01',
  condition_occurrence_count: 3,
  id: 'era-alpha',
  person_id: 'person-1',
  provenance_id: 'prov-alpha',
  source_traceback: 'trace-alpha',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `condition_era_id`.
 * The page maps the created item to a table row by `condition_era_id`, so the API response must include it.
 */
const mockConditionEraPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONDITION_ERAS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConditionEra>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, condition_era_id: 'created-era', id: 'created-era' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: 'Outpatient' },
  ]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
};

const renderPage = async (initialItems: ConditionEraFixture[] = [conditionEraAlphaFixture], permissions = CONDITION_ERA_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONDITION_ERAS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConditionErasAdminPage />, {
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

const openEditDialogForItem = async (item: Partial<ConditionEraFixture>) => {
  const { screen } = await renderPage([item as ConditionEraFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ConditionErasAdminPage', () => {
  it('lists the condition eras with option labels for the person and condition concept', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'prov-alpha' })).toBeInTheDocument();
  });

  it('creates a condition era via the condition eras endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockConditionEraPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new condition era', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('prov-new');
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'Condition Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await fillDate(screen, 'Condition Era Start Date', ['2021', '02', '03']);
    await fillDate(screen, 'Condition Era End Date', ['2021', '02', '04']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ condition_concept_id: 'concept-2', person_id: 'person-2', provenance_id: 'prov-new' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a condition era via the condition eras endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('prov-renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONDITION_ERAS_PATH}/era-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ condition_concept_id: 'concept-1', condition_era_id: 'era-alpha', person_id: 'person-1', provenance_id: 'prov-renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a condition era via the condition eras endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONDITION_ERAS_PATH}/era-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([conditionEraAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a condition era by the label of its matching person', async () => {
    const screen = await openEditDialogForItem(conditionEraAlphaFixture);
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a condition era by the label of its matching condition concept when the person is not known', async () => {
    const screen = await openEditDialogForItem({ condition_concept_id: 'concept-2', condition_era_id: 'era-concept', id: 'era-concept', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: Outpatient', { exact: true })).toBeVisible();
  });

  it('names a condition era by its provenance when both the person and the condition concept are not known', async () => {
    const screen = await openEditDialogForItem({ condition_concept_id: 'concept-unknown', condition_era_id: 'era-unknown', id: 'era-unknown', person_id: 'person-unknown', provenance_id: 'prov-unknown' });
    await expect.element(screen.getByText('Edit item: prov-unknown', { exact: true })).toBeVisible();
  });

  it('names a condition era by the label of its matching condition concept when the person id is empty', async () => {
    const screen = await openEditDialogForItem({ condition_concept_id: 'concept-2', condition_era_id: 'era-empty-person', id: 'era-empty-person', person_id: '' });
    await expect.element(screen.getByText('Edit item: Outpatient', { exact: true })).toBeVisible();
  });

  it('falls back to the condition concept id when the person id is empty and the concept is not known', async () => {
    const screen = await openEditDialogForItem({ condition_concept_id: 'concept-unknown', condition_era_id: 'era-unknown-concept', id: 'era-unknown-concept', person_id: '' });
    await expect.element(screen.getByText('Edit item: era-unknown-concept', { exact: true })).toBeVisible();
  });

  it('names a condition era by its provenance when the condition concept id is empty', async () => {
    const screen = await openEditDialogForItem({ condition_concept_id: '', condition_era_id: 'era-empty-concept', id: 'era-empty-concept', person_id: 'person-unknown', provenance_id: 'prov-empty-concept' });
    await expect.element(screen.getByText('Edit item: prov-empty-concept', { exact: true })).toBeVisible();
  });

  it('names a condition era by its source traceback when the provenance is blank', async () => {
    const screen = await openEditDialogForItem({ condition_era_id: 'era-traceback', id: 'era-traceback', provenance_id: '   ', source_traceback: 'trace-only' });
    await expect.element(screen.getByText('Edit item: trace-only', { exact: true })).toBeVisible();
  });

  it('names a condition era by its numeric provenance', async () => {
    const screen = await openEditDialogForItem({ condition_era_id: 'era-number-provenance', id: 'era-number-provenance', provenance_id: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a condition era by its numeric source traceback', async () => {
    const screen = await openEditDialogForItem({ condition_era_id: 'era-number-traceback', id: 'era-number-traceback', source_traceback: 9 as unknown as string });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a condition era by its id when the provenance and source traceback are blank', async () => {
    const screen = await openEditDialogForItem({ condition_era_id: 'era-blank', id: 'era-blank', provenance_id: '  ', source_traceback: '  ' });
    await expect.element(screen.getByText('Edit item: era-blank', { exact: true })).toBeVisible();
  });

  it('names an unsaved condition era by its selected person id when neither the person nor the concept is among the options', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postBodies = mockConditionEraPost(responseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'Condition Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await fillDate(screen, 'Condition Era Start Date', ['2021', '02', '03']);
    await fillDate(screen, 'Condition Era End Date', ['2021', '02', '04']);

    let personRequestCount = 0;
    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personRequestCount).toBe(1);
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ condition_concept_id: 'concept-2', person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-2" is being saved')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
