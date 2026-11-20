import { renderComponent as renderCoreComponent } from '@gen-epix/ui-core-components/test/lib';
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

export const renderComponent = async <TFields extends FieldValues,>(
  ui: ReactNode,
  { form, wrapper: Wrapper, ...options }: { form?: UseFormProps<TFields> } & NonNullable<Parameters<typeof renderCoreComponent>[1]> = {},
) => {
  const TestForm = ({ children }: PropsWithChildren) => {
    const methods = useForm<TFields>(form);
    return (
      <FormProvider {...methods}>
        {Wrapper ? (
          <Wrapper>
            {children}
          </Wrapper>
        ) : children}
      </FormProvider>
    );
  };
  return renderCoreComponent(ui, { ...options, wrapper: TestForm });
};
