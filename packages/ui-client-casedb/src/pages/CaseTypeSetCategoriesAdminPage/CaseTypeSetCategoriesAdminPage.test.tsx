import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseTypeSetCategory,
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

import { CaseTypeSetCategoriesAdminPage } from './CaseTypeSetCategoriesAdminPage';

type CaseTypeSetCategoryFixture = { readonly id: string } & CaseDbCaseTypeSetCategory;

const CATEGORIES_PATH = '/v1/case_type_set_categories';
const ROUTE_PATH = '/management/case-type-set-categories';
const URL = '/management/case-type-set-categories';

const CATEGORY_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const categoryAlphaFixture: CaseTypeSetCategoryFixture = {
  description: 'Alpha description',
  id: 'category-alpha',
  name: 'Alpha',
  purpose: 'CONTENT',
  rank: 1,
};

const categoryBetaFixture: CaseTypeSetCategoryFixture = {
  description: null,
  id: 'category-beta',
  name: 'Beta',
  purpose: 'SECURITY',
  rank: 2,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: CaseTypeSetCategoryFixture[] = [categoryAlphaFixture, categoryBetaFixture], permissions = CATEGORY_PERMISSIONS) => {
  const mock = mockCrudApi(CATEGORIES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CaseTypeSetCategoriesAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('CaseTypeSetCategoriesAdminPage', () => {
  it('lists the case type set categories with their purpose', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { name: 'Alpha', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'Beta', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'CONTENT', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'SECURITY', exact: true })).toBeInTheDocument();
  });

  it('creates a case type set category via the case type set categories endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new case type set category', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Gamma description');
    await screen.getByRole('spinbutton', { name: 'Rank' }).fill('3');
    await screen.getByRole('combobox', { name: 'Purpose' }).click();
    await screen.getByRole('option', { exact: true, name: 'SECURITY' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CATEGORIES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ description: 'Gamma description', name: 'Gamma', purpose: 'SECURITY', rank: 3 }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a case type set category via the case type set categories endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CATEGORIES_PATH}/category-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'category-alpha', name: 'Alpha renamed', purpose: 'CONTENT' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a case type set category via the case type set categories endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CATEGORIES_PATH}/category-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([categoryAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { name: 'Alpha', exact: true })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
