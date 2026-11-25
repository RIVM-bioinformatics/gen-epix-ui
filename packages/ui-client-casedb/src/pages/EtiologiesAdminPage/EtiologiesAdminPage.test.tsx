import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbDisease,
  CaseDbEtiologicalAgent,
  CaseDbEtiology,
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

import { EtiologiesAdminPage } from './EtiologiesAdminPage';

type EtiologyFixture = { readonly id: string } & CaseDbEtiology;

const ETIOLOGIES_PATH = '/v1/etiologies';
const DISEASES_PATH = '/v1/diseases';
const AGENTS_PATH = '/v1/etiological_agents';
const ROUTE_PATH = '/management/etiologies';
const URL = '/management/etiologies';

const DISEASE_ALPHA_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const DISEASE_BETA_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const AGENT_ALPHA_ID = '9b2e1c4a-6d8f-4a3b-8c5e-1f2a3b4c5d6e';
const AGENT_BETA_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const ETIOLOGY_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.EtiologyCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.EtiologyCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.EtiologyCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const diseaseAlphaFixture: CaseDbDisease = {
  id: DISEASE_ALPHA_ID,
  name: 'Anthrax',
};

const diseaseBetaFixture: CaseDbDisease = {
  id: DISEASE_BETA_ID,
  name: 'Influenza',
};

const agentAlphaFixture: CaseDbEtiologicalAgent = {
  id: AGENT_ALPHA_ID,
  name: 'Bacillus anthracis',
  type: 'bacterium',
};

const agentBetaFixture: CaseDbEtiologicalAgent = {
  id: AGENT_BETA_ID,
  name: 'Influenza A virus',
  type: 'virus',
};

const etiologyAlphaFixture: EtiologyFixture = {
  disease_id: DISEASE_ALPHA_ID,
  etiological_agent_id: AGENT_ALPHA_ID,
  id: 'etiology-alpha',
};

const etiologyBetaFixture: EtiologyFixture = {
  disease_id: DISEASE_BETA_ID,
  etiological_agent_id: AGENT_BETA_ID,
  id: 'etiology-beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: EtiologyFixture[] = [etiologyAlphaFixture, etiologyBetaFixture], permissions = ETIOLOGY_PERMISSIONS) => {
  mockApiRequest('GET', DISEASES_PATH, () => Response.json([diseaseAlphaFixture, diseaseBetaFixture]));
  mockApiRequest('GET', AGENTS_PATH, () => Response.json([agentAlphaFixture, agentBetaFixture]));
  const mock = mockCrudApi(ETIOLOGIES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <EtiologiesAdminPage />, {
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

describe('EtiologiesAdminPage', () => {
  it('lists the etiologies with their disease and etiological agent names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Anthrax' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Bacillus anthracis' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza A virus' })).toBeInTheDocument();
  });

  it('creates an etiology via the etiologies endpoint', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new etiology', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Disease' }).click();
    await screen.getByRole('option', { exact: true, name: 'Influenza' }).click();
    await screen.getByRole('combobox', { name: 'Etiological agent' }).click();
    await screen.getByRole('option', { exact: true, name: 'Influenza A virus' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(ETIOLOGIES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ disease_id: DISEASE_BETA_ID, etiological_agent_id: AGENT_BETA_ID }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an etiology via the etiologies endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: etiology-alpha', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Etiological agent' }).click();
    await screen.getByRole('option', { exact: true, name: 'Influenza A virus' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${ETIOLOGIES_PATH}/etiology-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ etiological_agent_id: AGENT_BETA_ID, id: 'etiology-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an etiology via the etiologies endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${ETIOLOGIES_PATH}/etiology-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([etiologyAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Anthrax' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
