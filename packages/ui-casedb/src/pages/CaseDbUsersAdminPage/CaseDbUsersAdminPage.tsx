import type {
  CaseDbApiPermission,
  CaseDbUser,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CrudPageSubPage } from '@gen-epix/ui';
import {
  AuthorizationService,
  UsersAdminPage,
} from '@gen-epix/ui';
import {
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';

import { UserRightsDialog } from '../../components/ui/UserRightsDialog';
import type { UserRightsDialogRefMethods } from '../../components/ui/UserRightsDialog';

export const CaseDbUsersAdminPage = () => {
  const { t } = useTranslation();
  const userRightsDialogRef = useRef<UserRightsDialogRefMethods>(null);

  const subPages = useMemo<CrudPageSubPage<CaseDbUser>[]>(() => {
    const doesUserHavePermissionToViewEffectiveRights = AuthorizationService.getInstance().doesUserHavePermission<CaseDbApiPermission>([
      { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.UserShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
    ]);

    if (!doesUserHavePermissionToViewEffectiveRights) {
      return [];
    }
    return [
      {
        getPathName: (item: CaseDbUser) => `/management/users/${item.id}/effective-rights-tester`,
        label: t`Test effective rights`,
      } satisfies CrudPageSubPage<CaseDbUser>,
      {
        getPathName: (item: CaseDbUser) => `/management/users/${item.id}/effective-rights`,
        label: t`View effective rights`,
      } satisfies CrudPageSubPage<CaseDbUser>,
    ];

  }, [t]);

  return (
    <>
      <UsersAdminPage subPages={subPages} />
      <UserRightsDialog ref={userRightsDialogRef} />
    </>
  );
};
