import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useEffect,
  useMemo,
} from 'react';

import { OrganizationApi } from '../../../api';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useArray } from '../../../hooks/useArray';

export interface EpiContactDetailsDialogOpenProps {
  organizationId: string;
  organizationName: string;
}

export interface EpiContactDetailsDialogProps extends WithDialogRenderProps<EpiContactDetailsDialogOpenProps> {
  //
}

export type EpiContactDetailsDialogRefMethods = WithDialogRefMethods<EpiContactDetailsDialogProps, EpiContactDetailsDialogOpenProps>;

export const EpiContactDetailsDialog = withDialog<EpiContactDetailsDialogProps, EpiContactDetailsDialogOpenProps>((
  {
    onTitleChange,
    openProps,
  }: EpiContactDetailsDialogProps,
): ReactElement => {
  const { t } = useTranslation();

  const queryKey = useMemo(() => {
    return ['contacts', openProps.organizationId];
  }, [openProps.organizationId]);

  const organizationContactsQuery = useQueryMemo({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.retrieveOrganizationContacts({
        organization_id: openProps.organizationId,
      }, { signal });
      return response.data;
    },
  });

  useEffect(() => {
    onTitleChange(t('{{organizationName}} contact details', { organizationName: openProps.organizationName }));
  }, [openProps.organizationName, onTitleChange, t]);

  const loadables = useArray([organizationContactsQuery]);

  return (
    <Box>
      <ResponseHandler loadables={loadables}>
        {!organizationContactsQuery.data?.contacts?.length && (
          <Box>
            {t`No contact details found for this organization`}
          </Box>
        )}
        {organizationContactsQuery?.data?.sites?.map(site => {
          const siteContacts = organizationContactsQuery.data?.contacts?.filter(c => c.site_id === site.id);

          return (
            <Box
              key={site.id}
              marginBottom={2}
            >
              <Typography
                variant={'h5'}
              >
                {site.name}
              </Typography>
              {siteContacts.length === 0 && (
                <Typography
                  component={'div'}
                >
                  {t`No contact details found for this site`}
                </Typography>
              )}
              {siteContacts.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
                >
                  {siteContacts.map(contact => (
                    <Card
                      key={contact.id}
                      square
                      elevation={2}
                    >
                      <CardContent>
                        <Typography
                          component={'div'}
                          variant={'h6'}
                        >
                          {contact.name}
                        </Typography>
                        <Box>
                          {contact.email && (
                            <Link href={`mailto:${contact.email}`}>
                              {contact.email}
                            </Link>
                          )}
                          {!contact.email && (
                            <Typography
                              component={'div'}
                              variant={'body1'}
                            >
                              {t`Email address: unknown`}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          component={'div'}
                          variant={'body1'}
                        >
                          {contact.phone ? contact.phone : t`Phone number: unknown`}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

            </Box>
          );
        })}
      </ResponseHandler>
    </Box>
  );
}, {
  testId: 'EpiContactDetailsDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
