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
  useMemo,
  useRef,
} from 'react';
import type { ObjectSchema } from 'yup';
import { useQuery } from '@tanstack/react-query';
import isArray from 'lodash/isArray';

import type {
  CommandName,
  Permission,
} from '../../api';
import { PermissionType } from '../../api';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import type { ConfirmationRefMethods } from '../../components/ui/Confirmation';
import { Confirmation } from '../../components/ui/Confirmation';
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
import type { FormFieldDefinition } from '../../models/form';
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

import type { CrudPageEditDialogRefMethods } from './CrudPageEditDialog';
import { CrudPageEditDialog } from './CrudPageEditDialog';

export type CrudPageProps<
  TFormFields,
  TData extends GenericData,
  TTableData extends TData = TData
> = PropsWithTestIdAttributes<{
  readonly contentHeader?: string;
  readonly createItemButtonText?: string;
  readonly createOne?: (item: TFormFields) => Promise<TData>;
  readonly crudCommandType?: CommandName;
  readonly customOnRowClick?: (params: TableRowParams<TData>) => void;
  readonly defaultSortByField: keyof TTableData;
  readonly defaultSortDirection: TableSortDirection;
  readonly deleteOne?: (item: TData) => Promise<unknown>;
  readonly extraActionsFactory?: (params: TableRowParams<TData>) => ReactElement[];
  readonly extraCreateOnePermissions?: Permission[];
  readonly extraDeleteOnePermissions?: Permission[];
  readonly extraUpdateOnePermissions?: Permission[];
  readonly fetchAll: (signal: AbortSignal) => Promise<TData[]>;
  readonly formFieldDefinitions?: FormFieldDefinition<TFormFields>[];
  readonly getName: (item: TData | TFormFields) => string;
  readonly hiddenFormFieldValues?: Partial<Record<keyof TData, unknown>>;
  readonly loadables?: Loadable[];
  readonly onShowItem?: (params: TableRowParams<TTableData>) => void;
  readonly resourceQueryKeyBase: QUERY_KEY;
  readonly associationQueryKeys?: string[][];
  readonly readOnly?: boolean;
  readonly schema?: ObjectSchema<TFormFields>;
  readonly showBreadcrumbs?: boolean;
  readonly showIdColumn?: boolean;
  readonly tableColumns: TableColumn<TTableData>[];
  readonly contentActions?: ReactElement;
  readonly title: string;
  readonly updateOne?: (variables: TFormFields, data: TData) => Promise<TData>;
  readonly convertToTableData?: (items: TData[]) => TTableData[];
  readonly onEditSuccess?: (item: TData, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onEditError?: (error: unknown, variables: TFormFields, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onCreateSuccess?: (item: TData, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void>;
  readonly onCreateError?: (error: unknown, variables: TFormFields, context: MutationContextCreate<TData>) => Promise<void>;
  readonly onDeleteSuccess?: (item: TData, context: MutationContextDelete<TData>) => Promise<void>;
  readonly onDeleteError?: (error: unknown, item: TData, context: MutationContextDelete<TData>) => Promise<void>;
}>;

export const CrudPage = <
  TFormFields,
  TData extends GenericData,
  TTableData extends TData = TData
>({
  contentHeader,
  contentActions,
  convertToTableData,
  createItemButtonText,
  createOne,
  crudCommandType,
  customOnRowClick,
  defaultSortByField,
  defaultSortDirection,
  deleteOne,
  extraActionsFactory,
  extraCreateOnePermissions,
  extraDeleteOnePermissions,
  extraUpdateOnePermissions,
  fetchAll,
  formFieldDefinitions,
  getName,
  hiddenFormFieldValues,
  associationQueryKeys,
  resourceQueryKeyBase,
  loadables,
  onShowItem,
  schema,
  showIdColumn = false,
  tableColumns,
  testIdAttributes,
  title,
  updateOne,
  onEditSuccess,
  onEditError,
  onCreateSuccess,
  onCreateError,
  onDeleteSuccess,
  onDeleteError,
}: CrudPageProps<TFormFields, TData, TTableData>) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const deleteConfirmationRef = useRef<ConfirmationRefMethods<TableRowParams<TData>>>(null);
  const editDialogRef = useRef<CrudPageEditDialogRefMethods<TData, TFormFields>>(null);
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);
  const resourceQueryKey = useMemo(() => [resourceQueryKeyBase], [resourceQueryKeyBase]);
  const tableStore = useMemo(() => createTableStore<TTableData>({
    navigatorFunction: RouterManager.instance.router.navigate,
    idSelectorCallback: (item) => item.id,
    defaultSortByField: defaultSortByField as string,
    defaultSortDirection,
    storageNamePostFix: `CRUDPage-${resourceQueryKeyBase}`,
    storageVersion: 1,
  }), [defaultSortByField, defaultSortDirection, resourceQueryKeyBase]);

  const isLoadablesLoading = useMemo(() => {
    if (isArray(loadables)) {
      return loadables.some((loadable) => loadable.isLoading);
    }
    return false;
  }, [loadables]);

  const { isLoading: fetchAllLoading, error: fetchAllError, data: rows } = useQuery({
    queryKey: resourceQueryKey,
    queryFn: async ({ signal }) => fetchAll(signal),
    enabled: !isLoadablesLoading,
  });

  const isLoading = useMemo(() => {
    if (fetchAllLoading) {
      return true;
    }
    return isLoadablesLoading;
  }, [fetchAllLoading, isLoadablesLoading]);

  const error = useMemo(() => {
    if (fetchAllError) {
      return fetchAllError;
    }
    if (isArray(loadables)) {
      return loadables.find((loadable) => loadable.error)?.error as Error;
    }
    return null;
  }, [fetchAllError, loadables]);

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

  const editItem = useCallback((item: TTableData) => {
    editDialogRef.current.open({
      hiddenFormFieldValues,
      item,
    });
  }, [hiddenFormFieldValues]);

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

  const getEditErrorNotificationMessage = useCallback((data: TFormFields) => {
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
    } else if (userCanEdit) {
      editItem(params.row);
    }
  }, [customOnRowClick, onShowItem, userCanEdit, editItem]);

  const onDeleteConfirmationConfirm = useCallback((params: TableRowParams<TData>) => {
    mutateDelete(params.row);
  }, [mutateDelete]);

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

    if (userCanEdit || userCanDelete || onShowItem || extraActionsFactory) {
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
                  onClick={() => deleteConfirmationRef.current.open(params)}
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
            actions.push(...(extraActionsFactory ? extraActionsFactory(params) : []));
            return actions;
          },
        }),
      );
    }
    return internalColumns;
  }, [extraActionsFactory, onEditIconClick, onShowItem, showIdColumn, t, tableColumns, userCanDelete, userCanEdit]);

  const tableRows = useMemo(() => {
    if (!convertToTableData) {
      return rows as TTableData[];
    }
    return convertToTableData(rows);
  }, [convertToTableData, rows]);

  useInitializeTableStore<TTableData>(tableStore, columns, tableRows, true);

  const onCreateItemButtonClick = useCallback(() => {
    editDialogRef.current.open({
      hiddenFormFieldValues,
    });
  }, [hiddenFormFieldValues]);

  const customContentActions = useMemo(() => {
    if (!contentActions && !userCanCreate) {
      return (
        <TableHeader />
      );
    }
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
      }}
      >
        <TableHeader />
        {userCanCreate && (
          <Button
            color={'primary'}
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

  return (
    <TableStoreContextProvider store={tableStore}>
      <PageContainer
        contentActions={customContentActions}
        contentHeader={(
          <TableCaption
            caption={contentHeader ?? title}
            component={'h2'}
            variant={'h2'}
          />
        )}
        fullWidth
        showBreadcrumbs
        testIdAttributes={testIdAttributes}
        title={title}
      >
        <Box sx={{
          position: 'relative',
          height: '100%',
        }}
        >
          <ResponseHandler
            error={error}
            isLoading={isLoading}
          >

            <TableSidebarMenu />
            <Box sx={{
              width: '100%',
              height: '100%',
              paddingLeft: theme.spacing(ConfigManager.instance.config.layout.SIDEBAR_MENU_WIDTH + 1),
            }}
            >
              <Table
                getRowName={getName}
                onRowClick={(userCanEdit || customOnRowClick || onShowItem) ? onRowClick : undefined}
              />
            </Box>
          </ResponseHandler>
        </Box>
        <CrudPageEditDialog
          formFieldDefinitions={formFieldDefinitions}
          getName={getName}
          onSave={onEditDialogSave}
          ref={editDialogRef}
          schema={schema}
        />
        <Confirmation
          body={t`This will delete the item.`}
          cancelLabel={t`Cancel`}
          confirmLabel={t`Delete`}
          onConfirm={onDeleteConfirmationConfirm}
          ref={deleteConfirmationRef}
          title={t`Are you sure?`}
        />
      </PageContainer>
    </TableStoreContextProvider>
  );
};
