import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbVisitOccurrence,
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

import { VisitOccurrencesAdminPage } from './VisitOccurrencesAdminPage';

type VisitOccurrenceFixture = { readonly id: string } & OmopDbVisitOccurrence;

const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';
const CONCEPTS_PATH = '/v1/Concepts';
const PERSONS_PATH = '/v1/Persons';
const ROUTE_PATH = '/management/visit-occurrences';
const URL = '/management/visit-occurrences';

const VISIT_OCCURRENCE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const visitOccurrenceAlphaFixture: VisitOccurrenceFixture = {
  admitted_from_source_value: null,
  discharged_to_source_value: null,
  id: 'visit-occurrence-alpha',
  person_id: 'person-1',
  visit_concept_id: 'concept-1',
  visit_end_date: '2024-01-20',
  visit_occurrence_id: 'visit-occurrence-alpha',
  visit_source_value: 'Alpha Visit',
  visit_start_date: '2024-01-15',
  visit_type_concept_id: 'concept-2',
};

const visitOccurrenceBetaFixture: VisitOccurrenceFixture = {
  admitted_from_source_value: null,
  discharged_to_source_value: null,
  id: 'visit-occurrence-beta',
  person_id: 'person-2',
  visit_concept_id: 'concept-2',
  visit_end_date: '2024-02-20',
  visit_occurrence_id: 'visit-occurrence-beta',
  visit_source_value: null,
  visit_start_date: '2024-02-15',
  visit_type_concept_id: 'concept-1',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: 'Concept Two' },
  ]));
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', '/v1/CareSites', () => Response.json([]));
  mockApiRequest('GET', '/v1/Providers', () => Response.json([]));
  mockApiRequest('GET', '/v1/organizations', () => Response.json([]));
};

const mockVisitOccurrencePost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', VISIT_OCCURRENCES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbVisitOccurrence>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-visit-occurrence', visit_occurrence_id: 'created-visit-occurrence' }, { status: 201 });
  });
  return postBodies;
};

