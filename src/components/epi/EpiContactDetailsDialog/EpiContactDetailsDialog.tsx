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
import { useQuery } from '@tanstack/react-query';

import { CaseApi } from '../../../api';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';
import { Spinner } from '../../ui/Spinner';

export interface EpiContactDetailsDialogOpenProps {
  contactId: string;
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
  const [t] = useTranslation();

  const queryKey = useMemo(() => {
    return ['contacts', openProps.contactId];
  }, [openProps.contactId]);

  const { isPending, error, data: contactInfos } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveOrganizationContact({
        organization_ids: [openProps.contactId],
      }, { signal });
      return response.data;
    },
  });

  useEffect(() => {
    if (!contactInfos?.length) {
      onTitleChange(t`Contact details`);
    } else {
      onTitleChange(t('{{organizationName}} contact details', { organizationName: contactInfos[0].site?.organization?.name }));
    }
  }, [contactInfos, onTitleChange, t]);

  return (
    <Box>
      {isPending && !error && (
        <Spinner
          inline
          label={t`Loading`}
        />
      )}
      {!isPending && error && (
        <GenericErrorMessage
          error={error}
          shouldHideActionButtons
        />
      )}
      {!isPending && !contactInfos?.length && (
        <Box>
          {t`No contact details found for this organization`}
        </Box>
      )}
      {!isPending && contactInfos?.length && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
        }}
        >
          {contactInfos.map(contactInfo => (
            <Card
              elevation={2}
              key={contactInfo.id}
              square
            >
              <CardContent>
                <Typography
                  component={'div'}
                  variant={'h5'}
                >
                  {contactInfo.site.name}
                </Typography>
                <Typography
                  component={'div'}
                  variant={'h6'}
                >
                  {contactInfo.name}
                </Typography>
                <Box>
                  {contactInfo.email && (
                    <Link href={`mailto:${contactInfo.email}`}>
                      {contactInfo.email}
                    </Link>
                  )}
                  {!contactInfo.email && (
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
                  {contactInfo.phone ? contactInfo.phone : t`Phone number: unknown`}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}, {
  testId: 'EpiContactDetailsDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
