import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import type {
  FieldValues,
  UseFormProps,
} from 'react-hook-form';

import { renderComponent } from './render';

// Form fields read their control from a react-hook-form context, so they need a FormProvider around them.
export const renderFormComponent = async <TFields extends FieldValues,>(
  ui: ReactNode,
  { form, ...options }: { form?: UseFormProps<TFields> } & Parameters<typeof renderComponent>[1] = {},
) => {
  const TestForm = ({ children }: PropsWithChildren) => {
    const methods = useForm<TFields>(form);
    return (
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    );
  };
  return renderComponent(ui, { ...options, wrapper: TestForm });
};
