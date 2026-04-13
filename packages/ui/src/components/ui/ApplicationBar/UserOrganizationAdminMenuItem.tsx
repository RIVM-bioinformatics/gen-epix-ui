import {
  Link,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  AbacApi,
  CommandName,
  PermissionType,
} from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';
import { withPermissions } from '../../../hoc/withPermissions';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

export const UserOrganizationAdminMenuItem = withPermissions(() => {
  const { t } = useTranslation();

  const { data: organizationAdminNameEmails, error: organizationAdminNameEmailsError, isLoading: isOrganizationAdminNameEmailsLoading } = useQueryMemo({
    gcTime: 0,
    queryFn: async ({ signal }) => (await AbacApi.instance.retrieveOrganizationAdminNameEmails({ signal })).data,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS),
    staleTime: 0,
  });

  return (
    <ListItem
      alignItems={'center'}
      sx={{
        justifyContent: 'center',
        paddingTop: 0,
      }}
    >
      <ListItemText
        primary={t`My organizations admins`}
        secondary={(
          <>
            {isOrganizationAdminNameEmailsLoading && t`Loading...`}
            {organizationAdminNameEmailsError && t`Error`}
            {organizationAdminNameEmails?.map(admin => (
              <Link
                href={`mailto:${admin.email}`}
                key={admin.id}
                sx={{
                  display: 'table',
                }}
              >
                {admin.name ?? admin.email}
              </Link>
            ))}
          </>
        )}
        slotProps={{
          primary: {
            sx: {
              fontWeight: 'bold',
            },
          },
        }}
      />
    </ListItem>
  );
}, {
  requiredPermissions: [
    { command_name: CommandName.RetrieveOrganizationAdminNameEmailsCommand, permission_type: PermissionType.EXECUTE },
  ],
});
