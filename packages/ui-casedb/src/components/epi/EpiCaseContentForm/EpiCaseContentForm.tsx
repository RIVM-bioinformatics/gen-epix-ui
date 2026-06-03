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
} from '@gen-epix/ui';

import { CaseTypeFormUtil } from '../../../utils/CaseTypeFormUtil';

export type EpiCaseContentFormProps = {
  readonly caseContent: CaseDbCase['content'];
  readonly caseId: string;
  readonly completeCaseType: CaseDbCompleteCaseType;
  readonly enabledColIds: string[];
  readonly formId: string;
  readonly onSubmit: (caseId: string, content: CaseDbCase['content']) => void;
};

export const EpiCaseContentForm = ({ caseContent, caseId, completeCaseType, enabledColIds, formId, onSubmit }: EpiCaseContentFormProps) => {
  const schema = useMemo(() => CaseTypeFormUtil.createYupSchema({ completeCaseType }), [completeCaseType]);

  const formMethods = useForm<CaseDbCase['content']>({ resolver: yupResolver(schema) });
  const { handleSubmit, reset, setValue } = formMethods;

  const onClearGroupFields = useCallback((fieldNames: string[]) => {
    fieldNames.forEach(name => {
      setValue(name, null);
    });
  }, [setValue]);

  const { fieldDefinitions, groupDefinitions } = useMemo(() => {
    return CaseTypeFormUtil.createFormDefinitions({ completeCaseType, enabledColIds, onClearGroupFields });
  }, [completeCaseType, onClearGroupFields, enabledColIds]);


  const onFormSubmit = useCallback((content: { [key: string]: string }) => {
    if (caseId) {
      onSubmit(caseId, FormUtil.createStringValuesFromFormValues(fieldDefinitions, content));
    }
  }, [caseId, fieldDefinitions, onSubmit]);
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
