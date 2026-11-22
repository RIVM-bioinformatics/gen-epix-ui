import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbEtiologicalAgent,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { EtiologicalAgentsAdminPage } from './EtiologicalAgentsAdminPage';

type EtiologicalAgentFixture = { readonly id: string } & CaseDbEtiologicalAgent;

const AGENTS_PATH = '/v1/etiological_agents';
const ROUTE_PATH = '/management/etiological-agents';
const URL = '/management/etiological-agents';

const AGENT_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const agentAlphaFixture: EtiologicalAgentFixture = {
  id: 'agent-alpha',
  name: 'Alpha virus',
  type: 'virus',
};

const agentBetaFixture: EtiologicalAgentFixture = {
  id: 'agent-beta',
  name: 'Beta bacterium',
  type: 'bacterium',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: EtiologicalAgentFixture[] = [agentAlphaFixture, agentBetaFixture], permissions = AGENT_PERMISSIONS) => {
  const mock = mockCrudApi(AGENTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <EtiologicalAgentsAdminPage />, {
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

describe('EtiologicalAgentsAdminPage', () => {
  it('lists the etiological agents from the etiological agents endpoint', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha virus' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta bacterium' })).toBeInTheDocument();
  });

  it('creates an etiological agent via the etiological agents endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new etiological agent', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma parasite');
    await screen.getByRole('textbox', { name: 'Type' }).fill('parasite');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(AGENTS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ name: 'Gamma parasite', type: 'parasite' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an etiological agent via the etiological agents endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha virus', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Type' }).fill('viral');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${AGENTS_PATH}/agent-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'agent-alpha', type: 'viral' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an etiological agent via the etiological agents endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${AGENTS_PATH}/agent-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([agentAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha virus' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
