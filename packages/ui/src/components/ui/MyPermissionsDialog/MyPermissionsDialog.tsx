import { useTranslation } from 'react-i18next';
import {
  useEffect,
  useMemo,
  type ReactElement,
} from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { PermissionType } from '../../../api';


export interface MyPermissionsDialogOpenProps {
  //
}

export interface MyPermissionsDialogProps extends WithDialogRenderProps<MyPermissionsDialogOpenProps> {
  //
}

export type MyPermissionsDialogRefMethods = WithDialogRefMethods<MyPermissionsDialogProps, MyPermissionsDialogOpenProps>;


export const MyPermissionsDialog = withDialog<MyPermissionsDialogProps, MyPermissionsDialogOpenProps>((
  {
    onTitleChange,
  }: MyPermissionsDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  useEffect(() => {
    onTitleChange(t`My Permissions`);
  }, [onTitleChange, t]);

  const permissionTypeTranslationMap = useMemo<Record<PermissionType, string>>(() => ({
    [PermissionType.CREATE]: t`Create`,
    [PermissionType.READ]: t`Read`,
    [PermissionType.UPDATE]: t`Update`,
    [PermissionType.DELETE]: t`Delete`,
    [PermissionType.EXECUTE]: t`Execute`,
  }), [t]);

  const readablePermissions = useMemo(() => {
    return AuthorizationManager.instance.apiPermissions.sort((a, b) => a.command_name.localeCompare(b.command_name)).map(permission => ({
      key: `${permission.command_name}-${permission.permission_type}`,
      command_name: permission.command_name,
      permission_type: permissionTypeTranslationMap[permission.permission_type],
    }));
  }, [permissionTypeTranslationMap]);

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={'50%'}>
              {t`Name`}
            </TableCell>
            <TableCell width={'50%'}>
              {t`Permission`}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {readablePermissions.map(permission => (
            <TableRow key={permission.key}>
              <TableCell>
                {permission.command_name}
              </TableCell>
              <TableCell>
                {permission.permission_type}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}, {
  testId: 'MyPermissionsDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: 'My Permissions',
});
