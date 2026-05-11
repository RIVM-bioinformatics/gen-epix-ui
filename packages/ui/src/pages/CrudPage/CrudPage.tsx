import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ObjectSchema } from 'yup';
import isArray from 'lodash/isArray';
import type {
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { CommonDbPermissionType } from '@gen-epix/api-commondb';

import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  Table,
  TableCaption,
  TableHeader,
  TableSidebarMenu,
} from '../../components/ui/Table';
import type { MutationContextCreate } from '../../hooks/useCreateMutation';
import { useCreateMutation } from '../../hooks/useCreateMutation';
import type { MutationContextDelete } from '../../hooks/useDeleteMutation';
import { useDeleteMutation } from '../../hooks/useDeleteMutation';
import type { MutationContextEdit } from '../../hooks/useEditMutation';
import { useEditMutation } from '../../hooks/useEditMutation';
import { useInitializeTableStore } from '../../hooks/useInitializeTableStore';
import type { GenericData } from '../../models/data';
import type { Loadable } from '../../models/dataHooks';
import type {
  TableColumn,
  TableRowParams,
  TableSortDirection,
} from '../../models/table';
import type { PropsWithTestIdAttributes } from '../../models/testId';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../stores/tableStore';
import { TableUtil } from '../../utils/TableUtil';
import type { DialogAction } from '../../components/ui/Dialog';
import type { FormFieldDefinition } from '../../models/form';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { LoadableUtil } from '../../utils/LoadableUtil';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { COMMON_QUERY_KEY } from '../../data/query';

import type { CrudPageEditDialogRefMethods } from './CrudPageEditDialog';
import { CrudPageEditDialog } from './CrudPageEditDialog';
import type { CrudPageDeleteDialogRefMethods } from './CrudPageDeleteDialog';
import { CrudPageDeleteDialog } from './CrudPageDeleteDialog';

export type CrudPageProps<
  TFormFields extends FieldValues,
  TData extends GenericData,
  TTableData extends TData = TData,
  TQueryKey extends string = COMMON_QUERY_KEY,
  TApiPermission extends {
    command_name: string;
    permission_type: string;
  } = CommonDbApiPermission,
  TCommandName extends TApiPermission['command_name'] = TApiPermission['command_name'],
