import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbCost,
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

import { CostsAdminPage } from './CostsAdminPage';

type CostFixture = { readonly id: string } & OmopDbCost;

const COSTS_PATH = '/v1/Costs';
const CONCEPTS_PATH = '/v1/Concepts';
const DOMAINS_PATH = '/v1/Domains';
const ORGANIZATIONS_PATH = '/v1/organizations';
const PAYER_PLAN_PERIODS_PATH = '/v1/PayerPlanPeriods';
const ROUTE_PATH = '/management/costs';
const URL = '/management/costs';

const NUMBER_FIELD_KEYS = [
  'amount_allowed',
  'paid_by_patient',
  'paid_by_payer',
  'paid_by_primary',
  'paid_dispensing_fee',
  'paid_ingredient_cost',
  'paid_patient_coinsurance',
  'paid_patient_copay',
  'paid_patient_deductible',
  'total_charge',
  'total_cost',
  'total_paid',
];

const COST_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.CostCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.CostCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.CostCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const costAlphaFixture: CostFixture = {
  cost_domain_id: 'domain-1',
  cost_event_id: 'event-alpha',
  cost_id: 'cost-alpha',
  cost_type_concept_id: 'concept-1',
  id: 'cost-alpha',
  payer_plan_period_id: 'ppp-1',
  provided_by_organization_id: 'org-1',
  revenue_code_concept_id: 'concept-1',
  revenue_code_source_value: 'REV-1',
  total_charge: 10.5,
};

