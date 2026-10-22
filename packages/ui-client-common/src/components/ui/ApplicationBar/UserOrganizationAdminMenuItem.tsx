import { container } from 'tsyringe';
import {
  Link,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { API_ABAC_TOKEN } from '../../../constants/api.constants';
import { withPermissions } from '../../../hoc/withPermissions';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../../constants/query.constants';

export const UserOrganizationAdminMenuItem = withPermissions(() => {
  const { t } = useTranslation();

  const retrieveOrganizationAdminNameEmailsQuery = useQueryMemo({
    gcTime: 0,
    queryFn: async ({ signal }) => (await container.resolve(API_ABAC_TOKEN).retrieveOrganizationAdminNameEmails({}, {}, { signal })).data,
    queryKey: container.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.ORGANIZATION_ADMIN_NAME_EMAILS),
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
            {retrieveOrganizationAdminNameEmailsQuery.isLoading && t`Loading...`}
            {retrieveOrganizationAdminNameEmailsQuery.error && t`Error loading organization admins`}
            {retrieveOrganizationAdminNameEmailsQuery.data?.map(admin => (
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
    { command_name: CommonDbCommandName.RetrieveOrganizationAdminNameEmailsCommand, permission_type: CommonDbPermissionType.EXECUTE },
  ],
});
