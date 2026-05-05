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
  AnyObject,
  ObjectSchema,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type {
  Resolver,
  UseFormReturn,
} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

import { GenericForm } from '../../components/form/helpers/GenericForm';
import type { DialogAction } from '../../components/ui/Dialog';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import type { GenericData } from '../../models/data';
import { FormUtil } from '../../utils/FormUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { FormFieldDefinition } from '../../models/form';


export interface CrudPageEditDialogOpenProps<TData extends GenericData> {
  readonly canSave: boolean;
  readonly extraActionsFactory?: (item: TData) => DialogAction[];
  readonly item?: TData;
}
export interface CrudPageEditDialogProps<TData extends GenericData, TFormFields extends AnyObject> extends WithDialogRenderProps<CrudPageEditDialogOpenProps<TData>> {
  readonly createItemDialogTitle?: string;
  readonly defaultNewItem?: Partial<TFormFields>;
  readonly formFieldDefinitions: ((item: TData, values?: TFormFields) => FormFieldDefinition<TFormFields>[]) | FormFieldDefinition<TFormFields>[];
  readonly getFormValuesFromItem?: (item: TData) => Partial<TFormFields>;
  readonly getName: (item: TData | TFormFields) => string;
  readonly onChange?: (item: TData, formValues: TFormFields, formMethods: UseFormReturn<TFormFields>) => void;
  readonly onSave: (formValues: TFormFields, item: TData) => void;
  readonly schema: ObjectSchema<TFormFields, TFormFields>;
}
export type CrudPageEditDialogRefMethods<TData extends GenericData, TFormFields extends AnyObject> = WithDialogRefMethods<CrudPageEditDialogProps<TData, TFormFields>, CrudPageEditDialogOpenProps<TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CrudPageEditDialog = withDialog<CrudPageEditDialogProps<any, any>, CrudPageEditDialogOpenProps<any>>(<TData extends GenericData, TFormFields extends AnyObject>(
  {
    createItemDialogTitle,
    defaultNewItem,
    formFieldDefinitions,
    getFormValuesFromItem,
    getName,
    onActionsChange,
    onChange,
    onClose,
    onSave,
    onTitleChange,
    openProps,
    schema,
  }: CrudPageEditDialogProps<TData, TFormFields>,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();

  const initialFormFieldDefinitions = useMemo(() => {
    return typeof formFieldDefinitions === 'function' ? formFieldDefinitions(openProps.item) : formFieldDefinitions;
  }, [formFieldDefinitions, openProps.item]);

  const [resolvedFormFieldDefinitions, setResolvedFormFieldDefinitions] = useState<FormFieldDefinition<TFormFields>[]>(initialFormFieldDefinitions);

  useEffect(() => {
    const actions: DialogAction[] = [];
    if (openProps.extraActionsFactory) {
      actions.push(...openProps.extraActionsFactory(openProps.item));
    }
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageEditDialog-saveButton'),
      autoFocus: true,
      color: 'secondary',
      disabled: !openProps.canSave || resolvedFormFieldDefinitions.some(def => def.loading),
      form: formId,
      label: t`Save`,
      startIcon: <SaveIcon />,
      type: 'submit',
      variant: 'contained',
    });
    onActionsChange(actions);
  }, [onActionsChange, formId, t, resolvedFormFieldDefinitions, openProps]);

  const values = useMemo<TFormFields>(() => {
    return { ...defaultNewItem, ...FormUtil.createFormValues(resolvedFormFieldDefinitions, { ...defaultNewItem, ...(getFormValuesFromItem ? getFormValuesFromItem(openProps.item) : (openProps.item ?? {})) }) };
  }, [defaultNewItem, resolvedFormFieldDefinitions, getFormValuesFromItem, openProps.item]);

  useEffect(() => {
    if (openProps.item) {
      onTitleChange(`Edit item: ${getName({ ...defaultNewItem as TFormFields, ...(getFormValuesFromItem ? getFormValuesFromItem(openProps.item) : (openProps.item ?? {})) })}`);
    } else {
      onTitleChange(createItemDialogTitle ?? t`Create new item`);
    }
  }, [getName, onTitleChange, openProps, t, createItemDialogTitle, defaultNewItem, getFormValuesFromItem]);


  const formMethods = useForm<TFormFields>({
    resolver: yupResolver(schema) as Resolver<TFormFields>,
    values,
  });
  const { formState, handleSubmit, subscribe } = formMethods;

  const debouncedHandleValuesChange = useDebouncedCallback((formValues: TFormFields) => {
    if (onChange) {
      onChange(openProps.item, formValues, formMethods);
    }

    if (typeof formFieldDefinitions !== 'function') {
      return;
    }
    setResolvedFormFieldDefinitions(formFieldDefinitions(openProps.item, formValues));
  }, 500, {
    leading: false,
    trailing: true,
  });

  useEffect(() => {
    const unsubscribe = subscribe({
      callback: ({ values: formValues }) => {
        debouncedHandleValuesChange(formValues);
      },
      formState: {
        values: true,
      },
    });
    return () => unsubscribe();
  }, [debouncedHandleValuesChange, formFieldDefinitions, subscribe]);

  if (formState.errors && Object.keys(formState.errors).length > 0) {
    console.table(formState.errors);
  }

  const onFormSubmit = useCallback((formFields: TFormFields): void => {
    onSave(formFields, openProps.item);
    onClose();
  }, [onClose, onSave, openProps.item]);

  return (
    <GenericForm<TFormFields>
      disableAll={!openProps.canSave}
      formFieldDefinitions={resolvedFormFieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={openProps.canSave ? handleSubmit(onFormSubmit) : undefined}
      schema={schema}
    />
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'CrudPageEditDialog',
});
