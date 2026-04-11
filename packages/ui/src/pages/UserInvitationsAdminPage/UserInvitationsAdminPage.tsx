import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  array,
  object,
  string,
} from 'yup';
import {
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import PasswordIcon from '@mui/icons-material/Password';

import type { UserInvitation } from '../../api';
import {
  CommandName,
  OrganizationApi,
} from '../../api';
import { useOrganizationAdminPolicyMapQuery } from '../../dataHooks/useOrganizationAdminPoliciesQuery';
import { useOrganizationOptionsQuery } from '../../dataHooks/useOrganizationsQuery';
import { useUserOptionsQuery } from '../../dataHooks/useUsersQuery';
import { useArray } from '../../hooks/useArray';
import type {
  FormFieldDefinition,
  OptionBase,
} from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import type {
  TableColumn,
  TableRowParams,
} from '../../models/table';
import { TableUtil } from '../../utils/TableUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { CrudPage } from '../CrudPage';
import { useInviteUserConstraintsQuery } from '../../dataHooks/useInviteUserConstraintsQuery';
import type { OmitWithMetaData } from '../../models/data';
import { SchemaUtil } from '../../utils/SchemaUtil';

import { UserInvitationShareDialog } from './UserInvitationShareDialog';
import type { UserInvitationShareDialogRefMethods } from './UserInvitationShareDialog';
import {
  UserInvitationConsumeDialog,
  type UserInvitationConsumeDialogRefMethods,
} from './UserInvitationConsumeDialog';

type FormFields = OmitWithMetaData<UserInvitation, 'email' | 'expires_at' | 'invited_by_user_id' | 'invited_by_user' | 'name' | 'organization' | 'token'>;

export const UserInvitationsAdminPage = () => {
  const { t } = useTranslation();
  const organizationOptionsQuery = useOrganizationOptionsQuery();
  const inviteUserConstraintsQuery = useInviteUserConstraintsQuery();
  const userOptionsQuery = useUserOptionsQuery();
  const organizationAdminPolicyMapQuery = useOrganizationAdminPolicyMapQuery();

  const organizationOptions = useMemo<OptionBase<string>[]>(() => {
    if (!organizationOptionsQuery?.options?.length || !inviteUserConstraintsQuery?.data) {
      return [];
    }
    return organizationOptionsQuery.options.filter(option => inviteUserConstraintsQuery.data.organization_ids.includes(option.value));

  }, [organizationOptionsQuery.options, inviteUserConstraintsQuery.data]);

  const roleOptions = useMemo<OptionBase<string>[]>(() => {
    if (!inviteUserConstraintsQuery?.data) {
      return [];
    }
    return inviteUserConstraintsQuery.data.roles.map(role => ({
      label: `ROLE_${role}`,
      value: role,
    }));
  }, [inviteUserConstraintsQuery.data]);

  const loadables = useArray([inviteUserConstraintsQuery, organizationOptionsQuery, userOptionsQuery, organizationAdminPolicyMapQuery]);

  const userInvitationShareDialogRef = useRef<UserInvitationShareDialogRefMethods>(null);
  const userInvitationConsumeDialogRef = useRef<UserInvitationConsumeDialogRefMethods>(null);

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    return (await OrganizationApi.instance.userInvitationsGetAll({ signal }))?.data;
  }, []);

  const deleteOne = useCallback(async (item: UserInvitation) => {
    return await OrganizationApi.instance.userInvitationsDeleteOne(item.id);
  }, []);

  const createOne = useCallback(async (variables: FormFields) => {
    return (await OrganizationApi.instance.inviteUser({
      ...variables,
    })).data;
  }, []);

  const getName = useCallback((item: FormFields) => {
    return item.key;
  }, []);

  const schema = useMemo(() => {
    return object<FormFields>().shape({
      description: SchemaUtil.description,
      key: string().max(100).transform((value) => value === '' ? undefined : value as string),
      organization_id: string().uuid4().required().max(100),
      roles: array().min(1).required(),
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/require-await
  const onCreateSuccess = useCallback(async (item: UserInvitation) => {
    userInvitationShareDialogRef.current.open({ item });
  }, []);

  const customOnRowClick = useCallback((params: TableRowParams<UserInvitation>) => {
    userInvitationShareDialogRef.current.open({ item: params.row });
  }, []);


  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => {
    const fields: FormFieldDefinition<FormFields>[] = [];

    fields.push(
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Key`,
        name: 'key',
        warningMessage: t`If known, fill in the user's key. This is typically the user's email address, but can be any string depending on the Identity Provider. Filling in a key makes the invitation more secure. If left empty, the invitation can be consumed by anyone with the invite link.`,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Organization`,
        loading: organizationOptionsQuery.isLoading,
        name: 'organization_id',
        options: organizationOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Roles`,
        loading: inviteUserConstraintsQuery.isLoading,
        multiple: true,
        name: 'roles',
        options: roleOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: t`Description`,
        name: 'description',
      } as const satisfies FormFieldDefinition<FormFields>,
    );
    return fields;
  }, [t, organizationOptions, organizationOptionsQuery.isLoading, roleOptions, inviteUserConstraintsQuery.isLoading]);

  const extraActionsFactory = useCallback((params: TableRowParams<UserInvitation>) => {
    return [
      (
        <MenuItem
          key={'custom-action-1'}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={() => userInvitationShareDialogRef.current.open({ item: params.row })}
        >
          <ListItemIcon>
            <MailIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Send invitation`}
          </ListItemText>
        </MenuItem>
      ),
      (
        <MenuItem
          key={'custom-action-2'}
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={() => userInvitationConsumeDialogRef.current.open({ item: params.row })}
        >
          <ListItemIcon>
            <PasswordIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Consume invitation (advanced)`}
          </ListItemText>
        </MenuItem>
      ),
    ];
  }, [t]);

  const tableColumns = useMemo((): TableColumn<UserInvitation>[] => {
    return [
      TableUtil.createTextColumn<UserInvitation>({ id: 'key', name: t`Key` }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'organization_id', name: t`Organization`, options: organizationOptions }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'invited_by_user_id', name: t`Invited by user`, options: userOptionsQuery.options }),
      TableUtil.createOptionsColumn<UserInvitation>({ id: 'roles', name: t`Roles`, options: roleOptions }),
      TableUtil.createTextColumn<UserInvitation>({ id: 'description', name: t`Description` }),
      TableUtil.createDateColumn<UserInvitation>({ id: 'expires_at', name: t`Expires` }),
    ];
  }, [t, organizationOptions, userOptionsQuery.options, roleOptions]);

  return (
    <>
      <CrudPage<FormFields, UserInvitation>
        createItemButtonText={t`Invite user`}
        createItemDialogTitle={t`Create new user invitation`}
        createOne={createOne}
        crudCommandType={CommandName.UserInvitationCrudCommand}
        customOnRowClick={customOnRowClick}
        defaultSortByField={'key'}
        defaultSortDirection={'asc'}
        deleteOne={deleteOne}
        extraActionsFactory={extraActionsFactory}
        fetchAll={fetchAll}
        formFieldDefinitions={formFieldDefinitions}
        getName={getName}
        loadables={loadables}
        onCreateSuccess={onCreateSuccess}
        resourceQueryKeyBase={QUERY_KEY.USER_INVITATIONS}
        schema={schema}
        tableColumns={tableColumns}
        testIdAttributes={TestIdUtil.createAttributes('UserInvitationsAdminPage')}
        title={t`User invitations`}
      />
      <UserInvitationShareDialog ref={userInvitationShareDialogRef} />
      <UserInvitationConsumeDialog ref={userInvitationConsumeDialogRef} />
    </>
  );
};
