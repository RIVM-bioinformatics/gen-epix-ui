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

import { DiseasesAdminPage } from './DiseasesAdminPage';

type DiseaseFixture = { readonly id: string } & CaseDbDisease;

const DISEASES_PATH = '/v1/diseases';
const ROUTE_PATH = '/management/diseases';
const URL = '/management/diseases';

const DISEASE_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const diseaseInfluenzaFixture: DiseaseFixture = {
  icd_code: 'J10',
  id: 'disease-influenza',
  name: 'Influenza',
};

const diseaseMeaslesFixture: DiseaseFixture = {
  icd_code: null,
  id: 'disease-measles',
  name: 'Measles',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: DiseaseFixture[] = [diseaseInfluenzaFixture, diseaseMeaslesFixture], permissions = DISEASE_PERMISSIONS) => {
  const mock = mockCrudApi(DISEASES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DiseasesAdminPage />, {
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

describe('DiseasesAdminPage', () => {
  it('lists the diseases with their name and ICD code from the diseases endpoint', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'J10' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Measles' })).toBeInTheDocument();
  });

  it('creates a disease via the diseases endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new disease', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Mumps');
    await screen.getByRole('textbox', { name: 'ICD Code' }).fill('B26');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(DISEASES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ icd_code: 'B26', name: 'Mumps' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a disease via the diseases endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Influenza', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'ICD Code' }).fill('J11');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DISEASES_PATH}/disease-influenza`);
    expect(putCall?.body).toEqual(expect.objectContaining({ icd_code: 'J11', id: 'disease-influenza', name: 'Influenza' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a disease via the diseases endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DISEASES_PATH}/disease-influenza`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([diseaseInfluenzaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Influenza' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
