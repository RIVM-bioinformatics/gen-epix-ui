import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import type {
  ObjectSchema,
  AnyObject,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';

import { GenericForm } from '../../components/form/helpers/GenericForm';
import type { DialogAction } from '../../components/ui/Dialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import type { GenericData } from '../../models/data';
import { FormUtil } from '../../utils/FormUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { FormFieldDefinition } from '../../models/form';


export interface CrudPageEditDialogOpenProps<TData extends GenericData> {
  readonly item?: TData;
  readonly extraActionsFactory?: (item: TData) => DialogAction[];
  readonly canSave: boolean;
}
export interface CrudPageEditDialogProps<TData extends GenericData, TFormFields extends AnyObject> extends WithDialogRenderProps<CrudPageEditDialogOpenProps<TData>> {
  readonly onSave: (formValues: TFormFields, item: TData) => void;
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[] | ((values: TFormFields, item: TData) => Promise<FormFieldDefinition<TFormFields>[]>);
  readonly getName: (item: TData | TFormFields) => string;
  readonly createItemDialogTitle?: string;
  readonly defaultNewItem?: Partial<TFormFields>;
  readonly schema: ObjectSchema<TFormFields, TFormFields>;
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
    createItemDialogTitle,
    defaultNewItem,
  }: CrudPageEditDialogProps<TData, TFormFields>,
): ReactElement => {
  const [t] = useTranslation();
  const formId = useId();

  const formFieldDefinitionsWithItem = useCallback(async (values: TFormFields): Promise<FormFieldDefinition<TFormFields>[]> => {
    if (typeof formFieldDefinitions === 'function') {
      return await formFieldDefinitions(values, openProps.item);
    }
    return formFieldDefinitions;
  }, [formFieldDefinitions, openProps.item]);

  const [resolvedFormFieldDefinitions, setResolvedFormFieldDefinitions] = useState<FormFieldDefinition<TFormFields>[]>(typeof formFieldDefinitions === 'function' ? [] : formFieldDefinitions);

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
      disabled: !openProps.canSave || resolvedFormFieldDefinitions.some(def => def.loading),
    });
    onActionsChange(actions);
  }, [onActionsChange, formId, t, resolvedFormFieldDefinitions, openProps]);

  useEffect(() => {
    if (openProps.item) {
      onTitleChange(`Edit item: ${getName(openProps.item ?? defaultNewItem as TFormFields)}`);
    } else {
      onTitleChange(createItemDialogTitle ?? t`Create new item`);
    }
  }, [getName, onTitleChange, openProps, t, createItemDialogTitle, defaultNewItem]);

  const values = useMemo<TFormFields>(() => {
    return FormUtil.createFormValues(resolvedFormFieldDefinitions, openProps.item ?? defaultNewItem as TFormFields);
  }, [resolvedFormFieldDefinitions, openProps.item, defaultNewItem]);

  const formMethods = useForm<TFormFields>({
    resolver: yupResolver(schema) as unknown as Resolver<TFormFields>,
    values,
  });
  const { handleSubmit, formState, control } = formMethods;

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (typeof formFieldDefinitions !== 'function') {
      setResolvedFormFieldDefinitions(formFieldDefinitions);
      return;
    }
    const perform = async () => {
      setResolvedFormFieldDefinitions(await formFieldDefinitions(watchedValues as TFormFields, openProps.item));
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();

  }, [formFieldDefinitions, watchedValues, openProps.item]);

  if (formState.errors && Object.keys(formState.errors).length > 0) {
    console.table(formState.errors);
  }

  const onFormSubmit = useCallback((formFields: TFormFields): void => {
    onSave(formFields, openProps.item);
    onClose();
  }, [onClose, onSave, openProps.item]);

  return (
    <GenericForm<TFormFields>
      schema={schema}
      disableAll={!openProps.canSave}
      formFieldDefinitions={formFieldDefinitionsWithItem}
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
