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
import type { UseFormReturn } from 'react-hook-form';

import type {
  CommandName,
  ApiPermission,
} from '../../api';
import { PermissionType } from '../../api';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import {
  TableHeader,
  TableCaption,
  TableSidebarMenu,
  Table,
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
import type { QUERY_KEY } from '../../models/query';
import type {
  TableRowParams,
  TableSortDirection,
  TableColumn,
} from '../../models/table';
import type { PropsWithTestIdAttributes } from '../../models/testId';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../stores/tableStore';
import { QueryUtil } from '../../utils/QueryUtil';
import { TableUtil } from '../../utils/TableUtil';
import type { DialogAction } from '../../components/ui/Dialog';
import type { FormFieldDefinition } from '../../models/form';
import { useQueryMemo } from '../../hooks/useQueryMemo';

import type { CrudPageEditDialogRefMethods } from './CrudPageEditDialog';
import { CrudPageEditDialog } from './CrudPageEditDialog';
import type { CrudPageDeleteDialogRefMethods } from './CrudPageDeleteDialog';
import { CrudPageDeleteDialog } from './CrudPageDeleteDialog';

export type CrudPageSubPage<TData extends GenericData> = {
  getPathName: (item: TData) => string;
  label: string;
  icon?: ReactElement;
};

export type CrudPageProps<
  TFormFields,
  TData extends GenericData,
  TTableData extends TData = TData
> = PropsWithTestIdAttributes<{
  readonly contentHeader?: string;
  readonly createItemButtonText?: string;
  readonly createItemDialogTitle?: string;
  readonly createOne?: (item: TFormFields) => Promise<TData>;
  readonly canEditItem?: (item: TData) => boolean;
  readonly subPages?: CrudPageSubPage<TData>[];
  readonly defaultNewItem?: Partial<TFormFields>;
  readonly crudCommandType?: CommandName;
  readonly customOnRowClick?: (params: TableRowParams<TData>) => void;
  readonly defaultSortByField: keyof TTableData;
  readonly defaultSortDirection: TableSortDirection;
  readonly deleteOne?: (item: TData) => Promise<unknown>;
  readonly extraActionsFactory?: (params: TableRowParams<TData>) => ReactElement[];
  readonly extraCreateOnePermissions?: ApiPermission[];
  readonly extraDeleteOnePermissions?: ApiPermission[];
  readonly extraUpdateOnePermissions?: ApiPermission[];
  readonly fetchAll: (signal: AbortSignal) => Promise<TData[]>;
  readonly fetchAllSelect?: (data: TData[]) => TData[];
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[] | ((values: TFormFields, item: TData) => FormFieldDefinition<TFormFields>[]);
  readonly getName: (item: TData | TFormFields) => string;
  readonly loadables?: Loadable[];
  readonly onShowItem?: (params: TableRowParams<TTableData>) => void;
  readonly resourceQueryKeyBase: QUERY_KEY;
  readonly tableStoreStorageVersion?: number;
  readonly tableStoreStorageNamePostFix?: string;
  readonly associationQueryKeys?: string[][];
  readonly readOnly?: boolean;
  readonly schema?: ObjectSchema<TFormFields, TFormFields>;
  readonly showBreadcrumbs?: boolean;
  readonly showIdColumn?: boolean;
  readonly tableColumns: TableColumn<TTableData>[];
  readonly contentActions?: ReactElement;
  readonly title: string | string[];
  readonly updateOne?: (variables: TFormFields, data: TData) => Promise<TData>;
  readonly convertToTableData?: (items: TData[]) => TTableData[];
  readonly onFormChange?: (item: TData, formValues: TFormFields, formMethods: UseFormReturn<TFormFields>) => void;
  readonly onEditSuccess?: (item: TData, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onEditError?: (error: unknown, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onCreateSuccess?: (item: TData, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void>;
  readonly onCreateError?: (error: unknown, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void>;
  readonly onDeleteSuccess?: (item: TData, context: MutationContextDelete<TData>) => Promise<void>;
  readonly onDeleteError?: (error: unknown, item: TData, context: MutationContextDelete<TData>) => Promise<void>;
  readonly onRowsChange?: (items: TData[]) => void;
  readonly editDialogExtraActionsFactory?: (item: TData) => DialogAction[];
  readonly getOptimisticUpdateIntermediateItem?: (variables: TFormFields, previousItem: TData) => TData;
}>;

export const CrudPage = <
  TFormFields,
  TData extends GenericData,
  TTableData extends TData = TData
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
  subPages,
  editDialogExtraActionsFactory,
  extraActionsFactory,
  extraCreateOnePermissions,
  extraDeleteOnePermissions,
  extraUpdateOnePermissions,
  fetchAll,
  fetchAllSelect,
  formFieldDefinitions,
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
  tableColumns,
  tableStoreStorageNamePostFix,
  tableStoreStorageVersion,
  testIdAttributes,
  title,
  updateOne,
}: CrudPageProps<TFormFields, TData, TTableData>) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const deleteConfirmationRef = useRef<CrudPageDeleteDialogRefMethods<TData>>(null);
  const editDialogRef = useRef<CrudPageEditDialogRefMethods<TData, TFormFields>>(null);
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);
  const resourceQueryKey = useMemo(() => [resourceQueryKeyBase], [resourceQueryKeyBase]);
  const tableStore = useMemo(() => createTableStore<TTableData>({
    navigatorFunction: RouterManager.instance.router.navigate,
    idSelectorCallback: (item) => item.id,
    defaultSortByField: defaultSortByField as string,
    defaultSortDirection,
    storageNamePostFix: tableStoreStorageNamePostFix ? `CRUDPage-${resourceQueryKeyBase}-${tableStoreStorageNamePostFix}` : `CRUDPage-${resourceQueryKeyBase}`,
    storageVersion: tableStoreStorageVersion ?? 1,
  }), [defaultSortByField, defaultSortDirection, resourceQueryKeyBase, tableStoreStorageNamePostFix, tableStoreStorageVersion]);

  const isLoadablesLoading = useMemo(() => {
    if (isArray(loadables)) {
      return loadables.some((loadable) => loadable.isLoading);
    }
    return false;
  }, [loadables]);

  const { isLoading: isRowsLoading, error: rowsError, data: rows } = useQueryMemo({
    queryKey: resourceQueryKey,
    queryFn: async ({ signal }) => fetchAll(signal),
    select: fetchAllSelect,
    enabled: !isLoadablesLoading,
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

  const userCanEdit = useMemo(() => {
    if (!updateOne) {
      return false;
    }
    return authorizationManager.doesUserHavePermission(
      [
        ...(crudCommandType ? [{ command_name: crudCommandType, permission_type: PermissionType.UPDATE }] : []),
        ...(extraUpdateOnePermissions ?? []),
      ],
    );
  }, [crudCommandType, extraUpdateOnePermissions, updateOne, authorizationManager]);

  const userCanDelete = useMemo(() => {
    if (!deleteOne) {
      return false;
    }
    return authorizationManager.doesUserHavePermission(
      [
        ...(crudCommandType ? [{ command_name: crudCommandType, permission_type: PermissionType.DELETE }] : []),
        ...(extraDeleteOnePermissions ?? []),
      ],
    );
  }, [crudCommandType, deleteOne, extraDeleteOnePermissions, authorizationManager]);

  const userCanCreate = useMemo(() => {
    if (!createOne || error) {
      return false;
    }
    return authorizationManager.doesUserHavePermission(
      [
        ...(crudCommandType ? [{ command_name: crudCommandType, permission_type: PermissionType.CREATE }] : []),
        ...(extraCreateOnePermissions ?? []),
      ],
    );
  }, [createOne, error, authorizationManager, crudCommandType, extraCreateOnePermissions]);

  const normalizedEditDialogExtraActionsFactory = useCallback((item: TData) => {
    const actions: DialogAction[] = [];

    if (editDialogExtraActionsFactory) {
      actions.push(...editDialogExtraActionsFactory(item));
    }
    subPages?.forEach(subPage => {
      actions.push({
        label: subPage.label,
        color: 'primary',
        variant: 'outlined',
        onClick: async () => await RouterManager.instance.router.navigate({
          pathname: subPage.getPathName(item),
        }),
      });
    });

    return actions;
  }, [editDialogExtraActionsFactory, subPages]);

  const editItem = useCallback((item: TTableData) => {
    editDialogRef.current.open({
      extraActionsFactory: normalizedEditDialogExtraActionsFactory,
      item,
      canSave: userCanEdit && (!item || canEditItem ? canEditItem(item) : true),
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

    QueryUtil.getQueryKeyDependencies([resourceQueryKeyBase]).forEach(key => {
      keys.push(key);
    });
    return keys;
  }, [associationQueryKeys, resourceQueryKeyBase]);

  const { mutate: mutateEdit, setPreviousItem: mutateEditSetPreviousItem } = useEditMutation<TData, TFormFields>({
    queryFn: updateOne,
    resourceQueryKey,
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getEditErrorNotificationMessage,
    getSuccessNotificationMessage: getEditSuccessNotificationMessage,
    getProgressNotificationMessage: getEditProgressNotificationMessage,
    onSuccess: onEditSuccess,
    onError: onEditError,
    getIntermediateItem: getOptimisticUpdateIntermediateItem,
  });

  const { mutate: mutateCreate, isMutating: isCreating } = useCreateMutation<TData, TFormFields>({
    queryFn: createOne,
    resourceQueryKey,
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getCreateErrorNotificationMessage,
    getSuccessNotificationMessage: getCreateSuccessNotificationMessage,
    getProgressNotificationMessage: getCreateProgressNotificationMessage,
    onSuccess: onCreateSuccess,
    onError: onCreateError,
  });

  const { mutate: mutateDelete } = useDeleteMutation<TData>({
    queryFn: deleteOne,
    resourceQueryKey,
    associationQueryKeys: calculatedAssociationQueryKeys,
    getErrorNotificationMessage: getDeleteErrorNotificationMessage,
    getSuccessNotificationMessage: getDeleteSuccessNotificationMessage,
    getProgressNotificationMessage: getDeleteProgressNotificationMessage,
    onSuccess: onDeleteSuccess,
    onError: onDeleteError,
  });

  const onEditDialogSave = useCallback((formValues: TFormFields, item: TData) => {
    if (item) {
      mutateEditSetPreviousItem(item);
      mutateEdit(formValues);
    } else {
      mutateCreate(formValues as unknown as TFormFields);
    }
  }, [mutateCreate, mutateEdit, mutateEditSetPreviousItem]);

  const onEditIconClick = useCallback((params: TableRowParams<TTableData>) => {
    editItem(params.row);
  }, [editItem]);

  const onRowClick = useCallback((params: TableRowParams<TTableData>) => {
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

  const normalizedExtraActions = useCallback((params: TableRowParams<TTableData>) => {
    const actions: ReactElement[] = [];

    const extraActions = extraActionsFactory ? extraActionsFactory(params) : [];
    if (extraActions?.length > 0 && actions.length > 0) {
      actions.push(...extraActions);
    }
    subPages?.forEach(subPage => {
      actions.push((
        <MenuItem
          key={subPage.label}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={async () => await RouterManager.instance.router.navigate({
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

  const columns = useMemo<TableColumn<TTableData>[]>(() => {
    const internalColumns: TableColumn<TTableData>[] = [
      TableUtil.createReadableIndexColumn(),
    ];

    if (showIdColumn) {
      internalColumns.push({
        headerName: t`Id`,
        id: 'id',
        type: 'text',
        widthPx: 300,
        isInitiallyVisible: true,
      });
    }
    internalColumns.push(...tableColumns);

    if (userCanEdit || userCanDelete || onShowItem || extraActionsFactory || subPages?.length) {
      internalColumns.push(
        TableUtil.createActionsColumn({
          t,
          getActions: (params) => {
            const actions: ReactElement[] = [];
            if (onShowItem) {
              actions.push(
                <MenuItem
                  key={'actions1'}
                  // eslint-disable-next-line react/jsx-no-bind
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
            if (userCanEdit) {
              actions.push(
                <MenuItem
                  key={'actions2'}
                  // eslint-disable-next-line react/jsx-no-bind
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
            }
            if (userCanDelete) {
              actions.push(
                <MenuItem
                  key={'actions3'}
                  // eslint-disable-next-line react/jsx-no-bind
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
        }),
      );
    }
    return internalColumns;
  }, [extraActionsFactory, normalizedExtraActions, onEditIconClick, onShowItem, showIdColumn, subPages?.length, t, tableColumns, userCanDelete, userCanEdit]);

  const tableRows = useMemo(() => {
    if (!convertToTableData) {
      return rows as TTableData[];
    }
    return convertToTableData(rows);
  }, [convertToTableData, rows]);

  useInitializeTableStore<TTableData>({ store: tableStore, columns, rows: tableRows, createFiltersFromColumns: true });

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
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(1),
        }}
      >
        <TableHeader />
        {userCanCreate && (
          <Button
            color={'secondary'}
            disabled={isLoading || isCreating}
            loading={isLoading || isCreating}
            size={'small'}
            variant={'contained'}
            onClick={onCreateItemButtonClick}
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
        fullWidth
        showBreadcrumbs
        contentActions={customContentActions}
        contentHeader={(
          <TableCaption
            caption={contentHeader ?? normalizedTitle}
            component={'h2'}
            variant={'h2'}
          />
        )}
        testIdAttributes={testIdAttributes}
        title={normalizedTitle}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
          }}
        >
          <ResponseHandler
            error={error}
            isLoading={isLoading}
          >
            <TableSidebarMenu />
            <Box
              sx={{
                width: '100%',
                height: '100%',
                paddingLeft: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH + 1),
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
          ref={editDialogRef}
          defaultNewItem={defaultNewItem}
          formFieldDefinitions={formFieldDefinitions}
          getName={getName}
          createItemDialogTitle={createItemDialogTitle}
          schema={schema}
          onSave={onEditDialogSave}
          onChange={onFormChange}
        />
        <CrudPageDeleteDialog
          ref={deleteConfirmationRef}
          getName={getName}
          onConfirm={onDeleteConfirmationConfirm}
        />
      </PageContainer>
    </TableStoreContextProvider>
  );
};
