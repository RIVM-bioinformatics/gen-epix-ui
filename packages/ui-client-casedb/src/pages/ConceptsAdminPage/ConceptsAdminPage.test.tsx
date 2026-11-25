import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbConcept,
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

import { ConceptsAdminPage } from './ConceptsAdminPage';

type ConceptFixture = { readonly id: string } & CaseDbConcept;

const CONCEPTS_PATH = '/v1/concepts';
const CONCEPT_SET_ID = 'concept-set-1';
const OTHER_CONCEPT_SET_ID = 'concept-set-2';
const ROUTE_PATH = '/management/concept-sets/:conceptSetId/concepts';
const URL = `/management/concept-sets/${CONCEPT_SET_ID}/concepts`;

const CONCEPT_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const conceptAlphaFixture: ConceptFixture = {
  code: 'ALPHA',
  concept_set_id: CONCEPT_SET_ID,
  description: 'Alpha description',
  id: 'concept-alpha',
  name: 'Alpha concept',
  rank: 1,
};

const conceptBetaFixture: ConceptFixture = {
  code: 'BETA',
  concept_set_id: CONCEPT_SET_ID,
  description: null,
  id: 'concept-beta',
  name: 'Beta concept',
  rank: 2,
};

const conceptOtherSetFixture: ConceptFixture = {
  code: 'OTHER',
  concept_set_id: OTHER_CONCEPT_SET_ID,
  description: null,
  id: 'concept-other',
  name: 'Other set concept',
  rank: 1,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: ConceptFixture[] = [conceptAlphaFixture, conceptBetaFixture, conceptOtherSetFixture], permissions = CONCEPT_PERMISSIONS) => {
  const mock = mockCrudApi(CONCEPTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptsAdminPage />, {
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

describe('ConceptsAdminPage', () => {
  it('lists only the concepts of the concept set in the route', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha concept' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta concept' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Other set concept' }).query()).toBeNull();
  });

  it('creates a concept in the concept set of the route via the concepts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma concept');
    await screen.getByRole('textbox', { name: 'Code' }).fill('GAMMA');
    await screen.getByRole('spinbutton', { name: 'Rank' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CONCEPTS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      code: 'GAMMA',
      concept_set_id: CONCEPT_SET_ID,
      name: 'Gamma concept',
      rank: 3,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept and keeps it in the concept set of the route via the concepts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha concept', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPTS_PATH}/concept-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      concept_set_id: CONCEPT_SET_ID,
      id: 'concept-alpha',
      name: 'Alpha renamed',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept via the concepts endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPTS_PATH}/concept-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([conceptAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha concept' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