const renderPage = async (initialItems: VisitOccurrenceFixture[] = [visitOccurrenceAlphaFixture, visitOccurrenceBetaFixture], permissions = VISIT_OCCURRENCE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(VISIT_OCCURRENCES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <VisitOccurrencesAdminPage />, {
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

const openEditDialogForItem = async (item: VisitOccurrenceFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

const fillDate = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, [year, month, day]: [string, string, string]) => {
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { exact: true, name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Day' }).fill(day);
};

const fillRequiredCreateFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Visit Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Visit Type Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
  await fillDate(screen, 'Visit Start Date', ['2024', '03', '01']);
  await fillDate(screen, 'Visit End Date', ['2024', '03', '05']);
};

const replaceOptionsWithEmptyList = async (path: string, queryKey: OMOPDB_QUERY_KEY) => {
  let requestCount = 0;
  mockApiRequest('GET', path, () => {
    requestCount += 1;
    return Response.json([]);
  });
  const queryClientService = container.resolve(QueryClientService);
  await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(queryKey) });
  await expect.poll(() => requestCount).toBe(1);
};

describe('VisitOccurrencesAdminPage', () => {
  it('lists the visit occurrences from the visit occurrences endpoint with the source value and option labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Visit' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept Two' }).first()).toBeInTheDocument();
  });

  it('reloads the visit occurrences list from the visit occurrences endpoint when the visit occurrences query is invalidated', async () => {
    const { screen } = await renderPage();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Visit' })).toBeInTheDocument();
    let getRequestCount = 0;
    mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => {
      getRequestCount += 1;
      return Response.json([visitOccurrenceAlphaFixture, visitOccurrenceBetaFixture]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.VISIT_OCCURRENCES) });

    await expect.poll(() => getRequestCount).toBeGreaterThan(0);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Visit' })).toBeInTheDocument();
  });

  it('lists the visit occurrences fetched by the table when the options request failed', async () => {
    mockReferenceData();
    mockCrudApi(VISIT_OCCURRENCES_PATH, []);
    let getRequestCount = 0;
    mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => {
      getRequestCount += 1;
      if (getRequestCount === 1) {
        return new Response(null, { status: 500 });
      }
      return Response.json([visitOccurrenceAlphaFixture, visitOccurrenceBetaFixture]);
    });
    const screen = await renderRoutedPage(
      <VisitOccurrencesAdminPage />, {
        path: ROUTE_PATH,
        permissions: VISIT_OCCURRENCE_PERMISSIONS as unknown as CommonDbApiPermission[],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Visit' })).toBeInTheDocument();
    expect(getRequestCount).toBeGreaterThanOrEqual(2);
  });

  it('creates a visit occurrence via the visit occurrences endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockVisitOccurrencePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new visit occurrence', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { name: 'Visit Source Value' }).fill('New Visit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      person_id: 'person-1',
      visit_concept_id: 'concept-1',
      visit_source_value: 'New Visit',
      visit_type_concept_id: 'concept-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a visit occurrence via the visit occurrences endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha Visit', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Visit Source Value' }).fill('Alpha Visit Revised');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${VISIT_OCCURRENCES_PATH}/visit-occurrence-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ visit_occurrence_id: 'visit-occurrence-alpha', visit_source_value: 'Alpha Visit Revised' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a visit occurrence via the visit occurrences endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Alpha Visit', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${VISIT_OCCURRENCES_PATH}/visit-occurrence-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([visitOccurrenceAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Visit' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a visit occurrence by its source value when it is a non-blank string', async () => {
    const screen = await openEditDialogForItem(visitOccurrenceAlphaFixture);
    await expect.element(screen.getByText('Edit item: Alpha Visit', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its numeric source value', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, id: 'visit-occurrence-number-source', visit_occurrence_id: 'visit-occurrence-number-source', visit_source_value: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its admitted from source value when the source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, admitted_from_source_value: 'Admitted Text', id: 'visit-occurrence-blank-source', visit_occurrence_id: 'visit-occurrence-blank-source', visit_source_value: '   ' });
    await expect.element(screen.getByText('Edit item: Admitted Text', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its numeric admitted from source value', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, admitted_from_source_value: 8 as unknown as string, id: 'visit-occurrence-number-admitted', visit_occurrence_id: 'visit-occurrence-number-admitted', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its discharged to source value when the other source values are empty', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, admitted_from_source_value: '  ', discharged_to_source_value: 'Discharged Text', id: 'visit-occurrence-discharged', visit_occurrence_id: 'visit-occurrence-discharged', visit_source_value: '' });
    await expect.element(screen.getByText('Edit item: Discharged Text', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its numeric discharged to source value', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, admitted_from_source_value: null, discharged_to_source_value: 9 as unknown as string, id: 'visit-occurrence-number-discharged', visit_occurrence_id: 'visit-occurrence-number-discharged', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by the label of its person when no source value is set', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, id: 'visit-occurrence-person', person_id: 'person-2', visit_occurrence_id: 'visit-occurrence-person', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: person-2', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its id when its person id is null', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, id: 'visit-occurrence-null-person', person_id: null, visit_occurrence_id: 'visit-occurrence-null-person', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: visit-occurrence-null-person', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its id when its person id is empty', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, id: 'visit-occurrence-empty-person', person_id: '', visit_occurrence_id: 'visit-occurrence-empty-person', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: visit-occurrence-empty-person', { exact: true })).toBeVisible();
  });

  it('names a visit occurrence by its id when its person is not in the person options', async () => {
    const screen = await openEditDialogForItem({ ...visitOccurrenceAlphaFixture, id: 'visit-occurrence-unknown-person', person_id: 'person-unknown', visit_occurrence_id: 'visit-occurrence-unknown-person', visit_source_value: null });
    await expect.element(screen.getByText('Edit item: visit-occurrence-unknown-person', { exact: true })).toBeVisible();
  });

  it('names a new visit occurrence by its person id in the progress notification', async () => {
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    mockVisitOccurrencePost();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('person-1')]));
  });

  it('falls back to the person id in the progress notification when the refetched persons no longer list the selected person', async () => {
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await replaceOptionsWithEmptyList(PERSONS_PATH, OMOPDB_QUERY_KEY.PERSONS);

    let releaseResponse: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const postBodies = mockVisitOccurrencePost(responseGate);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-1" is being saved')]));
    releaseResponse();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
