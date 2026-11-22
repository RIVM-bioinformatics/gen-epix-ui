import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbProcedureOccurrence,
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

import { ProcedureOccurrencesAdminPage } from './ProcedureOccurrencesAdminPage';

type ProcedureOccurrenceFixture = { readonly id: string } & OmopDbProcedureOccurrence;
type ProcedureOccurrencesScreen = Awaited<ReturnType<typeof renderPage>>['screen'];

const PROCEDURE_OCCURRENCES_PATH = '/v1/ProcedureOccurrences';
const ROUTE_PATH = '/management/procedure-occurrences';
const URL = '/management/procedure-occurrences';

const PROCEDURE_OCCURRENCE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ProcedureOccurrenceCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ProcedureOccurrenceCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ProcedureOccurrenceCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

/**
 * Builds a procedure occurrence with all required fields set, so that individual tests only override the fields under test.
 */
const buildProcedureOccurrenceFixture = (procedureOccurrenceId: string, overrides: Partial<ProcedureOccurrenceFixture> = {}): ProcedureOccurrenceFixture => {
  return {
    id: procedureOccurrenceId,
    modifier_concept_id: null,
    modifier_source_value: null,
    person_id: 'person-1',
    procedure_concept_id: 'concept-proc-1',
    procedure_date: '2021-03-04',
    procedure_occurrence_id: procedureOccurrenceId,
    procedure_source_value: null,
    procedure_type_concept_id: 'concept-type-1',
    provided_by_organization_id: null,
    provider_id: null,
    quantity: null,
    visit_detail_id: null,
    visit_occurrence_id: null,
    ...overrides,
  };
};

const procedureOccurrenceAlphaFixture = buildProcedureOccurrenceFixture('po-alpha', {
  modifier_concept_id: 'concept-mod-1',
  procedure_source_value: 'Procedure Alpha',
  provenance_id: 'prov-alpha',
  provided_by_organization_id: 'org-1',
  provider_id: 'provider-1',
  quantity: 3,
  visit_detail_id: 'visit-detail-1',
  visit_occurrence_id: 'visit-1',
});

const procedureOccurrenceBetaFixture = buildProcedureOccurrenceFixture('po-beta', {
  person_id: 'person-2',
  procedure_concept_id: 'concept-proc-2',
  procedure_source_value: 'Procedure Beta',
  source_traceback: 'trace-beta',
});

/**
 * The date inputs are serialized as Date strings, so the calendar parts are compared after parsing.
 */
const expectCalendarDate = (value: unknown, year: number, monthIndex: number, day: number) => {
  const parsed = new Date(value as string);
  expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([year, monthIndex, day]);
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `procedure_occurrence_id`.
 * The page maps the created item to a table row by `procedure_occurrence_id`, so the API response must include it.
 */
const mockProcedureOccurrencePost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', PROCEDURE_OCCURRENCES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbProcedureOccurrence>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-po', procedure_occurrence_id: 'created-po' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/organizations', () => Response.json([{ id: 'org-1', name: 'Org One' }]));
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-proc-1', concept_name: 'Procedure Concept One' },
    { concept_id: 'concept-proc-2', concept_name: 'Procedure Concept Two' },
    { concept_id: 'concept-type-1', concept_name: 'Type Concept One' },
    { concept_id: 'concept-mod-1', concept_name: 'Modifier Concept One' },
  ]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([{ person_id: 'person-1' }, { person_id: 'person-2' }]));
  mockApiRequest('GET', '/v1/Providers', () => Response.json([{ provider_id: 'provider-1', provider_name: 'Provider One' }]));
  mockApiRequest('GET', '/v1/VisitDetails', () => Response.json([{ visit_detail_id: 'visit-detail-1' }]));
  mockApiRequest('GET', '/v1/VisitOccurrences', () => Response.json([{ visit_occurrence_id: 'visit-1' }]));
};

