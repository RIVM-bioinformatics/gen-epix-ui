import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import {
  FormUtil,
  GenericForm,
  useOrganizationsQuery,
} from '@gen-epix/ui';

import { CaseUtil } from '../../../utils/CaseUtil';

export type EpiCaseContentFormProps = {
  readonly caseContent: CaseDbCase['content'];
  readonly completeCaseType: CaseDbCompleteCaseType;
  readonly enabledColIds: string[];
  readonly formId: string;
  readonly onSubmit: (content: CaseDbCase['content']) => void;
};

export const EpiCaseContentForm = ({ caseContent, completeCaseType, enabledColIds, formId, onSubmit }: EpiCaseContentFormProps) => {
  const organizationsQuery = useOrganizationsQuery();
  const schema = useMemo(() => CaseUtil.createYupSchema(completeCaseType), [completeCaseType]);

  const formMethods = useForm<CaseDbCase['content']>({ resolver: yupResolver(schema) });
  const { handleSubmit, reset, setValue } = formMethods;

  const onClearGroupFields = useCallback((fieldNames: string[]) => {
    fieldNames.forEach(name => {
      setValue(name, null);
    });
  }, [setValue]);

  const { fieldDefinitions, groupDefinitions } = useMemo(
    () => CaseUtil.createFormDefinitions(completeCaseType, organizationsQuery, onClearGroupFields, enabledColIds),
    [completeCaseType, organizationsQuery, onClearGroupFields, enabledColIds],
  );


  const onFormSubmit = useCallback((content: { [key: string]: string }) => {
    onSubmit(FormUtil.createStringValuesFromFormValues(fieldDefinitions, content));
  }, [fieldDefinitions, onSubmit]);
  const values = useMemo<CaseDbCase['content']>(() => FormUtil.createFormValues(fieldDefinitions, caseContent), [fieldDefinitions, caseContent]);

  useEffect(() => {
    reset(values);
  }, [reset, values]);

  return (
    <GenericForm<CaseDbCase['content']>
      formFieldDefinitions={fieldDefinitions}
      formGroupDefinitions={groupDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={handleSubmit(onFormSubmit)}
      schema={schema}
    />
  );
};
