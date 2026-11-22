import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbPayerPlanPeriod,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { PayerPlanPeriodsAdminPage } from './PayerPlanPeriodsAdminPage';

type PayerPlanPeriodFixture = { readonly id: string } & OmopDbPayerPlanPeriod;

const PAYER_PLAN_PERIODS_PATH = '/v1/PayerPlanPeriods';
const ROUTE_PATH = '/management/payer-plan-periods';
const URL = '/management/payer-plan-periods';

const PAYER_PLAN_PERIOD_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.PayerPlanPeriodCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.PayerPlanPeriodCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.PayerPlanPeriodCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const payerPlanPeriodAlphaFixture: PayerPlanPeriodFixture = {
  id: 'ppp-alpha',
  payer_plan_period_end_date: '2021-06-30',
  payer_plan_period_id: 'ppp-alpha',
  payer_plan_period_start_date: '2021-01-01',
  payer_source_value: 'Payer Alpha',
  person_id: 'person-1',
  provenance_id: 'prov-alpha',
  provided_by_organization_id: 'org-1',
};

const payerPlanPeriodBetaFixture: PayerPlanPeriodFixture = {
  id: 'ppp-beta',
  payer_plan_period_end_date: '2022-06-30',
  payer_plan_period_id: 'ppp-beta',
  payer_plan_period_start_date: '2022-01-01',
  person_id: 'person-2',
  plan_concept_id: 'concept-1',
  source_traceback: 'trace-beta',
};

/**
 * The date inputs are serialized as Date strings, so the calendar parts are compared after parsing.
 */
const expectCalendarDate = (value: unknown, year: number, monthIndex: number, day: number) => {
  const parsed = new Date(value as string);
  expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([year, monthIndex, day]);
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `payer_plan_period_id`.
 * The page maps the created item to a table row by `payer_plan_period_id`, so the API response must include it.
 */
const mockPayerPlanPeriodPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', PAYER_PLAN_PERIODS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbPayerPlanPeriod>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-ppp', payer_plan_period_id: 'created-ppp' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/organizations', () => Response.json([{ id: 'org-1', name: 'Org One' }]));
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([{ concept_id: 'concept-1', concept_name: 'Inpatient' }]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([{ person_id: 'person-1' }, { person_id: 'person-2' }]));
};

const renderPage = async (initialItems: PayerPlanPeriodFixture[] = [payerPlanPeriodAlphaFixture, payerPlanPeriodBetaFixture], permissions = PAYER_PLAN_PERIOD_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(PAYER_PLAN_PERIODS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <PayerPlanPeriodsAdminPage />, {
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

const openEditDialogForItem = async (item: PayerPlanPeriodFixture) => {
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
  await fillDate(screen, 'Payer Plan Period Start Date', ['2023', '01', '01']);
  await fillDate(screen, 'Payer Plan Period End Date', ['2023', '02', '01']);
};

describe('PayerPlanPeriodsAdminPage', () => {
  it('lists the payer plan periods from the payer plan periods endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Payer Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'trace-beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates a payer plan period via the payer plan periods endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockPayerPlanPeriodPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new payer plan period', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('prov-new');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    const postBody = postBodies[0] as Record<string, unknown>;
    expect(postBody.person_id).toBe('person-1');
    expect(postBody.provenance_id).toBe('prov-new');
    expectCalendarDate(postBody.payer_plan_period_start_date, 2023, 0, 1);
    expectCalendarDate(postBody.payer_plan_period_end_date, 2023, 1, 1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved payer plan period without any name fields as new while the create request is pending', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    mockPayerPlanPeriodPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New payer plan period')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a payer plan period via the payer plan periods endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Payer Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Provenance ID' }).fill('prov-renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PAYER_PLAN_PERIODS_PATH}/ppp-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ payer_plan_period_id: 'ppp-alpha', provenance_id: 'prov-renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a payer plan period via the payer plan periods endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PAYER_PLAN_PERIODS_PATH}/ppp-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([payerPlanPeriodAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Payer Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a payer plan period by its payer source value', async () => {
    const screen = await openEditDialogForItem(payerPlanPeriodAlphaFixture);
    await expect.element(screen.getByText('Edit item: Payer Alpha', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its numeric payer source value', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, id: 'ppp-number-payer', payer_plan_period_id: 'ppp-number-payer', payer_source_value: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its plan source value when the payer source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, id: 'ppp-plan', payer_plan_period_id: 'ppp-plan', payer_source_value: '   ', plan_source_value: 'Plan Beta' });
    await expect.element(screen.getByText('Edit item: Plan Beta', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its numeric plan source value when the payer source value is missing', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, id: 'ppp-number-plan', payer_plan_period_id: 'ppp-number-plan', payer_source_value: null, plan_source_value: 8 as unknown as string });
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its sponsor source value when the payer and plan source values are missing', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, id: 'ppp-sponsor', payer_plan_period_id: 'ppp-sponsor', payer_source_value: null, plan_source_value: '', sponsor_source_value: 'Sponsor Gamma' });
    await expect.element(screen.getByText('Edit item: Sponsor Gamma', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its numeric sponsor source value', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, id: 'ppp-number-sponsor', payer_plan_period_id: 'ppp-number-sponsor', payer_source_value: null, plan_source_value: null, sponsor_source_value: 9 as unknown as string });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its family source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, family_source_value: 'Family Delta', id: 'ppp-family', payer_plan_period_id: 'ppp-family', payer_source_value: null, plan_source_value: null, sponsor_source_value: null });
    await expect.element(screen.getByText('Edit item: Family Delta', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its numeric family source value', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, family_source_value: 10 as unknown as string, id: 'ppp-number-family', payer_plan_period_id: 'ppp-number-family', payer_source_value: null, plan_source_value: null, sponsor_source_value: null });
    await expect.element(screen.getByText('Edit item: 10', { exact: true })).toBeVisible();
  });

  it('names a payer plan period by its id when none of the source values are set', async () => {
    const screen = await openEditDialogForItem({ ...payerPlanPeriodAlphaFixture, family_source_value: null, id: 'ppp-no-names', payer_plan_period_id: 'ppp-no-names', payer_source_value: null, plan_source_value: null, sponsor_source_value: null });
    await expect.element(screen.getByText('Edit item: ppp-no-names', { exact: true })).toBeVisible();
  });
});
