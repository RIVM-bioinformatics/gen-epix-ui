import {
  ListItemText,
  ListItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import {
  CommandName,
  PermissionType,
} from '../../../api';
import { withPermissions } from '../../../hoc/withPermissions';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { useOrganizationMapQuery } from '../../../dataHooks/useOrganizationsQuery';

export const UserOwnOrganizationMenuItem = withPermissions(() => {
  const [t] = useTranslation();

  const organizationMapQuery = useOrganizationMapQuery();

  const userOrganization = useMemo(() => {
    if (organizationMapQuery.isLoading) {
      return t`Loading...`;
    }
    if (organizationMapQuery.error) {
      return t`Error`;
    }
    return organizationMapQuery.map.get(AuthorizationManager.instance.user?.organization_id ?? '')?.name ?? t`Unknown`;
  }, [organizationMapQuery, t]);

  return (
    <ListItem
      sx={{
        paddingBottom: 0,
      }}
    >
      <ListItemText
        primary={t`Your organization`}
        secondary={userOrganization ?? t`Unknown`}
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
