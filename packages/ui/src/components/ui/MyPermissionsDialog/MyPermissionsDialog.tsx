import { useTranslation } from 'react-i18next';
import {
  useEffect,
  useMemo,
} from 'react';
import type { ReactElement } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { CommonDbPermissionType } from '@gen-epix/api-commondb';

import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';


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

  const permissionTypeTranslationMap = useMemo<Record<CommonDbPermissionType, string>>(() => ({
    [CommonDbPermissionType.CREATE]: t`Create`,
    [CommonDbPermissionType.DELETE]: t`Delete`,
    [CommonDbPermissionType.EXECUTE]: t`Execute`,
    [CommonDbPermissionType.READ]: t`Read`,
    [CommonDbPermissionType.UPDATE]: t`Update`,
  }), [t]);

  const readablePermissions = useMemo(() => {
    return AuthorizationManager.getInstance().apiPermissions.sort((a, b) => a.command_name.localeCompare(b.command_name)).map(permission => ({
      command_name: permission.command_name,
      key: `${permission.command_name}-${permission.permission_type}`,
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
  defaultTitle: 'My Permissions',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'MyPermissionsDialog',
});
