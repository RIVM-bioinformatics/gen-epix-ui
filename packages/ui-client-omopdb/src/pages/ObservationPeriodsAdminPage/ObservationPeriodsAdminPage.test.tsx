import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbObservationPeriod,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { COMMON_QUERY_KEY } from '@gen-epix/ui-client-common/constants/query.constants';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { ObservationPeriodsAdminPage } from './ObservationPeriodsAdminPage';

type ObservationPeriodFixture = { readonly id: string } & OmopDbObservationPeriod;

const OBSERVATION_PERIODS_PATH = '/v1/ObservationPeriods';
const PERSONS_PATH = '/v1/Persons';
const CONCEPTS_PATH = '/v1/Concepts';
const ORGANIZATIONS_PATH = '/v1/organizations';
const ROUTE_PATH = '/management/observation-periods';
const NULL_REFERENCE = null as unknown as string;

const OBSERVATION_PERIOD_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ObservationPeriodCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ObservationPeriodCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ObservationPeriodCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createObservationPeriodFixture = (overrides: Partial<ObservationPeriodFixture> & Pick<ObservationPeriodFixture, 'id'>): ObservationPeriodFixture => {
  return {
    observation_period_end_date: '2020-12-31',
    observation_period_id: overrides.id,
    observation_period_start_date: '2020-01-01',
    period_type_concept_id: 'concept-1',
    person_id: 'person-1',
    provenance_id: null,
    provided_by_organization_id: null,
    source_traceback: null,
    ...overrides,
  };
};

const observationPeriodAlphaFixture = createObservationPeriodFixture({
  id: 'observation-period-alpha',
  provenance_id: 'PROV-ALPHA',
  provided_by_organization_id: 'org-1',
  source_traceback: 'Source A',
});

const observationPeriodBetaFixture = createObservationPeriodFixture({
  id: 'observation-period-beta',
  period_type_concept_id: 'concept-2',
  person_id: 'person-2',
  provided_by_organization_id: 'org-2',
  source_traceback: 'Source B',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `observation_period_id`.
 * The page maps the created item by its primary key, so the API response must include it.
 */
const mockObservationPeriodPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', OBSERVATION_PERIODS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbObservationPeriod>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-observation-period', observation_period_id: 'created-observation-period' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: '' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([
    { id: 'org-1', name: 'Org One' },
    { id: 'org-2', name: 'Org Two' },
    { id: 'org-empty', name: '' },
  ]));
};

const renderPage = async (initialItems: ObservationPeriodFixture[] = [observationPeriodAlphaFixture, observationPeriodBetaFixture], permissions = OBSERVATION_PERIOD_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(OBSERVATION_PERIODS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ObservationPeriodsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: ROUTE_PATH,
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

const openEditDialogForItem = async (item: ObservationPeriodFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ObservationPeriodsAdminPage', () => {
  it('lists the observation periods from the observation periods endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org Two' })).toBeInTheDocument();
  });

  it('creates an observation period via the observation periods endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockObservationPeriodPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new observation period', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'Period Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await fillDate(screen, 'Observation Period Start Date', ['2021', '02', '03']);
    await fillDate(screen, 'Observation Period End Date', ['2021', '12', '31']);
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('PROV-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ period_type_concept_id: 'concept-1', person_id: 'person-2', provenance_id: 'PROV-NEW' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an observation period via the observation periods endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('PROV-EDIT');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${OBSERVATION_PERIODS_PATH}/observation-period-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ observation_period_id: 'observation-period-alpha', person_id: 'person-1', provenance_id: 'PROV-EDIT' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an observation period via the observation periods endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${OBSERVATION_PERIODS_PATH}/observation-period-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([observationPeriodAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an observation period by the label of its person when the person is known', async () => {
    const screen = await openEditDialogForItem(observationPeriodAlphaFixture);
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names an observation period by the label of its period type concept when the person id is empty', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({ id: 'observation-period-empty-person', period_type_concept_id: 'concept-1', person_id: '' }));
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names an observation period by the label of its organization when the person and concept are unknown', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-unknown-person-concept',
      period_type_concept_id: 'concept-unknown',
      person_id: 'person-unknown',
      provided_by_organization_id: 'org-1',
    }));
    await expect.element(screen.getByText('Edit item: Org One', { exact: true })).toBeVisible();
  });

  it('names an observation period by its id when all related options are unknown', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-unknown-refs',
      period_type_concept_id: 'concept-unknown',
      person_id: 'person-unknown',
      provided_by_organization_id: 'org-unknown',
    }));
    await expect.element(screen.getByText('Edit item: observation-period-unknown-refs', { exact: true })).toBeVisible();
  });

  it('names an observation period by its id when the organization has an empty name and the other references are missing', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-empty-org',
      period_type_concept_id: NULL_REFERENCE,
      person_id: NULL_REFERENCE,
      provided_by_organization_id: 'org-empty',
    }));
    await expect.element(screen.getByText('Edit item: observation-period-empty-org', { exact: true })).toBeVisible();
  });

  it('names an observation period by its id when the person is missing and the concept is unknown', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-unknown-concept',
      period_type_concept_id: 'concept-unknown',
      person_id: NULL_REFERENCE,
      provided_by_organization_id: NULL_REFERENCE,
    }));
    await expect.element(screen.getByText('Edit item: observation-period-unknown-concept', { exact: true })).toBeVisible();
  });

  it('names an observation period by its provenance id when the related references are missing', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-provenance',
      period_type_concept_id: NULL_REFERENCE,
      person_id: NULL_REFERENCE,
      provenance_id: 'PROV-X',
      provided_by_organization_id: NULL_REFERENCE,
    }));
    await expect.element(screen.getByText('Edit item: PROV-X', { exact: true })).toBeVisible();
  });

  it('names an observation period by its id when the provenance id is blank', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-blank-provenance',
      period_type_concept_id: NULL_REFERENCE,
      person_id: NULL_REFERENCE,
      provenance_id: '   ',
      provided_by_organization_id: NULL_REFERENCE,
    }));
    await expect.element(screen.getByText('Edit item: observation-period-blank-provenance', { exact: true })).toBeVisible();
  });

  it('names an observation period by its numeric provenance id', async () => {
    const screen = await openEditDialogForItem(createObservationPeriodFixture({
      id: 'observation-period-number',
      period_type_concept_id: NULL_REFERENCE,
      person_id: NULL_REFERENCE,
      provenance_id: 42 as unknown as string,
      provided_by_organization_id: NULL_REFERENCE,
    }));
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a new observation period by its person id when the related options no longer include the selected values', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockObservationPeriodPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { name: 'Period Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await fillDate(screen, 'Observation Period Start Date', ['2021', '02', '03']);
    await fillDate(screen, 'Observation Period End Date', ['2021', '12', '31']);

    let personsRequestCount = 0;
    let conceptsRequestCount = 0;
    let organizationsRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', ORGANIZATIONS_PATH, () => {
      organizationsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(COMMON_QUERY_KEY.ORGANIZATIONS) });
    await expect.poll(() => personsRequestCount).toBe(1);
    await expect.poll(() => conceptsRequestCount).toBe(1);
    await expect.poll(() => organizationsRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ period_type_concept_id: 'concept-1', person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
