import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
  CaseDbDisease,
  CaseDbEtiologicalAgent,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { CaseTypesAdminPage } from './CaseTypesAdminPage';

type CaseTypeFixture = { readonly id: string } & CaseDbCaseType;

const CASE_TYPES_PATH = '/v1/case_types';
const DISEASES_PATH = '/v1/diseases';
const ETIOLOGICAL_AGENTS_PATH = '/v1/etiological_agents';
const ROUTE_PATH = '/management/case-types';
const URL = '/management/case-types';

const CASE_TYPE_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const DIM_READ_PERMISSION: CaseDbApiPermission = {
  command_name: CaseDbCommandName.DimCrudCommand,
  permission_type: CaseDbPermissionType.READ,
};

const DISEASE_MEASLES_ID = '5c1d6f2e-7a3b-4c8d-9e0f-1a2b3c4d5e6f';
const DISEASE_TUBERCULOSIS_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const AGENT_VIRUS_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const AGENT_BACTERIA_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const diseaseMeaslesFixture: { readonly id: string } & CaseDbDisease = {
  icd_code: null,
  id: DISEASE_MEASLES_ID,
  name: 'Measles',
};

const diseaseTuberculosisFixture: { readonly id: string } & CaseDbDisease = {
  icd_code: null,
  id: DISEASE_TUBERCULOSIS_ID,
  name: 'Tuberculosis',
};

const agentVirusFixture: { readonly id: string } & CaseDbEtiologicalAgent = {
  id: AGENT_VIRUS_ID,
  name: 'Virus agent',
  type: 'VIRUS',
};

const agentBacteriaFixture: { readonly id: string } & CaseDbEtiologicalAgent = {
  id: AGENT_BACTERIA_ID,
  name: 'Bacteria agent',
  type: 'BACTERIUM',
};

const caseTypeMeaslesFixture: CaseTypeFixture = {
  description: 'Measles description',
  disease_id: DISEASE_MEASLES_ID,
  etiological_agent_id: null,
  id: 'case-type-measles',
  name: 'Measles case type',
  props: {
    create_max_n_cases: 101,
    delete_max_n_cases: 102,
    read_max_n_cases: 103,
    read_max_tree_size: 104,
    update_max_n_cases: 105,
  },
};

const caseTypeTuberculosisFixture: CaseTypeFixture = {
  description: null,
  disease_id: null,
  etiological_agent_id: AGENT_BACTERIA_ID,
  id: 'case-type-tuberculosis',
  name: 'Tuberculosis case type',
  props: {
    create_max_n_cases: 201,
    delete_max_n_cases: 202,
    read_max_n_cases: 203,
    read_max_tree_size: 204,
    update_max_n_cases: 205,
  },
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: CaseTypeFixture[] = [caseTypeMeaslesFixture, caseTypeTuberculosisFixture], permissions = CASE_TYPE_PERMISSIONS) => {
  const mock = mockCrudApi(CASE_TYPES_PATH, initialItems);
  mockApiRequest('GET', DISEASES_PATH, () => Response.json([diseaseMeaslesFixture, diseaseTuberculosisFixture]));
  mockApiRequest('GET', ETIOLOGICAL_AGENTS_PATH, () => Response.json([agentVirusFixture, agentBacteriaFixture]));
  const screen = await renderRoutedPage(
    <CaseTypesAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('CaseTypesAdminPage', () => {
  it('lists the case types with their disease, etiological agent and limits', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Measles case type' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Tuberculosis case type' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Measles' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Bacteria agent' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '103' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '104' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '205' })).toBeInTheDocument();
  });

  it('creates a case type with its limits packed into props', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new case type', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma case type');
    await screen.getByRole('combobox', { name: 'Disease' }).click();
    await screen.getByRole('option', { exact: true, name: 'Measles' }).click();
    await screen.getByRole('spinbutton', { name: 'Read max number of cases' }).fill('301');
    await screen.getByRole('spinbutton', { name: 'Create max number of cases' }).fill('302');
    await screen.getByRole('spinbutton', { name: 'Update max number of cases' }).fill('303');
    await screen.getByRole('spinbutton', { name: 'Delete max number of cases' }).fill('304');
    await screen.getByRole('spinbutton', { name: 'Read max tree size' }).fill('305');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CASE_TYPES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      disease_id: DISEASE_MEASLES_ID,
      name: 'Gamma case type',
      props: {
        create_max_n_cases: 302,
        delete_max_n_cases: 304,
        read_max_n_cases: 301,
        read_max_tree_size: 305,
        update_max_n_cases: 303,
      },
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('requires a disease or an etiological agent when creating a case type', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new case type', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma case type');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Disease is required when no etiological agent is selected', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Etiological agent is required when no disease is selected', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('edits a case type and sends the limits in props', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Measles case type', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Measles case type renamed');
    await screen.getByRole('spinbutton', { name: 'Read max number of cases' }).fill('999');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CASE_TYPES_PATH}/case-type-measles`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      disease_id: DISEASE_MEASLES_ID,
      id: 'case-type-measles',
      name: 'Measles case type renamed',
      props: {
        create_max_n_cases: 101,
        delete_max_n_cases: 102,
        read_max_n_cases: 999,
        read_max_tree_size: 104,
        update_max_n_cases: 105,
      },
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a case type', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CASE_TYPES_PATH}/case-type-measles`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('shows the manage dimensions sub page and navigates to it when the user may read dimensions', async () => {
    const { screen } = await renderPage([caseTypeMeaslesFixture], [...CASE_TYPE_PERMISSIONS, DIM_READ_PERMISSION]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Manage dimensions' }).click();

    await expect.poll(() => window.location.pathname).toBe('/management/case-types/case-type-measles/dimensions');
  });

  it('hides the manage dimensions sub page without dimension read permission', async () => {
    const { screen } = await renderPage([caseTypeMeaslesFixture]);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage dimensions' }).query()).toBeNull();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([caseTypeMeaslesFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Measles case type' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
