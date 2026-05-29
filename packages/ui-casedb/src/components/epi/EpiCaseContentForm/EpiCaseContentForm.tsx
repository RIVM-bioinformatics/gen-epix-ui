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
  readonly formId: string;
  readonly onSubmit: (content: CaseDbCase['content']) => void;
};

export const EpiCaseContentForm = ({ caseContent, completeCaseType, formId, onSubmit }: EpiCaseContentFormProps) => {
  const organizationsQuery = useOrganizationsQuery();
  const schema = useMemo(() => CaseUtil.createYupSchema(completeCaseType), [completeCaseType]);

  const onFormSubmit = useCallback((content: CaseDbCase['content']) => {
    onSubmit(content);
  }, [onSubmit]);

  const formMethods = useForm<CaseDbCase['content']>({ resolver: yupResolver(schema) });
  const { handleSubmit, reset, setValue } = formMethods;

  const onClearGroupFields = useCallback((fieldNames: string[]) => {
    fieldNames.forEach(name => {
      setValue(name, null);
    });
  }, [setValue]);

  const { fieldDefinitions, groupDefinitions } = useMemo(
    () => CaseUtil.createFormDefinitions(completeCaseType, organizationsQuery, onClearGroupFields),
    [completeCaseType, organizationsQuery, onClearGroupFields],
  );

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
