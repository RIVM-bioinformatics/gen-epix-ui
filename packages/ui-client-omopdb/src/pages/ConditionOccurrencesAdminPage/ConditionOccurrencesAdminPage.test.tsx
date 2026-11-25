import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbConditionOccurrence,
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

import { ConditionOccurrencesAdminPage } from './ConditionOccurrencesAdminPage';

type ConditionFixture = { readonly id: string } & OmopDbConditionOccurrence;

const CONDITION_OCCURRENCES_PATH = '/v1/ConditionOccurrences';
const CONCEPTS_PATH = '/v1/Concepts';
const PERSONS_PATH = '/v1/Persons';
const ORGANIZATIONS_PATH = '/v1/organizations';
const PROVIDERS_PATH = '/v1/Providers';
const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';
const VISIT_DETAILS_PATH = '/v1/VisitDetails';
const ROUTE_PATH = '/management/condition-occurrences';
const URL = '/management/condition-occurrences';

const CONDITION_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ConditionOccurrenceCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ConditionOccurrenceCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ConditionOccurrenceCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const conditionAlphaFixture: ConditionFixture = {
  condition_concept_id: 'concept-1',
  condition_occurrence_id: 'condition-alpha',
  condition_source_value: 'Influenza',
  condition_start_date: '2024-01-02',
  condition_type_concept_id: 'concept-1',
  id: 'condition-alpha',
  person_id: 'person-1',
  provided_by_organization_id: 'org-1',
  provider_id: 'provider-1',
  visit_detail_id: 'visit-detail-1',
  visit_occurrence_id: 'visit-1',
};

const conditionBetaFixture: ConditionFixture = {
  condition_concept_id: 'concept-2',
  condition_occurrence_id: 'condition-beta',
  condition_source_value: null,
  condition_start_date: '2024-02-03',
  condition_type_concept_id: 'concept-1',
  id: 'condition-beta',
  person_id: 'person-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `condition_occurrence_id`.
 * The page maps the created item to a table row by `condition_occurrence_id`, so the API response must include it.
 */
const mockConditionPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CONDITION_OCCURRENCES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbConditionOccurrence>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, condition_occurrence_id: 'created-condition', id: 'created-condition' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([{ id: 'org-1', name: 'Org One' }]));
  mockApiRequest('GET', PROVIDERS_PATH, () => Response.json([{ provider_id: 'provider-1', provider_name: 'Provider One' }]));
  mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => Response.json([{ visit_occurrence_id: 'visit-1' }]));
  mockApiRequest('GET', VISIT_DETAILS_PATH, () => Response.json([{ visit_detail_id: 'visit-detail-1' }]));
};

const renderPage = async (initialItems: ConditionFixture[] = [conditionAlphaFixture, conditionBetaFixture], permissions = CONDITION_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CONDITION_OCCURRENCES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConditionOccurrencesAdminPage />, {
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

/**
 * Opens the edit dialog for a row. Accepts partial rows, including null fields, to reach the name fallbacks.
 */
const openEditDialogForItem = async (item: object) => {
  const { id } = item as { id: string };
  const { screen } = await renderPage([{ ...item, condition_occurrence_id: id } as unknown as ConditionFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

/**
 * Fills a date field group (Year, Month, Day spinbuttons) with the given ISO date.
 */
const fillDateField = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { name: 'Day' }).fill(day);
};

describe('ConditionOccurrencesAdminPage', () => {
  it('lists the condition occurrences with the source value, person, concept, provider, visit and organization', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'visit-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'visit-detail-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates a condition occurrence via the condition occurrences endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockConditionPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new condition occurrence', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Condition Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Condition Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await fillDateField(screen, 'Condition Start Date', '2024-03-04');
    await screen.getByRole('textbox', { exact: true, name: 'Condition Source Value' }).fill('Cough');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ condition_concept_id: 'concept-1', condition_source_value: 'Cough', person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved condition occurrence by its selected person id when neither the person nor the concept is among the options', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postBodies = mockConditionPost(responseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Condition Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Condition Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await fillDateField(screen, 'Condition Start Date', '2024-03-04');

    let personRequestCount = 0;
    let conceptRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', CONCEPTS_PATH, () => {
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
    expect(postBodies[0]).toEqual(expect.objectContaining({ condition_concept_id: 'concept-1', person_id: 'person-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-2" is being saved')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a condition occurrence via the condition occurrences endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Influenza', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Stop Reason' }).fill('Stopped');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONDITION_OCCURRENCES_PATH}/condition-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ condition_occurrence_id: 'condition-alpha', person_id: 'person-1', stop_reason: 'Stopped' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a condition occurrence via the condition occurrences endpoint', async () => {
    const { mock, screen } = await renderPage([conditionAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Influenza', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONDITION_OCCURRENCES_PATH}/condition-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([conditionAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a condition occurrence by its source value', async () => {
    const screen = await openEditDialogForItem(conditionAlphaFixture);
    await expect.element(screen.getByText('Edit item: Influenza', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its source value when it is a number', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_source_value: 42 });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its status source value when the source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_source_value: '   ', condition_status_source_value: 'Status text' });
    await expect.element(screen.getByText('Edit item: Status text', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its status source value when it is a number', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_status_source_value: 7 });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by the person when the status source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_status_source_value: '   ' });
    await expect.element(screen.getByText('Edit item: person-2', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by the concept when the person is unknown', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: 'concept-1', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its id when the person and the concept are both unknown', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: 'concept-unknown', id: 'condition-both-unknown', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: condition-both-unknown', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by the concept when the person id is empty', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: 'concept-1', person_id: '' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its id when the person is absent and the concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: 'concept-unknown', id: 'condition-person-null', person_id: null });
    await expect.element(screen.getByText('Edit item: condition-person-null', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its id when the person and the concept are absent', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: null, id: 'condition-bare', person_id: null });
    await expect.element(screen.getByText('Edit item: condition-bare', { exact: true })).toBeVisible();
  });

  it('names a condition occurrence by its id when the person is unknown and the concept id is empty', async () => {
    const screen = await openEditDialogForItem({ ...conditionBetaFixture, condition_concept_id: '', id: 'condition-empty-concept', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: condition-empty-concept', { exact: true })).toBeVisible();
  });
});
