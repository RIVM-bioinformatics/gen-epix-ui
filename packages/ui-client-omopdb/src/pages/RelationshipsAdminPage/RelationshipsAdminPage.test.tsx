import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbRelationship,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { RelationshipsAdminPage } from './RelationshipsAdminPage';

type RelationshipFixture = { readonly id: string } & OmopDbRelationship;

const RELATIONSHIPS_PATH = '/v1/Relationships';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/relationships';
const URL = '/management/relationships';

const RELATIONSHIP_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.RelationshipCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.RelationshipCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.RelationshipCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createRelationshipFixture = (overrides: Partial<RelationshipFixture> & Pick<RelationshipFixture, 'relationship_id'>): RelationshipFixture => {
  return {
    defines_ancestry: 'N',
    id: overrides.relationship_id,
    is_hierarchical: 'N',
    relationship_concept_id: 'concept-1',
    relationship_name: '',
    relationship_str_id: '',
    reverse_relationship_id: '',
    reverse_relationship_str_id: '',
    ...overrides,
  };
};

const relationshipAlphaFixture = createRelationshipFixture({
  defines_ancestry: 'N',
  is_hierarchical: 'Y',
  relationship_id: 'rel-alpha',
  relationship_name: 'Alpha',
  relationship_str_id: 'REL-ALPHA',
  reverse_relationship_id: 'rel-beta',
  reverse_relationship_str_id: 'REL-BETA',
});

const relationshipBetaFixture = createRelationshipFixture({
  defines_ancestry: 'Y',
  is_hierarchical: 'N',
  relationship_id: 'rel-beta',
  relationship_name: 'Beta',
  relationship_str_id: 'REL-BETA',
  reverse_relationship_id: 'rel-alpha',
  reverse_relationship_str_id: 'REL-ALPHA',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockRelationshipPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', RELATIONSHIPS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbRelationship>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-relationship', relationship_id: 'created-relationship' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([{ concept_id: 'concept-1', concept_name: 'Inpatient' }]));
};

const renderPage = async (initialItems: RelationshipFixture[] = [relationshipAlphaFixture, relationshipBetaFixture], permissions = RELATIONSHIP_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(RELATIONSHIPS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <RelationshipsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForItem = async (item: RelationshipFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('RelationshipsAdminPage', () => {
  it('lists the relationships from the relationships endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'REL-ALPHA' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' }).first()).toBeInTheDocument();
  });

  it('creates a relationship via the relationships endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRelationshipPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new relationship', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Str ID' }).fill('REL-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Name' }).fill('New relation');
    await screen.getByRole('textbox', { exact: true, name: 'Is Hierarchical' }).fill('Y');
    await screen.getByRole('textbox', { exact: true, name: 'Defines Ancestry' }).fill('N');
    await screen.getByRole('combobox', { name: 'Reverse Relationship ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Beta' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Reverse Relationship Str ID' }).fill('REL-NEW-REVERSE');
    await screen.getByRole('combobox', { name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({
      defines_ancestry: 'N',
      is_hierarchical: 'Y',
      relationship_concept_id: 'concept-1',
      relationship_name: 'New relation',
      relationship_str_id: 'REL-NEW',
      reverse_relationship_id: 'rel-beta',
      reverse_relationship_str_id: 'REL-NEW-REVERSE',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a relationship via the relationships endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${RELATIONSHIPS_PATH}/rel-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ relationship_id: 'rel-alpha', relationship_name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a relationship via the relationships endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${RELATIONSHIPS_PATH}/rel-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([relationshipAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'REL-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a relationship by its relationship name', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-named', relationship_name: 'Named' }));
    await expect.element(screen.getByText('Edit item: Named', { exact: true })).toBeVisible();
  });

  it('names a relationship by its numeric relationship name', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-number-name', relationship_name: 7 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a relationship by its relationship str id when the name is blank', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-str', relationship_name: '   ', relationship_str_id: 'REL-STR' }));
    await expect.element(screen.getByText('Edit item: REL-STR', { exact: true })).toBeVisible();
  });

  it('names a relationship by its numeric relationship str id when the name is blank', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-number-str', relationship_str_id: 5 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a relationship by its reverse relationship str id when the name and relationship str id are blank', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-reverse-str', relationship_str_id: '  ', reverse_relationship_str_id: 'REV-STR' }));
    await expect.element(screen.getByText('Edit item: REV-STR', { exact: true })).toBeVisible();
  });

  it('names a relationship by its numeric reverse relationship str id when the other names are blank', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-number-reverse', reverse_relationship_str_id: 8 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a relationship by the id of its reverse relationship option when that option has no name', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-self', reverse_relationship_id: 'rel-self' }));
    await expect.element(screen.getByText('Edit item: rel-self', { exact: true })).toBeVisible();
  });

  it('names a relationship by its id when the reverse relationship is not a known option', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-edit-unknown', reverse_relationship_id: 'rel-unknown' }));
    await expect.element(screen.getByText('Edit item: rel-edit-unknown', { exact: true })).toBeVisible();
  });

  it('names a relationship by its id when the reverse relationship id is empty', async () => {
    const screen = await openEditDialogForItem(createRelationshipFixture({ relationship_id: 'rel-empty-reverse', reverse_relationship_id: '' }));
    await expect.element(screen.getByText('Edit item: rel-empty-reverse', { exact: true })).toBeVisible();
  });

  it('names an unsaved relationship by the label of its selected reverse relationship', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockRelationshipPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Str ID' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Name' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'Is Hierarchical' }).fill('N');
    await screen.getByRole('textbox', { exact: true, name: 'Defines Ancestry' }).fill('N');
    await screen.getByRole('combobox', { name: 'Reverse Relationship ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Beta' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Reverse Relationship Str ID' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ reverse_relationship_id: 'rel-beta' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Beta"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved relationship by its selected reverse relationship id when that option is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockRelationshipPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Str ID' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'Relationship Name' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'Is Hierarchical' }).fill('N');
    await screen.getByRole('textbox', { exact: true, name: 'Defines Ancestry' }).fill('N');
    await screen.getByRole('combobox', { name: 'Reverse Relationship ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Beta' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Reverse Relationship Str ID' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Relationship Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();

    let relationshipRequestCount = 0;
    mockApiRequest('GET', RELATIONSHIPS_PATH, () => {
      relationshipRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.RELATIONSHIPS) });
    await expect.poll(() => relationshipRequestCount).toBeGreaterThan(0);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ reverse_relationship_id: 'rel-beta' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"rel-beta"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('lists the relationships fetched by the table when the options request failed', async () => {
    mockReferenceData();
    mockCrudApi(RELATIONSHIPS_PATH, []);
    let relationshipRequestCount = 0;
    mockApiRequest('GET', RELATIONSHIPS_PATH, () => {
      relationshipRequestCount += 1;
      if (relationshipRequestCount === 1) {
        return new Response(null, { status: 500 });
      }
      return Response.json([relationshipAlphaFixture, relationshipBetaFixture]);
    });
    const screen = await renderRoutedPage(
      <RelationshipsAdminPage />, {
        path: ROUTE_PATH,
        permissions: RELATIONSHIP_PERMISSIONS as unknown as CommonDbApiPermission[],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' }).first()).toBeInTheDocument();
    expect(relationshipRequestCount).toBeGreaterThanOrEqual(2);
  });
});
