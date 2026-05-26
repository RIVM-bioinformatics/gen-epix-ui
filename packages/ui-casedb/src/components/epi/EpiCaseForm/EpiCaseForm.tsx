import {
  useCallback,
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

export type EpiCaseFormProps = {
  readonly caseContent: CaseDbCase['content'];
  readonly completeCaseType: CaseDbCompleteCaseType;
  readonly formId: string;
  readonly onSubmit: (content: CaseDbCase['content']) => void;
};

export const EpiCaseForm = ({ caseContent, completeCaseType, formId, onSubmit }: EpiCaseFormProps) => {
  const organizationsQuery = useOrganizationsQuery();
  const schema = useMemo(() => CaseUtil.createYupSchema(completeCaseType), [completeCaseType]);
  const formFieldDefinitions = useMemo(() => CaseUtil.createFormFieldDefinitions(completeCaseType, organizationsQuery), [completeCaseType, organizationsQuery]);

  const onFormSubmit = useCallback((content: CaseDbCase['content']) => {
    onSubmit(content);
  }, [onSubmit]);

  const values = useMemo<CaseDbCase['content']>(() => FormUtil.createFormValues(formFieldDefinitions, caseContent), [formFieldDefinitions, caseContent]);
  const formMethods = useForm<CaseDbCase['content']>({
    resolver: yupResolver(schema),
    values,
  });
  const { handleSubmit } = formMethods;

  return (
    <GenericForm<CaseDbCase['content']>
      formFieldDefinitions={formFieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={handleSubmit(onFormSubmit)}
      schema={schema}
    />
  );
};
