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
  CaseDbConceptRelation,
  CaseDbConceptSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbConceptRelationType,
  CaseDbConceptSetType,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ConceptRelationsAdminPage } from './ConceptRelationsAdminPage';

type ConceptRelationFixture = { readonly id: string } & CaseDbConceptRelation;

const CONCEPT_RELATIONS_PATH = '/v1/concept_relations';
const CONCEPTS_PATH = '/v1/concepts';
const CONCEPT_SETS_PATH = '/v1/concept_sets';
const ROUTE_PATH = '/management/concept-relations';
const URL = '/management/concept-relations';

const CONCEPT_RELATION_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ConceptRelationCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.ConceptRelationCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.ConceptRelationCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const CONCEPT_SET_FIXTURE: CaseDbConceptSet = {
  code: 'SET_A',
  id: '5b1ab8c4-9f0e-4d3a-8b1c-7f2e6d5c4b3a',
  name: 'Set A',
  type: CaseDbConceptSetType.NOMINAL,
};

const CONCEPT_ONE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const CONCEPT_TWO_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CONCEPT_MISSING_ID = '6d1f8e2a-3c4b-4a5d-8e6f-7a8b9c0d1e2f';

const CONCEPTS: CaseDbConcept[] = [
  { code: 'C1', concept_set_id: CONCEPT_SET_FIXTURE.id, id: CONCEPT_ONE_ID, name: 'Concept one' },
  { code: 'C2', concept_set_id: CONCEPT_SET_FIXTURE.id, id: CONCEPT_TWO_ID, name: 'Concept two' },
];

const relationFixture: ConceptRelationFixture = {
  from_concept_id: CONCEPT_ONE_ID,
  id: 'relation-1',
  relation: CaseDbConceptRelationType.CONTAINS,
  to_concept_id: CONCEPT_TWO_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: ConceptRelationFixture[] = [relationFixture], permissions = CONCEPT_RELATION_PERMISSIONS) => {
  const mock = mockCrudApi(CONCEPT_RELATIONS_PATH, initialItems);
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json(CONCEPTS));
  mockApiRequest('GET', CONCEPT_SETS_PATH, () => Response.json([CONCEPT_SET_FIXTURE]));
  const screen = await renderRoutedPage(
    <ConceptRelationsAdminPage />, {
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

describe('ConceptRelationsAdminPage', () => {
  it('lists the concept relations with resolved concept names and relation type', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Set A -> Concept one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Set A -> Concept two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'CONTAINS' })).toBeInTheDocument();
  });

  it('shows the raw concept ids in the edit dialog title when a concept is unknown', async () => {
    const unknownRelation: ConceptRelationFixture = { ...relationFixture, id: 'relation-unknown', to_concept_id: CONCEPT_MISSING_ID };
    const { screen } = await renderPage([unknownRelation]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${CONCEPT_ONE_ID} -> ${CONCEPT_MISSING_ID}`, { exact: true })).toBeVisible();
  });

  it('creates a concept relation from the selected concepts and relation type', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept relation', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'From Concept' }).click();
    await screen.getByRole('option', { exact: true, name: 'Set A -> Concept two' }).click();
    await screen.getByRole('combobox', { name: 'To Concept' }).click();
    await screen.getByRole('option', { exact: true, name: 'Set A -> Concept one' }).click();
    await screen.getByRole('combobox', { name: 'Relation' }).click();
    await screen.getByRole('option', { exact: true, name: 'CONTAINS' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CONCEPT_RELATIONS_PATH);
    expect(postCall?.body).toEqual({
      from_concept_id: CONCEPT_TWO_ID,
      relation: CaseDbConceptRelationType.CONTAINS,
      to_concept_id: CONCEPT_ONE_ID,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a concept relation and saves it via the concept relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Concept one -> Concept two', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'To Concept' }).click();
    await screen.getByRole('option', { exact: true, name: 'Set A -> Concept one' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_RELATIONS_PATH}/relation-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ from_concept_id: CONCEPT_ONE_ID, id: 'relation-1', to_concept_id: CONCEPT_ONE_ID }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a concept relation via the concept relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_RELATIONS_PATH}/relation-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([relationFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'CONTAINS' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
