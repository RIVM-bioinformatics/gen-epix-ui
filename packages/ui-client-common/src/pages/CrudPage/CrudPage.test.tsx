import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { RouterProvider } from 'react-router-dom';
import { container } from 'tsyringe';
import {
  object,
  string,
} from 'yup';
import type { ObjectSchema } from 'yup';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type { DialogAction } from '@gen-epix/ui-core-components/components/Dialog';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { NotificationService } from '../../classes/services/NotificationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { RouterService } from '../../classes/services/RouterService';
import {
  COMMON_QUERY_DEPENDENCIES,
  COMMON_QUERY_KEY,
} from '../../constants/query.constants';
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';
import type { ConfigBase } from '../../models/config.models';
import type { GenericData } from '../../models/data.models';
import type { Loadable } from '../../models/data-hooks.models';
import type { TableColumn } from '../../models/table.models';
import { renderComponent } from '../../test/lib';

import { CrudPage } from './CrudPage';
import type { CrudPageProps } from './CrudPage';

type TestCrudPageProps = CrudPageProps<TestFormFields, TestItem>;

interface TestFormFields {
  readonly description: string;
  readonly name: string;
}

interface TestItem extends GenericData {
  readonly description: string;
  readonly name: string;
}

const CRUD_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const itemOneFixture: TestItem = {
  description: 'First description',
  id: 'item-1',
  name: 'Item one',
};

const itemTwoFixture: TestItem = {
  description: 'Second description',
  id: 'item-2',
  name: 'Item two',
};

const itemsFixture: TestItem[] = [itemOneFixture, itemTwoFixture];

const namelessItemFixture: TestItem = {
  description: 'Nameless description',
  id: 'nameless-1',
  name: '',
};

const nameField: FormFieldDefinition<TestFormFields> = {
  definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
  label: 'Name',
  name: 'name',
};

const descriptionField: FormFieldDefinition<TestFormFields> = {
  definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
  label: 'Description',
  name: 'description',
};

const schema: ObjectSchema<TestFormFields, TestFormFields> = object({
  description: string(),
  name: string(),
});

const columns: TableColumn<TestItem, null>[] = [
  {
    comparatorFactory: () => (first: TestItem, second: TestItem) => first.name.localeCompare(second.name),
    headerName: 'Name',
    id: 'name',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    comparatorFactory: () => (first: TestItem, second: TestItem) => first.description.localeCompare(second.description),
    headerName: 'Description',
    id: 'description',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: ({ row }) => row.description,
  },
];

const getName = (item: TestFormFields | TestItem): string => {
  if (!item.name) {
    throw new Error('Name is required to derive a display name');
  }
  return item.name;
};

const getNameOrEmpty = (item: TestFormFields | TestItem): string => item.name ?? '';

const createLoadable = (overrides: Partial<Loadable> = {}): Loadable => ({
  error: null,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  ...overrides,
});

const createProps = (overrides: Partial<TestCrudPageProps> = {}): TestCrudPageProps => ({
  defaultSortByField: 'name',
  defaultSortDirection: 'asc',
  fetchAll: vi.fn(async () => Promise.resolve(itemsFixture)),
  formFieldDefinitions: [nameField, descriptionField],
  getName,
  itemName: 'Item',
  resourceQueryKeyBase: COMMON_QUERY_KEY.OUTAGES,
  schema,
  tableColumns: columns,
  testIdAttributes: TestIdUtil.createAttributes('CrudPage'),
  title: 'Test items',
  ...overrides,
});

const ApplicationHeaderStub = () => (
  <div {...TestIdUtil.createAttributes('ApplicationHeaderStub')} />
);

const renderCrudPage = async (overrides: Partial<TestCrudPageProps> = {}) => {
  const props = createProps(overrides);
  const routerService = new RouterService({
    adminRoutes: [],
    homePageComponent: () => (
      <div>
        {'Home page'}
      </div>
    ),
    routes: [
      {
        element: (
          <div style={{ height: 800, width: 1200 }}>
            <CrudPage<TestFormFields, TestItem>
              {...props}
            />
          </div>
        ),
        handle: {
          requiredPermissions: [],
          requiresUserProfile: false,
          title: 'Test items',
        },
        path: '/',
      },
    ],
  });
  container.registerInstance(RouterService, routerService);
  const navigateSpy = vi.spyOn(routerService.router, 'navigate').mockResolvedValue(undefined);
  const screen = await renderComponent(
    <RouterProvider router={routerService.router} />,
    {
      configure: (config: ConfigBase) => {
        config.ApplicationHeader = ApplicationHeaderStub;
        config.createFooter = () => ({ sections: [] });
        config.enablePageEvents = false;
      },
    },
  );
  return { navigateSpy, props, screen };
};

