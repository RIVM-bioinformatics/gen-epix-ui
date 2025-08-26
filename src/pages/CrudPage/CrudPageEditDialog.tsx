import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import type {
  ObjectSchema,
  AnyObject,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { GenericForm } from '../../components/form/helpers/GenericForm';
import type { DialogAction } from '../../components/ui/Dialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import type { GenericData } from '../../models/data';
import type { FormFieldDefinition } from '../../models/form';
import { FormUtil } from '../../utils/FormUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';


export interface CrudPageEditDialogOpenProps<TData extends GenericData> {
  readonly item?: TData;
  readonly extraActionsFactory?: (item: TData) => DialogAction[];
  readonly canSave: boolean;
}
export interface CrudPageEditDialogProps<TData extends GenericData, TFormFields extends AnyObject> extends WithDialogRenderProps<CrudPageEditDialogOpenProps<TData>> {
  readonly onSave: (formValues: TFormFields, item: TData) => void;
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[];
  readonly getName: (item: TData | TFormFields) => string;
  readonly schema: ObjectSchema<TFormFields>;
}
export type CrudPageEditDialogRefMethods<TData extends GenericData, TFormFields extends AnyObject> = WithDialogRefMethods<CrudPageEditDialogProps<TData, TFormFields>, CrudPageEditDialogOpenProps<TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CrudPageEditDialog = withDialog<CrudPageEditDialogProps<any, any>, CrudPageEditDialogOpenProps<any>>(<TData extends GenericData, TFormFields extends AnyObject>(
  {
    onSave,
    onClose,
    openProps,
    onTitleChange,
    onActionsChange,
    formFieldDefinitions,
    schema,
    getName,
  }: CrudPageEditDialogProps<TData, TFormFields>,
): ReactElement => {
  const [t] = useTranslation();
  const formId = useId();

  useEffect(() => {
    const actions: DialogAction[] = [];
    if (openProps.extraActionsFactory) {
      actions.push(...openProps.extraActionsFactory(openProps.item));
    }
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageEditDialog-saveButton'),
      color: 'secondary',
      autoFocus: true,
      variant: 'contained',
      form: formId,
      type: 'submit',
      label: t`Save`,
      startIcon: <SaveIcon />,
      disabled: !openProps.canSave || formFieldDefinitions.some(def => def.loading),
    });
    onActionsChange(actions);
  }, [onActionsChange, formId, t, formFieldDefinitions, openProps]);

  useEffect(() => {
    if (openProps.item) {
      onTitleChange(`Edit item: ${getName(openProps.item)}`);
    } else {
      onTitleChange(t`Create new item`);
    }
  }, [getName, onTitleChange, openProps, t]);

  const values = useMemo<TFormFields>(() => FormUtil.createFormValues(formFieldDefinitions, openProps.item), [formFieldDefinitions, openProps.item]);

  const formMethods = useForm<TFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<TFormFields>,
    values,
  });
  const { handleSubmit, formState } = formMethods;

  if (formState.errors && Object.keys(formState.errors).length > 0) {
    console.table(formState.errors);
  }

  const onFormSubmit = useCallback((formFields: TFormFields): void => {
    onSave(formFields, openProps.item);
    onClose();
  }, [onClose, onSave, openProps.item]);

  return (
    <GenericForm<TFormFields>
      formFieldDefinitions={formFieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={openProps.canSave ? handleSubmit(onFormSubmit) : undefined}
    />
  );
}, {
  testId: 'CrudPageEditDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
