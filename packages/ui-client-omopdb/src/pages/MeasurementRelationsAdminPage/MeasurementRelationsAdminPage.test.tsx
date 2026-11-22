import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbMeasurementRelation,
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

import { MeasurementRelationsAdminPage } from './MeasurementRelationsAdminPage';

type MeasurementRelationFixture = { readonly id: string } & OmopDbMeasurementRelation;

const MEASUREMENT_RELATIONS_PATH = '/v1/measurement_relations';
const PERSONS_PATH = '/v1/Persons';
const MEASUREMENTS_PATH = '/v1/Measurements';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/measurement-relations';
const URL = '/management/measurement-relations';

const MEASUREMENT_RELATION_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.MeasurementRelationCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.MeasurementRelationCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.MeasurementRelationCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const measurementRelationAlphaFixture: MeasurementRelationFixture = {
  from_measurement_id: 'measurement-1',
  id: 'mr-alpha',
  measurement_relation_concept_id: 'concept-1',
  measurement_relation_id: 'mr-alpha',
  person_id: 'person-1',
  to_measurement_id: 'measurement-2',
};

const measurementRelationBetaFixture: MeasurementRelationFixture = {
  from_measurement_id: 'measurement-2',
  id: 'mr-beta',
  measurement_relation_concept_id: 'concept-2',
  measurement_relation_id: 'mr-beta',
  person_id: 'person-2',
  to_measurement_id: 'measurement-1',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', MEASUREMENTS_PATH, () => Response.json([
    { measurement_id: 'measurement-1' },
    { measurement_id: 'measurement-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `measurement_relation_id`.
 * The page maps the created item to a table row by `measurement_relation_id`, so the API response must include it.
 */
const mockMeasurementRelationPost = (calls: ReturnType<typeof mockCrudApi>['calls']) => {
  mockApiRequest('POST', MEASUREMENT_RELATIONS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbMeasurementRelation>;
    calls.push({ body, method: 'POST', pathname: MEASUREMENT_RELATIONS_PATH });
    return Response.json({ ...body, id: 'created-mr', measurement_relation_id: 'created-mr' }, { status: 201 });
  });
};

const renderPage = async (
  initialItems: MeasurementRelationFixture[] = [measurementRelationAlphaFixture, measurementRelationBetaFixture],
  permissions = MEASUREMENT_RELATION_PERMISSIONS,
) => {
  mockReferenceData();
  const mock = mockCrudApi(MEASUREMENT_RELATIONS_PATH, initialItems);
  mockMeasurementRelationPost(mock.calls);
  const screen = await renderRoutedPage(
    <MeasurementRelationsAdminPage />, {
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

const openEditDialogForItem = async (item: MeasurementRelationFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('MeasurementRelationsAdminPage', () => {
  it('lists the measurement relations with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' })).toBeInTheDocument();
  });

  it('creates a measurement relation via the measurement relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new measurement relation', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'From Measurement ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-1' }).click();
    await screen.getByRole('combobox', { name: 'To Measurement ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-2' }).click();
    await screen.getByRole('combobox', { name: 'Measurement Relation Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(MEASUREMENT_RELATIONS_PATH);
    expect(postCall?.body).toEqual({
      from_measurement_id: 'measurement-1',
      measurement_relation_concept_id: 'concept-1',
      person_id: 'person-2',
      to_measurement_id: 'measurement-2',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a measurement relation via the measurement relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Measurement Relation Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${MEASUREMENT_RELATIONS_PATH}/mr-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      from_measurement_id: 'measurement-1',
      measurement_relation_concept_id: 'concept-2',
      measurement_relation_id: 'mr-alpha',
      person_id: 'person-1',
      to_measurement_id: 'measurement-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a measurement relation via the measurement relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${MEASUREMENT_RELATIONS_PATH}/mr-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([measurementRelationAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a measurement relation by the label of its person when the person is known', async () => {
    const screen = await openEditDialogForItem(measurementRelationAlphaFixture);
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by the label of its from measurement when the person is unknown', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: 'measurement-1',
      id: 'mr-unknown-person',
      measurement_relation_concept_id: 'concept-unknown',
      measurement_relation_id: 'mr-unknown-person',
      person_id: 'person-unknown',
      to_measurement_id: 'measurement-unknown',
    });
    await expect.element(screen.getByText('Edit item: measurement-1', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by the label of its to measurement when the person and from measurement are unknown', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: 'measurement-unknown',
      id: 'mr-unknown-from',
      measurement_relation_concept_id: 'concept-unknown',
      measurement_relation_id: 'mr-unknown-from',
      person_id: 'person-unknown',
      to_measurement_id: 'measurement-2',
    });
    await expect.element(screen.getByText('Edit item: measurement-2', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by the label of its concept when the person and measurements are unknown', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: 'measurement-unknown',
      id: 'mr-unknown-measurements',
      measurement_relation_concept_id: 'concept-1',
      measurement_relation_id: 'mr-unknown-measurements',
      person_id: 'person-unknown',
      to_measurement_id: 'measurement-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by its id when none of the related options are known', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: 'measurement-unknown',
      id: 'mr-unknown-all',
      measurement_relation_concept_id: 'concept-unknown',
      measurement_relation_id: 'mr-unknown-all',
      person_id: 'person-unknown',
      to_measurement_id: 'measurement-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: mr-unknown-all', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by its id when the related references are empty or null', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: null,
      id: 'mr-empty-refs',
      measurement_relation_concept_id: null,
      measurement_relation_id: 'mr-empty-refs',
      person_id: '',
      to_measurement_id: null,
    });
    await expect.element(screen.getByText('Edit item: mr-empty-refs', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by its id when the person is blank and the from measurement is unknown', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: 'measurement-unknown',
      id: 'mr-blank-person-from',
      measurement_relation_concept_id: null,
      measurement_relation_id: 'mr-blank-person-from',
      person_id: '',
      to_measurement_id: 'measurement-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: mr-blank-person-from', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by its id when the person and from measurement are blank and the to measurement is unknown', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: '',
      id: 'mr-blank-person-from-to',
      measurement_relation_concept_id: null,
      measurement_relation_id: 'mr-blank-person-from-to',
      person_id: '',
      to_measurement_id: 'measurement-unknown',
    });
    await expect.element(screen.getByText('Edit item: mr-blank-person-from-to', { exact: true })).toBeVisible();
  });

  it('names a measurement relation by its id when all references are blank except an unknown concept', async () => {
    const screen = await openEditDialogForItem({
      from_measurement_id: '',
      id: 'mr-blank-all-concept',
      measurement_relation_concept_id: 'concept-unknown',
      measurement_relation_id: 'mr-blank-all-concept',
      person_id: '',
      to_measurement_id: '',
    });
    await expect.element(screen.getByText('Edit item: mr-blank-all-concept', { exact: true })).toBeVisible();
  });

  it('creates a measurement relation after the related options were refreshed without the selected values', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'From Measurement ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-1' }).click();
    await screen.getByRole('combobox', { name: 'To Measurement ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'measurement-2' }).click();
    await screen.getByRole('combobox', { name: 'Measurement Relation Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();

    let personsRequestCount = 0;
    let measurementsRequestCount = 0;
    let conceptsRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', MEASUREMENTS_PATH, () => {
      measurementsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.MEASUREMENTS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personsRequestCount).toBe(1);
    await expect.poll(() => measurementsRequestCount).toBe(1);
    await expect.poll(() => conceptsRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({
      from_measurement_id: 'measurement-1',
      measurement_relation_concept_id: 'concept-1',
      person_id: 'person-2',
      to_measurement_id: 'measurement-2',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
