import { Link } from '@mui/material';
import {
  useCallback,
  useRef,
} from 'react';
import { t } from 'i18next';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import type { ConfirmationRefMethods } from '@gen-epix/ui';
import {
  Confirmation,
  ResponseHandler,
  RouterManager,
  useArray,
} from '@gen-epix/ui';

import { useCaseSetCategoryMapQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusMapQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';


export type EpiCasesAlreadyInCaseSetWarningCaseSetLinkProps = {
  readonly caseSet: CaseDbCaseSet;
};

export const EpiCasesAlreadyInCaseSetWarningCaseSetLink = ({ caseSet }: EpiCasesAlreadyInCaseSetWarningCaseSetLinkProps) => {
  const caseSetCategoryMapQuery = useCaseSetCategoryMapQuery();
  const caseSetStatusMapQuery = useCaseSetStatusMapQuery();
  const loadables = useArray([caseSetCategoryMapQuery, caseSetStatusMapQuery]);
  const confirmationRef = useRef<ConfirmationRefMethods>(null);

  const onLinkClick = useCallback(() => {
    confirmationRef.current?.open();
  }, []);

  const onConfirm = useCallback(async () => {
    await RouterManager.getInstance().router.navigate(CaseSetUtil.createCaseSetLink(caseSet));
  }, [caseSet]);


  return (
    <ResponseHandler
      loadables={loadables}
      shouldHideActionButtons
    >
      <Link
        color={'primary'}
        href={'#'}
        onClick={onLinkClick}
        sx={{
          display: 'table',
        }}
      >
        {`${caseSet.name} (${caseSetCategoryMapQuery.map.get(caseSet.case_set_category_id)?.name}, ${caseSetStatusMapQuery.map.get(caseSet.case_set_status_id)?.name})`}
      </Link>
      <Confirmation
        body={t('This will navigate to the "{{caseSetName}}"-event. You will loose your current selection of cases and all applied filters. Do you want to continue?', { caseSetName: caseSet.name })}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Continue`}
        onConfirm={onConfirm}
        ref={confirmationRef}
        title={t('Do you want to navigate to the "{{caseSetName}}"-event?', { caseSetName: caseSet.name })}
      />
    </ResponseHandler>
  );
};