const renderPage = async (initialItems: ProcedureOccurrenceFixture[] = [procedureOccurrenceAlphaFixture, procedureOccurrenceBetaFixture], permissions = PROCEDURE_OCCURRENCE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(PROCEDURE_OCCURRENCES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ProcedureOccurrencesAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: ProcedureOccurrencesScreen) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForItem = async (item: ProcedureOccurrenceFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

const selectOption = async (screen: ProcedureOccurrencesScreen, comboboxName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: comboboxName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const fillDate = async (screen: ProcedureOccurrencesScreen, label: string, [year, month, day]: [string, string, string]) => {
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { exact: true, name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Day' }).fill(day);
};

const fillRequiredCreateFields = async (screen: ProcedureOccurrencesScreen) => {
  await selectOption(screen, 'Person ID', 'person-1');
  await selectOption(screen, 'Procedure Concept ID', 'Procedure Concept One');
  await selectOption(screen, 'Procedure Type Concept ID', 'Type Concept One');
  await fillDate(screen, 'Procedure Date', ['2023', '01', '02']);
};

describe('ProcedureOccurrencesAdminPage', () => {
  it('lists the procedure occurrences from the procedure occurrences endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Procedure Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Procedure Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Procedure Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Modifier Concept One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'visit-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'visit-detail-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'prov-alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'trace-beta' })).toBeInTheDocument();
  });

  it('creates a procedure occurrence via the procedure occurrences endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProcedureOccurrencePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new procedure occurrence', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Quantity' }).fill('4');
    await screen.getByRole('textbox', { exact: true, name: 'Procedure Source Value' }).fill('Procedure New');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    const postBody = postBodies[0] as Record<string, unknown>;
    expect(postBody.person_id).toBe('person-1');
    expect(postBody.procedure_concept_id).toBe('concept-proc-1');
    expect(postBody.procedure_type_concept_id).toBe('concept-type-1');
    expectCalendarDate(postBody.procedure_date, 2023, 0, 2);
    expect(Number(postBody.quantity)).toBe(4);
    expect(postBody.procedure_source_value).toBe('Procedure New');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Procedure New')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved procedure occurrence by the label of its person while the create request is pending', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    mockProcedureOccurrencePost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('person-1')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a procedure occurrence via the procedure occurrences endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Procedure Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('prov-renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROCEDURE_OCCURRENCES_PATH}/po-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ procedure_occurrence_id: 'po-alpha', provenance_id: 'prov-renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a procedure occurrence via the procedure occurrences endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PROCEDURE_OCCURRENCES_PATH}/po-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([procedureOccurrenceAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Procedure Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a procedure occurrence by its procedure source value', async () => {
    const screen = await openEditDialogForItem(procedureOccurrenceAlphaFixture);
    await expect.element(screen.getByText('Edit item: Procedure Alpha', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its numeric procedure source value', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-number-procedure', { procedure_source_value: 42 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its modifier source value when the procedure source value is blank', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-modifier', { modifier_source_value: 'Modifier Source X', procedure_source_value: '   ' }));
    await expect.element(screen.getByText('Edit item: Modifier Source X', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its numeric modifier source value when the procedure source value is missing', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-number-modifier', { modifier_source_value: 5 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by the label of its person when the source values are blank and the person is known', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-known-person', { modifier_source_value: '  ', procedure_source_value: '   ' }));
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by the label of its procedure concept when the person is unknown', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-unknown-person', { person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: Procedure Concept One', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by the label of its procedure concept when the person is null', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-null-person', { person_id: null, procedure_concept_id: 'concept-proc-2' }));
    await expect.element(screen.getByText('Edit item: Procedure Concept Two', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its id when neither the person nor the procedure concept is known', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-unknown-both', { person_id: 'person-unknown', procedure_concept_id: 'concept-unknown' }));
    await expect.element(screen.getByText('Edit item: po-unknown-both', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its id when the person is empty and the procedure concept is null', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-empty-person', { person_id: '', procedure_concept_id: null }));
    await expect.element(screen.getByText('Edit item: po-empty-person', { exact: true })).toBeVisible();
  });

  it('names a procedure occurrence by its id when the person is empty and the procedure concept is unknown', async () => {
    const screen = await openEditDialogForItem(buildProcedureOccurrenceFixture('po-empty-person-unknown-concept', { person_id: '', procedure_concept_id: 'concept-unknown' }));
    await expect.element(screen.getByText('Edit item: po-empty-person-unknown-concept', { exact: true })).toBeVisible();
  });

  it('creates a new procedure occurrence when the related options no longer include the selected values', async () => {
    const { screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);

    let personsRequestCount = 0;
    let conceptsRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personsRequestCount).toBe(1);
    await expect.poll(() => conceptsRequestCount).toBe(1);

    const postBodies = mockProcedureOccurrencePost();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ person_id: 'person-1', procedure_concept_id: 'concept-proc-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