const grantPermissions = (permissions: CommonDbApiPermission[] = CRUD_PERMISSIONS) => {
  container.resolve(AuthorizationService).apiPermissions = permissions;
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const openRowActions = async (screen: Awaited<ReturnType<typeof renderCrudPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('CrudPage', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    grantPermissions([]);
  });

  it('renders the title, the rows returned by fetchAll and calls onRowsChange', async () => {
    const onRowsChange = vi.fn();
    const { props, screen } = await renderCrudPage({ onRowsChange });

    await expect.element(screen.getByText('Item one', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Item two', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Test items', { exact: true })).toBeInTheDocument();
    await expect.poll(() => onRowsChange.mock.calls.length).toBeGreaterThan(0);
    expect(props.fetchAll).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(document.title).toContain('Test items');
  });

  it('joins an array title with an arrow separator and prefers contentHeader for the caption', async () => {
    const { screen } = await renderCrudPage({ title: ['Parent', 'Child'] });

    await expect.element(screen.getByText('Parent -> Child', { exact: true })).toBeInTheDocument();
  });

  it('shows the content header instead of the title in the caption', async () => {
    const { screen } = await renderCrudPage({ contentHeader: 'Custom header' });

    await expect.element(screen.getByText('Custom header', { exact: true })).toBeInTheDocument();
  });

  it('shows an error message and hides the rows when fetchAll fails', async () => {
    const { screen } = await renderCrudPage({
      fetchAll: vi.fn(async () => Promise.reject(new Error('Boom'))),
    });

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Item one', { exact: true }).query()).toBeNull();
  });

  it('hides the create button when fetchAll fails even if the user has create permission', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      createOne: vi.fn(async () => Promise.resolve(itemOneFixture)),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      fetchAll: vi.fn(async () => Promise.reject(new Error('Boom'))),
    });

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('shows a loading state while fetchAll is pending', async () => {
    const { screen } = await renderCrudPage({
      fetchAll: vi.fn(async () => new Promise<TestItem[]>(() => undefined)),
    });

    expect(screen.getByText('Item one', { exact: true }).query()).toBeNull();
    await expect.element(screen.getByRole('heading', { exact: true, level: 2, name: 'Test items' })).toBeInTheDocument();
  });

  it('shows the error of a loadable and hides the rows', async () => {
    const { screen } = await renderCrudPage({
      loadables: [createLoadable({ error: new Error('Loadable boom') })],
    });

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Item one', { exact: true }).query()).toBeNull();
  });

  it('shows a loading state while a loadable is loading', async () => {
    const { screen } = await renderCrudPage({
      loadables: [createLoadable({ isLoading: true })],
    });

    expect(screen.getByText('Item one', { exact: true }).query()).toBeNull();
    await expect.element(screen.getByRole('heading', { exact: true, level: 2, name: 'Test items' })).toBeInTheDocument();
  });

  it('renders the custom create button text and additional content actions when the user can create', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      contentActions: (
        <button type={'button'}>
          {'Extra content action'}
        </button>
      ),
      createItemButtonText: 'Add outage',
      createOne: vi.fn(async () => Promise.resolve(itemOneFixture)),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
    });

    await expect.element(screen.getByRole('button', { name: 'Add outage' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Extra content action' })).toBeInTheDocument();
  });

  it('renders only the content actions when the user cannot create items', async () => {
    const { screen } = await renderCrudPage({
      contentActions: (
        <button type={'button'}>
          {'Extra content action'}
        </button>
      ),
      createOne: vi.fn(async () => Promise.resolve(itemOneFixture)),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
    });

    await expect.element(screen.getByRole('button', { name: 'Extra content action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('does not show the create button when createOne is not provided', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
    });

    await expect.element(screen.getByText('Item one', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('creates an item through the edit dialog and reports success', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const createOne = vi.fn(async (values: TestFormFields) => Promise.resolve({ ...values, id: 'item-3' }));
    const onCreateSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      createItemDialogTitle: 'New outage',
      createOne,
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onCreateSuccess,
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('New outage', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Fresh item');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Fresh description');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => createOne.mock.calls.length).toBe(1);
    expect(createOne.mock.calls[0][0]).toEqual(expect.objectContaining({ name: 'Fresh item' }));
    await expect.poll(() => onCreateSuccess.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('reports a create error with the item name and calls onCreateError', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onCreateError = vi.fn();
    const { screen } = await renderCrudPage({
      createOne: vi.fn(async () => Promise.reject(new Error('Create failed'))),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onCreateError,
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Broken item');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onCreateError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created.')]));
  });

  it('uses the without-name notification message when the saved item has no derivable name', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const createOne = vi.fn(async (values: TestFormFields) => Promise.resolve({ ...values, id: 'item-4' }));
    const { screen } = await renderCrudPage({
      createOne,
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Description' }).fill('No name here');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => createOne.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringMatching(/^Item has been created\.?$/)]));
  });

  it('opens the edit dialog from the row and saves changes through updateOne', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const updateOne = vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values }));
    const onEditSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onEditSuccess,
      updateOne,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Item one', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Description' }).fill('Updated description');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => updateOne.mock.calls.length).toBe(1);
    expect(updateOne.mock.calls[0][1]).toEqual(itemOneFixture);
    await expect.poll(() => onEditSuccess.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('reports an edit error and calls onEditError', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onEditError = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onEditError,
      updateOne: vi.fn(async () => Promise.reject(new Error('Update failed'))),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onEditError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved.')]));
  });

  it('uses the optimistic intermediate item and form values from the item when editing', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const getFormValuesFromItem = vi.fn((item: TestItem) => ({ description: item.description, name: item.name }));
    const getOptimisticUpdateIntermediateItem = vi.fn((variables: TestFormFields, previousItem: TestItem) => ({ ...previousItem, ...variables }));
    const updateOne = vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values }));
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      getFormValuesFromItem,
      getOptimisticUpdateIntermediateItem,
      updateOne,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Item one', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => updateOne.mock.calls.length).toBe(1);
    expect(getFormValuesFromItem).toHaveBeenCalledWith(itemOneFixture);
  });

  it('disables saving in the edit dialog when the user cannot edit the item', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      canEditItem: (item) => item.id !== 'item-1',
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Item one', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('disables saving in the edit dialog when the user has no update permission', async () => {
    grantPermissions([]);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Item one', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('deletes an item from the row actions and reports success', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const deleteOne = vi.fn(async (_item: TestItem) => Promise.resolve());
    const onDeleteSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne,
      onDeleteSuccess,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => deleteOne.mock.calls.length).toBe(1);
    expect(deleteOne.mock.calls[0][0]).toEqual(itemOneFixture);
    await expect.poll(() => onDeleteSuccess.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('reports a delete error and calls onDeleteError', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onDeleteError = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne: vi.fn(async () => Promise.reject(new Error('Delete failed'))),
      onDeleteError,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => onDeleteError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
  });

  it('does not show the delete action without delete permission', async () => {
    grantPermissions([]);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne: vi.fn(async () => Promise.resolve()),
    });

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' }).query()).toBeNull();
  });

  it('requires the extra delete permissions in addition to the crud permission', async () => {
    grantPermissions([{ command_name: CommonDbCommandName.OutageCrudCommand, permission_type: CommonDbPermissionType.DELETE }]);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne: vi.fn(async () => Promise.resolve()),
      extraDeleteOnePermissions: [{ command_name: CommonDbCommandName.RetrieveOutagesCommand, permission_type: CommonDbPermissionType.EXECUTE }],
    });

    await openRowActions(screen);
    expect(screen.getByRole('menuitem', { name: 'Delete' }).query()).toBeNull();
  });

  it('calls onShowItem from the show action and from a row click', async () => {
    grantPermissions([]);
    const onShowItem = vi.fn();
    const { screen } = await renderCrudPage({ onShowItem });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Show' }).click();
    await expect.poll(() => onShowItem.mock.calls.length).toBe(1);
    expect(onShowItem).toHaveBeenCalledWith(expect.objectContaining({ row: itemOneFixture }));

    await screen.getByText('Item two', { exact: true }).click();
    await expect.poll(() => onShowItem.mock.calls.length).toBe(2);
  });

  it('prefers customOnRowClick over onShowItem when a row is clicked', async () => {
    grantPermissions([]);
    const customOnRowClick = vi.fn();
    const onShowItem = vi.fn();
    const { screen } = await renderCrudPage({ customOnRowClick, onShowItem });

    await screen.getByText('Item two', { exact: true }).click();
    await expect.poll(() => customOnRowClick.mock.calls.length).toBe(1);
    expect(onShowItem).not.toHaveBeenCalled();
  });

  it('opens the edit dialog on row click when no custom handler is provided', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await screen.getByText('Item two', { exact: true }).click();
    await expect.element(screen.getByText('Edit item: Item two', { exact: true })).toBeVisible();
  });

  it('clones a row into a new item through the row actions', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      createOne: vi.fn(async (values: TestFormFields) => Promise.resolve({ ...values, id: 'clone' })),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Clone' }).click();
    await expect.element(screen.getByText('Create new item', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Item one');
  });

  it('navigates to a sub page from the row actions and the edit dialog', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const subPages = [
      {
        getPathName: (item: TestItem) => `/sub?item=${item.id}`,
        label: 'Open sub page',
      },
    ];
    const { navigateSpy, screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      subPages,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    const countSubPageNavigations = () => navigateSpy.mock.calls.filter(([location]) => (location as { pathname?: string } | undefined)?.pathname === '/sub?item=item-1').length;

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Open sub page' }).click();
    await expect.poll(countSubPageNavigations).toBe(1);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Item one', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Open sub page' }).click();
    await expect.poll(countSubPageNavigations).toBe(2);
  });

  it('renders the extra row actions from extraActionsFactory and the extra edit dialog actions', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const extraActionsFactory = vi.fn(() => [
      <button
        key={'extra-row'}
        type={'button'}
      >
        {'Extra row action'}
      </button>,
    ]);
    const editDialogExtraActionsFactory = vi.fn((): DialogAction[] => [
      {
        label: 'Extra dialog action',
        onClick: () => undefined,
      },
    ]);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      editDialogExtraActionsFactory,
      extraActionsFactory,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await openRowActions(screen);
    await expect.element(screen.getByRole('button', { name: 'Extra row action' })).toBeInTheDocument();
    expect(extraActionsFactory).toHaveBeenCalled();

    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('button', { name: 'Extra dialog action' })).toBeInTheDocument();
    expect(editDialogExtraActionsFactory).toHaveBeenCalledWith(itemOneFixture);
  });

  it('renders the id column when showIdColumn is set', async () => {
    const { screen } = await renderCrudPage({ showIdColumn: true });

    await expect.element(screen.getByText('Id', { exact: true })).toBeInTheDocument();
  });

  it('passes the optional fetchAllSelect transform through to the query', async () => {
    const fetchAllSelect = vi.fn((items: TestItem[]) => items.filter((item) => item.id === 'item-2'));
    const { screen } = await renderCrudPage({ fetchAllSelect });

    await expect.element(screen.getByText('Item two', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Item one', { exact: true }).query()).toBeNull();
    expect(fetchAllSelect).toHaveBeenCalled();
  });

  it('invalidates the explicit association keys after an edit', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const queryClient = container.resolve(QueryClientService).queryClient;
    queryClient.setQueryData(['USERS'], []);
    const updateOne = vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values }));
    const onEditSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      associationQueryKeys: [['USERS']],
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onEditSuccess,
      resourceQueryKeyBase: 'SITES',
      updateOne,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { name: 'Description' }).fill('Updated description');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onEditSuccess.mock.calls.length).toBe(1);
    await expect.poll(() => queryClient.getQueryState(['USERS'])?.isInvalidated).toBe(true);
  });

  it('invalidates the queries that depend on the resource after an edit', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const dependencyService = new QueryClientService({
      config: DependencyContainerUtil.resolveConfig(),
      queryKeyDependencies: [COMMON_QUERY_DEPENDENCIES],
    });
    container.registerInstance(QueryClientService, dependencyService);
    const queryClient = dependencyService.queryClient;
    queryClient.setQueryData(['CONTACTS'], []);
    const updateOne = vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values }));
    const onEditSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onEditSuccess,
      resourceQueryKeyBase: 'SITES',
      updateOne,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { name: 'Description' }).fill('Updated description');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onEditSuccess.mock.calls.length).toBe(1);
    await expect.poll(() => queryClient.getQueryState(['CONTACTS'])?.isInvalidated).toBe(true);
  });

  it('renders the rows converted by convertToTableData', async () => {
    const convertToTableData = vi.fn((items: TestItem[]) => items.map(item => ({ ...item, name: item.name.toUpperCase() })));
    const { screen } = await renderCrudPage({ convertToTableData });

    await expect.element(screen.getByText('ITEM ONE', { exact: true })).toBeInTheDocument();
    expect(convertToTableData).toHaveBeenCalled();
  });

  it('grants the row actions when no crudCommandType is set and no extra permissions are required', async () => {
    grantPermissions([]);
    const { screen } = await renderCrudPage({
      createOne: vi.fn(async () => Promise.resolve(itemOneFixture)),
      deleteOne: vi.fn(async () => Promise.resolve()),
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeInTheDocument();
    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('uses the without-name messages when a nameless item is saved successfully', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onEditSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      fetchAll: vi.fn(async () => Promise.resolve([namelessItemFixture])),
      getName: getNameOrEmpty,
      onEditSuccess,
      updateOne: vi.fn(async (values: TestFormFields, item: TestItem) => Promise.resolve({ ...item, ...values })),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onEditSuccess.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Item has been saved.']));
  });

  it('uses the without-name messages when a nameless item cannot be saved', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onEditError = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      fetchAll: vi.fn(async () => Promise.resolve([namelessItemFixture])),
      getName: getNameOrEmpty,
      onEditError,
      updateOne: vi.fn(async () => Promise.reject(new Error('Update failed'))),
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onEditError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Item could not be saved.']));
  });

  it('uses the without-name messages when a nameless item is deleted successfully', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onDeleteSuccess = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne: vi.fn(async () => Promise.resolve()),
      fetchAll: vi.fn(async () => Promise.resolve([namelessItemFixture])),
      getName: getNameOrEmpty,
      onDeleteSuccess,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => onDeleteSuccess.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Item has been deleted.']));
  });

  it('uses the without-name messages when a nameless item cannot be deleted', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onDeleteError = vi.fn();
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      deleteOne: vi.fn(async () => Promise.reject(new Error('Delete failed'))),
      fetchAll: vi.fn(async () => Promise.resolve([namelessItemFixture])),
      getName: getNameOrEmpty,
      onDeleteError,
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => onDeleteError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Item could not be deleted.']));
  });

  it('uses the without-name messages when a new item without a name cannot be created', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const onCreateError = vi.fn();
    const { screen } = await renderCrudPage({
      createOne: vi.fn(async () => Promise.reject(new Error('Create failed'))),
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      onCreateError,
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Description' }).fill('No name here');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onCreateError.mock.calls.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Item could not be created.']));
  });

  it('renders the icon of a sub page when one is provided', async () => {
    grantPermissions(CRUD_PERMISSIONS);
    const { screen } = await renderCrudPage({
      crudCommandType: CommonDbCommandName.OutageCrudCommand,
      subPages: [
        {
          getPathName: (item: TestItem) => `/sub?item=${item.id}`,
          icon: (
            <span>
              {'Custom sub page icon'}
            </span>
          ),
          label: 'Open sub page',
        },
      ],
    });

    await openRowActions(screen);
    await expect.element(screen.getByText('Custom sub page icon', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: /Open sub page$/ })).toBeInTheDocument();
  });

  it('scopes the persisted table state with tableStoreStorageNamePostFix', async () => {
    const { screen } = await renderCrudPage({ tableStoreStorageNamePostFix: 'Outages' });

    await expect.element(screen.getByText('Item one', { exact: true })).toBeInTheDocument();
    await expect.poll(() => Object.keys(localStorage).some(key => key.includes('CRUDPage-OUTAGES-Outages'))).toBe(true);
  });
});
