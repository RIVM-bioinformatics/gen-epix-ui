import {
  ListItemText,
  ListItem,
  Link,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  AbacApi,
  CommandName,
  PermissionType,
} from '../../../api';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';
import { withPermissions } from '../../../hoc/withPermissions';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

export const UserOrganizationAdminMenuItem = withPermissions(() => {
  const [t] = useTranslation();

  const { isLoading: isOrganizationAdminNameEmailsLoading, error: organizationAdminNameEmailsError, data: organizationAdminNameEmails } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS),
    queryFn: async ({ signal }) => (await AbacApi.instance.retrieveOrganizationAdminNameEmails({ signal })).data,
    gcTime: 0,
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
        primary={t`My organization’s admins`}
        secondary={(
          <>
            {isOrganizationAdminNameEmailsLoading && t`Loading...`}
            {organizationAdminNameEmailsError && t`Error`}
            {organizationAdminNameEmails?.map(admin => (
              <Link
                key={admin.id}
                href={`mailto:${admin.email}`}
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
