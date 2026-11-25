import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbOutage,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { NotificationService } from '../../classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '../../test/lib';

import { OutagesAdminPage } from './OutagesAdminPage';

type OutageFixture = { readonly id: string } & CommonDbOutage;

const OUTAGES_PATH = '/v1/outages';

const OUTAGE_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const outageOneFixture: OutageFixture = {
  description: 'Planned maintenance',
  id: 'outage-1',
  is_active: true,
  is_visible: false,
};

const outageTwoFixture: OutageFixture = {
  description: 'Network incident',
  id: 'outage-2',
  is_active: false,
  is_visible: true,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: OutageFixture[] = [outageOneFixture, outageTwoFixture], permissions = OUTAGE_PERMISSIONS) => {
  const mock = mockCrudApi(OUTAGES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <OutagesAdminPage />, { permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const selectBooleanOption = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, optionName: 'No' | 'Yes') => {
  await screen.getByRole('combobox', { name: label }).click();
  await screen.getByRole('option', { name: optionName }).click();
};

describe('OutagesAdminPage', () => {
  it('lists the outages with their active and visible flags', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('Is active', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Is visible', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Yes').first()).toBeInTheDocument();
    await expect.element(screen.getByText('No').first()).toBeInTheDocument();
  });

  it('creates an outage with the selected active and visible flags', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new outage', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Description' }).fill('Scheduled upgrade');
    await selectBooleanOption(screen, 'Is active', 'Yes');
    await selectBooleanOption(screen, 'Is visible', 'No');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(OUTAGES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ description: 'Scheduled upgrade', is_active: true, is_visible: false }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an outage and saves the changed flags', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Planned maintenance', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Description' }).fill('Maintenance extended');
    await selectBooleanOption(screen, 'Is active', 'No');
    await selectBooleanOption(screen, 'Is visible', 'Yes');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${OUTAGES_PATH}/outage-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ description: 'Maintenance extended', id: 'outage-1', is_active: false, is_visible: true }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an outage and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${OUTAGES_PATH}/outage-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([outageOneFixture], []);

    await expect.element(screen.getByText('Is active', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
