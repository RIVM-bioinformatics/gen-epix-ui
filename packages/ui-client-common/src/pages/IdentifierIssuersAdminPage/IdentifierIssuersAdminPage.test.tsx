import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbIdentifierIssuer,
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

import { IdentifierIssuersAdminPage } from './IdentifierIssuersAdminPage';

type IdentifierIssuerFixture = { readonly id: string } & CommonDbIdentifierIssuer;

const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';

const IDENTIFIER_ISSUER_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const issuerOneFixture: IdentifierIssuerFixture = {
  code: 'ISS-A',
  description: 'First issuer description',
  id: 'issuer-1',
  name: 'Issuer A',
};

const issuerTwoFixture: IdentifierIssuerFixture = {
  code: 'ISS-B',
  description: 'Second issuer description',
  id: 'issuer-2',
  name: 'Issuer B',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: IdentifierIssuerFixture[] = [issuerOneFixture, issuerTwoFixture], permissions = IDENTIFIER_ISSUER_PERMISSIONS) => {
  const mock = mockCrudApi(IDENTIFIER_ISSUERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <IdentifierIssuersAdminPage />, { permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('IdentifierIssuersAdminPage', () => {
  it('lists the identifier issuers with their code and name', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('ISS-A', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Issuer A', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('ISS-B', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Issuer B', { exact: true })).toBeInTheDocument();
  });

  it('creates an identifier issuer and reports the created name', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new identifier issuer', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Issuer C');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Third issuer description');
    await screen.getByRole('textbox', { name: 'Code' }).fill('ISS-C');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(IDENTIFIER_ISSUERS_PATH);
    expect(postCall?.body).toEqual({ code: 'ISS-C', description: 'Third issuer description', name: 'Issuer C' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Issuer C')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an identifier issuer and reports the saved name', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Issuer A', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Issuer A renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${IDENTIFIER_ISSUERS_PATH}/issuer-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ code: 'ISS-A', name: 'Issuer A renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an identifier issuer and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${IDENTIFIER_ISSUERS_PATH}/issuer-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([issuerOneFixture], []);

    await expect.element(screen.getByText('Issuer A', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
  });
});