> = PropsWithTestIdAttributes<{
  readonly associationQueryKeys?: string[][];
  readonly canEditItem?: (item: TData) => boolean;
  readonly contentActions?: ReactElement;
  readonly contentHeader?: string;
  readonly convertToTableData?: (items: TData[]) => TTableData[];
  readonly createItemButtonText?: string;
  readonly createItemDialogTitle?: string;
  readonly createOne?: (item: TFormFields) => Promise<TData>;
  readonly crudCommandType?: TCommandName;
  readonly customOnRowClick?: (params: TableRowParams<TData, null>) => void;
  readonly defaultNewItem?: Partial<TFormFields>;
  readonly defaultSortByField: keyof TTableData;
  readonly defaultSortDirection: TableSortDirection;
  readonly deleteOne?: (item: TData) => Promise<unknown>;
  readonly editDialogExtraActionsFactory?: (item: TData) => DialogAction[];
  readonly extraActionsFactory?: (params: TableRowParams<TData, null>) => ReactElement[];
  readonly extraCreateOnePermissions?: TApiPermission[];
  readonly extraDeleteOnePermissions?: TApiPermission[];
  readonly extraUpdateOnePermissions?: TApiPermission[];
  readonly fetchAll: (signal: AbortSignal) => Promise<TData[]>;
  readonly fetchAllSelect?: (data: TData[]) => TData[];
  readonly formFieldDefinitions: ((values: TFormFields, item: TData) => FormFieldDefinition<TFormFields>[]) | FormFieldDefinition<TFormFields>[];
  readonly getFormValuesFromItem?: (item: TData) => Partial<TFormFields>;
  readonly getName: (item: TData | TFormFields) => string;
  readonly getOptimisticUpdateIntermediateItem?: (variables: TFormFields, previousItem: TData) => TData;
  readonly loadables?: Loadable[];
  readonly onCreateError?: (error: unknown, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void> | void;
  readonly onCreateSuccess?: (item: TData, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void> | void;
  readonly onDeleteError?: (error: unknown, item: TData, context: MutationContextDelete<TData>) => Promise<void> | void;
  readonly onDeleteSuccess?: (item: TData, context: MutationContextDelete<TData>) => Promise<void> | void;
  readonly onEditError?: (error: unknown, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly onEditSuccess?: (item: TData, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly onFormChange?: (item: TData, formValues: TFormFields, formMethods: UseFormReturn<TFormFields>) => void;
  readonly onRowsChange?: (items: TData[]) => void;
  readonly onShowItem?: (params: TableRowParams<TTableData, null>) => void;
  readonly readOnly?: boolean;
  readonly resourceQueryKeyBase: TQueryKey;
  readonly schema?: ObjectSchema<TFormFields, TFormFields>;
  readonly showBreadcrumbs?: boolean;
  readonly showIdColumn?: boolean;
  readonly subPages?: CrudPageSubPage<TData>[];
  readonly tableColumns: TableColumn<TTableData, null>[];
  readonly tableStoreStorageNamePostFix?: string;
  readonly tableStoreStorageVersion?: number;
  readonly title: string | string[];
  readonly updateOne?: (variables: TFormFields, data: TData) => Promise<TData>;
}>;

export type CrudPageSubPage<TData extends GenericData> = {
  getPathName: (item: TData) => string;
  icon?: ReactElement;
  label: string;
};

export const CrudPage = <
  TFormFields extends FieldValues,
  TData extends GenericData,
  TTableData extends TData = TData,
  TQueryKey extends string = COMMON_QUERY_KEY,
  TApiPermission extends {
    command_name: string;
    permission_type: string;
  } = CommonDbApiPermission,
  TCommandName extends TApiPermission['command_name'] = TApiPermission['command_name'],
>({
  associationQueryKeys,
  canEditItem,
  contentActions,
  contentHeader,
  convertToTableData,
  createItemButtonText,
  createItemDialogTitle,
  createOne,
  crudCommandType,
  customOnRowClick,
  defaultNewItem,
  defaultSortByField,
  defaultSortDirection,
  deleteOne,
  editDialogExtraActionsFactory,
  extraActionsFactory,
  extraCreateOnePermissions,
  extraDeleteOnePermissions,
  extraUpdateOnePermissions,
  fetchAll,
  fetchAllSelect,
  formFieldDefinitions,
  getFormValuesFromItem,
  getName,
  getOptimisticUpdateIntermediateItem,
  loadables,
  onCreateError,
  onCreateSuccess,
  onDeleteError,
  onDeleteSuccess,
  onEditError,
  onEditSuccess,
  onFormChange,
  onRowsChange,
  onShowItem,
  resourceQueryKeyBase,
  schema,
  showIdColumn = false,
  subPages,
  tableColumns,
  tableStoreStorageNamePostFix,
  tableStoreStorageVersion,
  testIdAttributes,
  title,
  updateOne,
}: CrudPageProps<TFormFields, TData, TTableData, TQueryKey, TApiPermission, TCommandName>) => {
  type CrudPermission = Pick<TApiPermission, 'command_name' | 'permission_type'>;

  const { t } = useTranslation();
  const theme = useTheme();
  const deleteConfirmationRef = useRef<CrudPageDeleteDialogRefMethods<TData>>(null);
  const editDialogRef = useRef<CrudPageEditDialogRefMethods<TData, TFormFields>>(null);
  const authorizationManager = useMemo(() => AuthorizationManager.getInstance(), []);
  const resourceQueryKey = useMemo(() => [resourceQueryKeyBase], [resourceQueryKeyBase]);
  const tableStore = useMemo(() => createTableStore<TTableData, null>({
    defaultSortByField: defaultSortByField as string,
    defaultSortDirection,
    idSelectorCallback: (item) => item.id,
    navigatorFunction: RouterManager.getInstance().router.navigate,
    storageNamePostFix: tableStoreStorageNamePostFix ? `CRUDPage-${resourceQueryKeyBase}-${tableStoreStorageNamePostFix}` : `CRUDPage-${resourceQueryKeyBase}`,
    storageVersion: tableStoreStorageVersion ?? 1,
  }), [defaultSortByField, defaultSortDirection, resourceQueryKeyBase, tableStoreStorageNamePostFix, tableStoreStorageVersion]);

  const isLoadablesLoading = useMemo(() => {
    if (isArray(loadables)) {
      return LoadableUtil.isSomeLoading(loadables);
    }
    return false;
  }, [loadables]);

  const { data: rows, error: rowsError, isLoading: isRowsLoading } = useQueryMemo({
    enabled: !isLoadablesLoading,
    queryFn: async ({ signal }) => fetchAll(signal),
    queryKey: resourceQueryKey,
    select: fetchAllSelect,
  });

  useEffect(() => {
    if (onRowsChange && rows) {
      onRowsChange(rows);
    }
  }, [onRowsChange, rows]);

  const isLoading = useMemo(() => {
    if (isRowsLoading) {
      return true;
    }
    return isLoadablesLoading;
  }, [isRowsLoading, isLoadablesLoading]);

  const error = useMemo(() => {
    if (rowsError) {
      return rowsError;
    }
    if (isArray(loadables)) {
      return loadables.find((loadable) => loadable.error)?.error as Error;
    }
    return null;
  }, [rowsError, loadables]);

  const createPermission = useCallback((permissionType: CrudPermission['permission_type']): CrudPermission => {
    return {
      command_name: crudCommandType,
      permission_type: permissionType,
    };
  }, [crudCommandType]);

  const userCanEdit = useMemo(() => {
    if (!updateOne) {
      return false;
    }
    return authorizationManager.doesUserHavePermission<CrudPermission>(
      [
        ...(crudCommandType ? [createPermission(CommonDbPermissionType.UPDATE as CrudPermission['permission_type'])] : []),
        ...(extraUpdateOnePermissions ?? []),
      ],
    );
  }, [authorizationManager, createPermission, crudCommandType, extraUpdateOnePermissions, updateOne]);

  const userCanDelete = useMemo(() => {
    if (!deleteOne) {
      return false;
    }
    return authorizationManager.doesUserHavePermission<CrudPermission>(
      [
        ...(crudCommandType ? [createPermission(CommonDbPermissionType.DELETE as CrudPermission['permission_type'])] : []),
        ...(extraDeleteOnePermissions ?? []),
      ],
    );
  }, [authorizationManager, createPermission, crudCommandType, deleteOne, extraDeleteOnePermissions]);

  const userCanCreate = useMemo(() => {
    if (!createOne || error) {
      return false;
    }
    return authorizationManager.doesUserHavePermission<CrudPermission>(
      [
        ...(crudCommandType ? [createPermission(CommonDbPermissionType.CREATE as CrudPermission['permission_type'])] : []),
        ...(extraCreateOnePermissions ?? []),
      ],
    );
  }, [authorizationManager, createOne, createPermission, crudCommandType, error, extraCreateOnePermissions]);

  const normalizedEditDialogExtraActionsFactory = useCallback((item: TData) => {
    const actions: DialogAction[] = [];

    if (editDialogExtraActionsFactory) {
      actions.push(...editDialogExtraActionsFactory(item));
    }
    subPages?.forEach(subPage => {
      actions.push({
        color: 'primary',
        label: subPage.label,
        onClick: async () => await RouterManager.getInstance().router.navigate({
          pathname: subPage.getPathName(item),
        }),
        variant: 'outlined',
      });
    });

    return actions;
  }, [editDialogExtraActionsFactory, subPages]);

  const editItem = useCallback((item: TTableData) => {
    editDialogRef.current.open({
      canSave: userCanEdit && (!item || canEditItem ? canEditItem(item) : true),
      extraActionsFactory: normalizedEditDialogExtraActionsFactory,
      item,
    });
  }, [canEditItem, normalizedEditDialogExtraActionsFactory, userCanEdit]);

  const tryToGetName = useCallback((item: TData | TFormFields) => {
    let name: string;
    try {
      name = getName(item);
    } catch {
      name = undefined;
    }
    return name;
  }, [getName]);

  const getEditProgressNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" is being saved...', { name }) : t`Item is being saved.`;
  }, [t, tryToGetName]);

  const getCreateProgressNotificationMessage = useCallback((data: TFormFields) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" is being saved...', { name }) : t`Item is being saved.`;
  }, [t, tryToGetName]);

  const getDeleteProgressNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" is being deleted...', { name }) : t`Item is being deleted.`;
  }, [t, tryToGetName]);

  const getEditSuccessNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" has been saved.', { name }) : t`Item has been saved.`;
  }, [t, tryToGetName]);

  const getCreateSuccessNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" has been created.', { name }) : t`Item has been created.`;
  }, [t, tryToGetName]);

  const getDeleteSuccessNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" has been deleted.', { name }) : t`Item has been deleted.`;
  }, [t, tryToGetName]);

  const getEditErrorNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" could not be saved.', { name }) : t`Item could not be saved.`;
  }, [t, tryToGetName]);

  const getCreateErrorNotificationMessage = useCallback((data: TFormFields) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" could not be created.', { name }) : t`Item could not be created.`;
  }, [t, tryToGetName]);

  const getDeleteErrorNotificationMessage = useCallback((data: TData) => {
    const name = tryToGetName(data);
    return name ? t('Item "{{name}}" could not be deleted.', { name }) : t`Item could not be deleted.`;
  }, [t, tryToGetName]);

  const calculatedAssociationQueryKeys = useMemo<string[][]>(() => {
    const keys = associationQueryKeys ?? [];

    QueryClientManager.getInstance().getQueryKeyDependencies([resourceQueryKeyBase]).forEach(key => {
      keys.push(key);
    });
    return keys;
  }, [associationQueryKeys, resourceQueryKeyBase]);

  const { mutate: mutateEdit, setPreviousItem: mutateEditSetPreviousItem } = useEditMutation<TData, TFormFields>({
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getEditErrorNotificationMessage,
    getIntermediateItem: getOptimisticUpdateIntermediateItem,
    getProgressNotificationMessage: getEditProgressNotificationMessage,
    getSuccessNotificationMessage: getEditSuccessNotificationMessage,
    onError: onEditError,
    onSuccess: onEditSuccess,
    queryFn: updateOne,
    resourceQueryKey,
  });

  const { isMutating: isCreating, mutate: mutateCreate } = useCreateMutation<TData, TFormFields>({
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getCreateErrorNotificationMessage,
    getProgressNotificationMessage: getCreateProgressNotificationMessage,
    getSuccessNotificationMessage: getCreateSuccessNotificationMessage,
    onError: onCreateError,
    onSuccess: onCreateSuccess,
    queryFn: createOne,
    resourceQueryKey,
  });

  const { mutate: mutateDelete } = useDeleteMutation<TData>({
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getDeleteErrorNotificationMessage,
    getProgressNotificationMessage: getDeleteProgressNotificationMessage,
    getSuccessNotificationMessage: getDeleteSuccessNotificationMessage,
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
    queryFn: deleteOne,
    resourceQueryKey,
  });

  const onEditDialogSave = useCallback((formValues: TFormFields, item: TData) => {
    if (item) {
      mutateEditSetPreviousItem(item);
      mutateEdit(formValues);
    } else {
      mutateCreate(formValues as unknown as TFormFields);
    }
  }, [mutateCreate, mutateEdit, mutateEditSetPreviousItem]);

  const onEditIconClick = useCallback((params: TableRowParams<TTableData, null>) => {
    editItem(params.row);
  }, [editItem]);

  const onRowClick = useCallback((params: TableRowParams<TTableData, null>) => {
    if (customOnRowClick) {
      customOnRowClick(params);
    } else if (onShowItem) {
      onShowItem(params);
    } else {
      editItem(params.row);
    }
  }, [customOnRowClick, onShowItem, editItem]);

  const onDeleteConfirmationConfirm = useCallback((item: TData) => {
    mutateDelete(item);
  }, [mutateDelete]);

  const normalizedExtraActions = useCallback((params: TableRowParams<TTableData, null>) => {
    const actions: ReactElement[] = [];

    const extraActions = extraActionsFactory ? extraActionsFactory(params) : [];
    if (extraActions?.length > 0) {
      actions.push(...extraActions);
    }
    subPages?.forEach(subPage => {
      actions.push((
        <MenuItem
          key={subPage.label}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={async () => await RouterManager.getInstance().router.navigate({
            pathname: subPage.getPathName(params.row),
          })}
        >
          <ListItemIcon>
            {subPage.icon ? subPage.icon : <ArrowCircleRightIcon />}
          </ListItemIcon>
          <ListItemText>
            {subPage.label}
          </ListItemText>
        </MenuItem>
      ));
    });

    return actions;
  }, [extraActionsFactory, subPages]);

  const columns = useMemo<TableColumn<TTableData, null>[]>(() => {
    const internalColumns: TableColumn<TTableData, null>[] = [
      TableUtil.createReadableIndexColumn(),
    ];

    if (showIdColumn) {
      internalColumns.push({
        headerName: t`Id`,
        id: 'id',
        isInitiallyVisible: true,
        type: 'text',
        widthPx: 300,
      });
    }
    internalColumns.push(...tableColumns);

    internalColumns.push(
      TableUtil.createActionsColumn({
        getActions: (params) => {
          const actions: ReactElement[] = [];
          if (onShowItem) {
            actions.push(
              <MenuItem
                key={'actions1'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => onShowItem(params)}
              >
                <ListItemIcon>
                  <ArrowCircleRightIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Show`}
                </ListItemText>
              </MenuItem>,
            );
          }
          actions.push(
            <MenuItem
              key={'actions2'}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onClick={() => onEditIconClick(params)}
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>
                {t`Edit`}
              </ListItemText>
            </MenuItem>,
          );
          if (userCanDelete) {
            actions.push(
              <MenuItem
                key={'actions3'}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => deleteConfirmationRef.current.open({
                  item: params.row,
                })}
              >
                <ListItemIcon>
                  <DeleteForeverIcon />
                </ListItemIcon>
                <ListItemText>
                  {t`Delete`}
                </ListItemText>
              </MenuItem>,
            );
          }
          const extraActions = normalizedExtraActions(params) ?? [];
          if (extraActions?.length > 0 && actions.length > 0) {
            actions.push(...extraActions);
          }
          return actions;
        },
        t,
      }),
    );
    return internalColumns;
  }, [normalizedExtraActions, onEditIconClick, onShowItem, showIdColumn, t, tableColumns, userCanDelete]);

  const tableRows = useMemo(() => {
    if (!convertToTableData) {
      return rows as TTableData[];
    }
    return convertToTableData(rows);
  }, [convertToTableData, rows]);

  useInitializeTableStore<TTableData, null>({ columns, context: null, createFiltersFromColumns: true, rows: tableRows, store: tableStore });

  const onCreateItemButtonClick = useCallback(() => {
    editDialogRef.current.open({
      canSave: true,
    });
  }, []);

  const customContentActions = useMemo(() => {
    if (!contentActions && !userCanCreate) {
      return (
        <TableHeader />
      );
    }
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: theme.spacing(1),
        }}
      >
        <TableHeader />
        {userCanCreate && (
          <Button
            color={'secondary'}
            disabled={isLoading || isCreating}
            loading={isLoading || isCreating}
            onClick={onCreateItemButtonClick}
            size={'small'}
            variant={'contained'}
          >
            {createItemButtonText ?? t`Create item`}
          </Button>
        )}
        {contentActions}
      </Box>
    );
  }, [contentActions, userCanCreate, isLoading, isCreating, onCreateItemButtonClick, createItemButtonText, t, theme]);

  const normalizedTitle = useMemo<string>(() => {
    if (isArray(title)) {
      return title.join(' → ');
    }
    return title;
  }, [title]);


  return (
    <TableStoreContextProvider store={tableStore}>
      <PageContainer
        contentActions={customContentActions}
        contentHeader={(
          <TableCaption
            caption={contentHeader ?? normalizedTitle}
            component={'h2'}
            variant={'h2'}
          />
        )}
        fullWidth
        showBreadcrumbs
        testIdAttributes={testIdAttributes}
        title={normalizedTitle}
      >
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          <ResponseHandler
            error={error}
            isLoading={isLoading}
          >
            <TableSidebarMenu />
            <Box
              sx={{
                height: '100%',
                paddingLeft: theme.spacing(ConfigManager.getInstance().config.layout.SIDEBAR_MENU_WIDTH + 1),
                width: '100%',
              }}
            >
              <Table
                getRowName={getName}
                onRowClick={onRowClick}
              />
            </Box>
          </ResponseHandler>
        </Box>
        <CrudPageEditDialog
          createItemDialogTitle={createItemDialogTitle}
          defaultNewItem={defaultNewItem}
          formFieldDefinitions={formFieldDefinitions}
          getFormValuesFromItem={getFormValuesFromItem}
          getName={getName}
          onChange={onFormChange}
          onSave={onEditDialogSave}
          ref={editDialogRef}
          schema={schema}
        />
        <CrudPageDeleteDialog
          getName={getName}
          onConfirm={onDeleteConfirmationConfirm}
          ref={deleteConfirmationRef}
        />
      </PageContainer>
    </TableStoreContextProvider>
  );
};
