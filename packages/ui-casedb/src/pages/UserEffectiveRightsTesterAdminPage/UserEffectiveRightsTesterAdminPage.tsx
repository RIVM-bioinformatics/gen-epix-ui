import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import {
  useId,
  useMemo,
} from 'react';
import { useParams } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  object,
  string,
} from 'yup';
import noop from 'lodash/noop';
import type { CaseDbUser } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type { FormFieldDefinition } from '@gen-epix/ui';
import {
  COMMON_QUERY_KEY,
  FORM_FIELD_DEFINITION_TYPE,
  GenericForm,
  PageContainer,
  ResponseHandler,
  TestIdUtil,
  useArray,
  useItemQuery,
  useOrganizationMapQuery,
} from '@gen-epix/ui';

import { useColSetMembersQuery } from '../../dataHooks/useColSetMembersQuery';
import { useCaseTypeSetMembersQuery } from '../../dataHooks/useCaseTypeSetMembersQuery';
import { useDataCollectionOptionsQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../../dataHooks/useOrganizationShareCasePoliciesQuery';
import { useUserAccessCasePoliciesQuery } from '../../dataHooks/useUserAccessCasePoliciesQuery';
import { useUserShareCasePoliciesQuery } from '../../dataHooks/useUserShareCasePoliciesQuery';
import { useCaseTypeOptionsQuery } from '../../dataHooks/useCaseTypesQuery';
import type { UserEffectiveRight } from '../../models/caseAccess';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';


type FormFields = {
  caseTypeId: string;
  dataCollectionId: string;
  fromDataCollectionId: string;
};

type Result = {
  add_case: boolean;
  add_case_set: boolean;
  has_share_case_rights?: boolean;
  read_case_set: boolean;
  read_col_ids: string[];
  remove_case: boolean;
  remove_case_set: boolean;
  write_case_set: boolean;
  write_col_ids: string[];
};

export const UserEffectiveRightsTesterAdminPage = () => {
  const { t } = useTranslation();
  const formId = useId();

  const { userId } = useParams();

  const userQuery = useItemQuery<CaseDbUser>({
    baseQueryKey: COMMON_QUERY_KEY.USERS,
    itemId: userId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        const response = await CaseDbOrganizationApi.getInstance().usersGetOne(userId, { signal });
        return response.data;
      },
    },
  });

  const colSetMembersQuery = useColSetMembersQuery();
  const caseTypeOptionsQuery = useCaseTypeOptionsQuery();
  const organizationMapQuery = useOrganizationMapQuery();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === userQuery.data?.organization_id));
  const organizationShareCasePoliciesQuery = useOrganizationShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.organization_id === userQuery.data?.organization_id));
  const userAccessCasePoliciesQuery = useUserAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === userQuery.data?.id));
  const userShareCasePoliciesQuery = useUserShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active && policy.user_id === userQuery.data?.id));

  const loadables = useArray([
    userQuery,
    colSetMembersQuery,
    caseTypeOptionsQuery,
    caseTypeSetMembersQuery,
    dataCollectionOptionsQuery,
    organizationAccessCasePoliciesQuery,
    organizationShareCasePoliciesQuery,
    userAccessCasePoliciesQuery,
    userShareCasePoliciesQuery,
    organizationMapQuery,
  ]);


  const effectiveRights = useMemo<UserEffectiveRight[]>(() => {
    const { data: organizationAccessCasePolicies } = organizationAccessCasePoliciesQuery;
    const { data: organizationShareCasePolicies } = organizationShareCasePoliciesQuery;
    const { data: userAccessCasePolicies } = userAccessCasePoliciesQuery;
    const { data: userShareCasePolicies } = userShareCasePoliciesQuery;
    const { data: caseTypeSetMembers } = caseTypeSetMembersQuery;
    const { data: colSetMembers } = colSetMembersQuery;

    return EffectiveRightsUtil.assembleUserEffectiveRights({
      caseTypeSetMembers,
      colSetMembers,
      organizationAccessCasePolicies,
      organizationShareCasePolicies,
      user: userQuery.data,
      userAccessCasePolicies,
      userShareCasePolicies,
    });

  }, [colSetMembersQuery, caseTypeSetMembersQuery, organizationAccessCasePoliciesQuery, organizationShareCasePoliciesQuery, userAccessCasePoliciesQuery, userQuery.data, userShareCasePoliciesQuery]);

  const schema = useMemo(() => object<FormFields>().shape({
    caseTypeId: string().uuid4().required(),
    dataCollectionId: string().uuid4().required(),
    fromDataCollectionId: string().uuid4().nullable().notRequired(),
  }), []);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<FormFields>,
    values: {
      caseTypeId: null,
      dataCollectionId: null,
      fromDataCollectionId: null,
    },
  });
  const { control, handleSubmit } = formMethods;
  const formValues = useWatch({ control });

  const result = useMemo<Result>(() => {
    if (!formValues.caseTypeId || !formValues.dataCollectionId) {
      return null;
    }
    const effectiveRight = effectiveRights.find(right => {
      return right.data_collection_id === formValues.dataCollectionId && right.categorized_case_type_ids.some(x => x === formValues.caseTypeId);
    });

    const shareCaseRight = formValues.fromDataCollectionId && effectiveRight?.effective_share_case_rights?.find(shareRight => {
      return shareRight.categorized_case_type_ids.some(x => x === formValues.caseTypeId) && shareRight.from_data_collection_id === formValues.fromDataCollectionId;
    });

    return {
      add_case: effectiveRight?.add_case || shareCaseRight?.add_case,
      add_case_set: effectiveRight?.add_case_set || shareCaseRight?.add_case_set,
      has_share_case_rights: effectiveRight?.effective_share_case_rights.length > 0,
      read_case_set: effectiveRight?.read_case_set,
      read_col_ids: effectiveRight?.categorized_read_col_ids,
      remove_case: effectiveRight?.remove_case || shareCaseRight?.remove_case,
      remove_case_set: effectiveRight?.remove_case_set || shareCaseRight?.remove_case_set,
      write_case_set: effectiveRight?.write_case_set,
      write_col_ids: effectiveRight?.categorized_write_col_ids,
    } satisfies Result;
  }, [effectiveRights, formValues.caseTypeId, formValues.dataCollectionId, formValues.fromDataCollectionId]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Case type`,
        loading: caseTypeOptionsQuery.isLoading,
        name: 'caseTypeId',
        options: caseTypeOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'dataCollectionId',
        options: dataCollectionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        disabled: !result?.has_share_case_rights,
        label: t`From data collection`,
        loading: dataCollectionOptionsQuery.isLoading,
        name: 'fromDataCollectionId',
        options: dataCollectionOptionsQuery.options,
      } as const satisfies FormFieldDefinition<FormFields>,
    ] as const;
  }, [caseTypeOptionsQuery.isLoading, caseTypeOptionsQuery.options, dataCollectionOptionsQuery.isLoading, dataCollectionOptionsQuery.options, result?.has_share_case_rights, t]);


  return (
    <PageContainer
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('UserEffectiveRightsTesterAdminPage')}
      title={t`Users effective rights`}
    >
      <Box
        sx={{
          height: '100%',
          position: 'relative',
        }}
      >
        <ResponseHandler
          inlineSpinner
          loadables={loadables}
        >
          <Container maxWidth={'md'}>
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Typography
                component={'h2'}
                variant={'h4'}
              >
                {t('Testing effective rights for user: {{userEmail}}', { userEmail: userQuery.data?.email })}
              </Typography>
              <Typography>
                {t('Organization: {{organizationName}}', { organizationName: organizationMapQuery.map.get(userQuery.data?.organization_id)?.name })}
              </Typography>
              <Typography>
                {t('Roles: {{roles}}', { roles: userQuery.data?.roles.join(', ') })}
              </Typography>
            </Box>
            <GenericForm<FormFields>
              formFieldDefinitions={formFieldDefinitions}
              formId={formId}
              formMethods={formMethods}
              onSubmit={handleSubmit(noop)}
              schema={schema}
            />
            {result !== null && typeof result === 'object' && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                <Typography variant={'h6'}>
                  {t('Effective rights result:')}
                </Typography>
                {!formValues.fromDataCollectionId && result.has_share_case_rights && (
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontStyle: 'italic',
                      }}
                    >
                      {t`Note: The user has share case rights that may affect the result when a 'From data collection' is selected.`}
                    </Typography>
                  </Box>
                )}
                <Typography>
                  {t('Add case: {{addCase}}', { addCase: result?.add_case ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Remove case: {{removeCase}}', { removeCase: result?.remove_case ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Add case set: {{addCaseSet}}', { addCaseSet: result?.add_case_set ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Remove case set: {{removeCaseSet}}', { removeCaseSet: result?.remove_case_set ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Read case set: {{readCaseSet}}', { readCaseSet: result?.read_case_set ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Write case set: {{writeCaseSet}}', { writeCaseSet: result?.write_case_set ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Read case properties: {{readSomeProperties}}', { readSomeProperties: result?.read_col_ids?.length > 0 ? t`Yes` : t`No` })}
                </Typography>
                <Typography>
                  {t('Write case properties: {{writeSomeProperties}}', { writeSomeProperties: result?.write_col_ids?.length > 0 ? t`Yes` : t`No` })}
                </Typography>

              </Box>
            )}
          </Container>
        </ResponseHandler>
      </Box>
    </PageContainer>
  );
};
