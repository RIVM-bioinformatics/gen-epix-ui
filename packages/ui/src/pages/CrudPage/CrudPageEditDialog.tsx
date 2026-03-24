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
import type {
  Resolver,
  UseFormReturn,
} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

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
  readonly onChange?: (item: TData, formValues: TFormFields, formMethods: UseFormReturn<TFormFields>) => void;
  readonly formFieldDefinitions: FormFieldDefinition<TFormFields>[] | ((item: TData, values?: TFormFields) => FormFieldDefinition<TFormFields>[]);
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
    onChange,
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

  const values = useMemo<TFormFields>(() => {
    return { ...defaultNewItem, ...FormUtil.createFormValues(resolvedFormFieldDefinitions, { ...defaultNewItem, ...openProps.item }) };
  }, [resolvedFormFieldDefinitions, openProps.item, defaultNewItem]);

  useEffect(() => {
    if (openProps.item) {
      onTitleChange(`Edit item: ${getName({ ...defaultNewItem as TFormFields, ...openProps.item ?? {} })}`);
    } else {
      onTitleChange(createItemDialogTitle ?? t`Create new item`);
    }
  }, [getName, onTitleChange, openProps, t, createItemDialogTitle, defaultNewItem]);


  const formMethods = useForm<TFormFields>({
    resolver: yupResolver(schema) as Resolver<TFormFields>,
    values,
  });
  const { handleSubmit, formState, subscribe } = formMethods;

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
      formState: {
        values: true,
      },
      callback: ({ values: formValues }) => {
        debouncedHandleValuesChange(formValues);
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
      schema={schema}
      disableAll={!openProps.canSave}
      formFieldDefinitions={resolvedFormFieldDefinitions}
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
