import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseSetStatus,
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

import { CaseSetStatusAdminPage } from './CaseSetStatusAdminPage';

type CaseSetStatusFixture = { readonly id: string } & CaseDbCaseSetStatus;

const STATUSES_PATH = '/v1/case_set_statuses';
const ROUTE_PATH = '/management/case-set-statuses';
const URL = '/management/case-set-statuses';

const STATUS_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseSetStatusCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.CaseSetStatusCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.CaseSetStatusCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const statusAlphaFixture: CaseSetStatusFixture = {
  description: 'Alpha description',
  id: 'status-alpha',
  name: 'Alpha',
  rank: 1,
};

const statusBetaFixture: CaseSetStatusFixture = {
  description: null,
  id: 'status-beta',
  name: 'Beta',
  rank: 2,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: CaseSetStatusFixture[] = [statusAlphaFixture, statusBetaFixture], permissions = STATUS_PERMISSIONS) => {
  const mock = mockCrudApi(STATUSES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CaseSetStatusAdminPage />, {
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

describe('CaseSetStatusAdminPage', () => {
  it('lists the case set statuses from the case set statuses endpoint', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' })).toBeInTheDocument();
  });

  it('creates a case set status via the case set statuses endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new case set status', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Gamma description');
    await screen.getByRole('spinbutton', { name: 'Rank' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(STATUSES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ description: 'Gamma description', name: 'Gamma', rank: 3 }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a case set status via the case set statuses endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${STATUSES_PATH}/status-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'status-alpha', name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a case set status via the case set statuses endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${STATUSES_PATH}/status-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([statusAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