const costBetaFixture: CostFixture = {
  cost_domain_id: 'domain-2',
  cost_event_id: 'event-beta',
  cost_id: 'cost-beta',
  cost_type_concept_id: 'concept-2',
  drg_source_value: 'DRG-B',
  id: 'cost-beta',
  revenue_code_concept_id: null,
  revenue_code_source_value: null,
  total_charge: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `cost_id`.
 * The page maps the created item to a table row by `cost_id`, so the API response must include it.
 */
const mockCostPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', COSTS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbCost>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, cost_id: 'created-cost', id: 'created-cost' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
  mockApiRequest('GET', DOMAINS_PATH, () => Response.json([
    { domain_id: 'domain-1', domain_name: 'Domain One' },
    { domain_id: 'domain-2', domain_name: '   ' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([{ id: 'org-1', name: 'Org One' }]));
  mockApiRequest('GET', PAYER_PLAN_PERIODS_PATH, () => Response.json([{ payer_plan_period_id: 'ppp-1' }]));
};

const renderPage = async (initialItems: CostFixture[] = [costAlphaFixture, costBetaFixture], permissions = COST_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(COSTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CostsAdminPage />, {
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
const openEditDialogForItem = async (item: { id: string } & Record<string, unknown>) => {
  const { screen } = await renderPage([{ ...item, cost_id: item.id } as unknown as CostFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('CostsAdminPage', () => {
  it('lists the costs with their event, domain, concept, organization and payer plan period', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'event-alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'event-beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Domain One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'domain-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'REV-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DRG-B' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'ppp-1' })).toBeInTheDocument();
  });

  it('creates a cost via the costs endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCostPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new cost', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Domain One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Cost Event ID' }).fill('event-new');
    await screen.getByRole('spinbutton', { exact: true, name: 'Total Charge' }).fill('12.5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      cost_domain_id: 'domain-1',
      cost_event_id: 'event-new',
      cost_type_concept_id: 'concept-1',
      total_charge: 12.5,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('omits cleared number fields from the created cost', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockCostPost();
    const numberFieldLabels = [
      'Amount Allowed',
      'Paid By Patient',
      'Paid By Payer',
      'Paid By Primary',
      'Paid Dispensing Fee',
      'Paid Ingredient Cost',
      'Paid Patient Coinsurance',
      'Paid Patient Copay',
      'Paid Patient Deductible',
      'Total Charge',
      'Total Cost',
      'Total Paid',
    ];

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Domain One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Cost Event ID' }).fill('event-new');
    for (const label of numberFieldLabels) {
      const numberField = screen.getByRole('spinbutton', { exact: true, name: label });
      await numberField.fill('1');
      await numberField.fill('');
    }
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cost_event_id: 'event-new' }));
    for (const field of NUMBER_FIELD_KEYS) {
      expect(postBodies[0]).not.toHaveProperty(field);
    }
  });

  it('sends filled number fields as numbers in the created cost', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockCostPost();
    const numberFields: Array<[string, string, number]> = [
      ['Amount Allowed', 'amount_allowed', 1.5],
      ['Paid By Patient', 'paid_by_patient', 2.5],
      ['Paid By Payer', 'paid_by_payer', 3.5],
      ['Paid By Primary', 'paid_by_primary', 4.5],
      ['Paid Dispensing Fee', 'paid_dispensing_fee', 5.5],
      ['Paid Ingredient Cost', 'paid_ingredient_cost', 6.5],
      ['Paid Patient Coinsurance', 'paid_patient_coinsurance', 7.5],
      ['Paid Patient Copay', 'paid_patient_copay', 8.5],
      ['Paid Patient Deductible', 'paid_patient_deductible', 9.5],
      ['Total Charge', 'total_charge', 10.5],
      ['Total Cost', 'total_cost', 11.5],
      ['Total Paid', 'total_paid', 12.5],
    ];

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Domain One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Cost Event ID' }).fill('event-new');
    for (const [label, , value] of numberFields) {
      await screen.getByRole('spinbutton', { exact: true, name: label }).fill(String(value));
    }
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining(
      Object.fromEntries(numberFields.map(([, field, value]) => [field, value])),
    ));
  });

  it('names an unsaved cost by its selected domain id when the domain is no longer among the options', async () => {
    const { screen } = await renderPage([]);
    let releasePost: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postBodies = mockCostPost(responseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Domain ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Domain One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Cost Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Cost Event ID' }).fill('event-new');
    await screen.getByRole('textbox', { exact: true, name: 'Revenue Code Source Value' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'DRG Source Value' }).fill('   ');

    let domainRequestCount = 0;
    mockApiRequest('GET', DOMAINS_PATH, () => {
      domainRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.DOMAINS) });
    await expect.poll(() => domainRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cost_domain_id: 'domain-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"domain-1" is being saved')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a cost via the costs endpoint', async () => {
    const { mock, screen } = await renderPage([costAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'DRG Source Value' }).fill('DRG-9');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${COSTS_PATH}/cost-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ cost_domain_id: 'domain-1', cost_id: 'cost-alpha', drg_source_value: 'DRG-9' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a cost via the costs endpoint', async () => {
    const { mock, screen } = await renderPage([costAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Concept One', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${COSTS_PATH}/cost-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([costAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'REV-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('offers only the edit action with update permission alone', async () => {
    const { screen } = await renderPage([costAlphaFixture], [
      { command_name: OmopDbCommandName.CostCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
    ] as OmopDbApiPermission[]);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Delete' }).query()).toBeNull();
  });

  it('names a cost by its revenue code concept label', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, id: 'cost-rc', revenue_code_concept_id: 'concept-1' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a cost by its id when the revenue code concept is unknown and no other name is set', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, cost_domain_id: null, drg_source_value: null, id: 'cost-unknown-rc', revenue_code_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: cost-unknown-rc', { exact: true })).toBeVisible();
  });

  it('names a cost by its revenue code source value when the revenue code concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, id: 'cost-rc-source', revenue_code_concept_id: 'concept-unknown', revenue_code_source_value: 'REV-2' });
    await expect.element(screen.getByText('Edit item: REV-2', { exact: true })).toBeVisible();
  });

  it('names a cost by its revenue code source value when it is a number', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, revenue_code_concept_id: null, revenue_code_source_value: 42 });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('skips a blank revenue code source value and names a cost by its DRG source value', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, drg_source_value: 'DRG-7', revenue_code_concept_id: '', revenue_code_source_value: '   ' });
    await expect.element(screen.getByText('Edit item: DRG-7', { exact: true })).toBeVisible();
  });

  it('names a cost by its DRG source value when it is a number', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, drg_source_value: 7, revenue_code_concept_id: null, revenue_code_source_value: null });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a cost by its cost domain label when the other name fields are blank', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, cost_domain_id: 'domain-1', drg_source_value: '', revenue_code_concept_id: '', revenue_code_source_value: '' });
    await expect.element(screen.getByText('Edit item: Domain One', { exact: true })).toBeVisible();
  });

  it('names a cost by its id when the cost domain is unknown', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, cost_domain_id: 'domain-unknown', drg_source_value: null, id: 'cost-unknown-domain', revenue_code_concept_id: null, revenue_code_source_value: null });
    await expect.element(screen.getByText('Edit item: cost-unknown-domain', { exact: true })).toBeVisible();
  });

  it('names a cost by its id when the cost domain is empty', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, cost_domain_id: '', drg_source_value: null, id: 'cost-empty-domain', revenue_code_concept_id: null, revenue_code_source_value: null });
    await expect.element(screen.getByText('Edit item: cost-empty-domain', { exact: true })).toBeVisible();
  });

  it('names a cost by its id when both the revenue code concept and the cost domain are unknown', async () => {
    const screen = await openEditDialogForItem({ ...costBetaFixture, cost_domain_id: 'domain-unknown', drg_source_value: null, id: 'cost-both-unknown', revenue_code_concept_id: 'concept-unknown', revenue_code_source_value: null });
    await expect.element(screen.getByText('Edit item: cost-both-unknown', { exact: true })).toBeVisible();
  });
});
