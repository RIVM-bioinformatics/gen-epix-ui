import { Link } from '@mui/material';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { t } from 'i18next';

import type { CaseSet } from '../../../api';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { useCaseSetCategoryMap } from '../../../dataHooks/useCaseSetCategories';
import { useCaseSetStatusMap } from '../../../dataHooks/useCaseSetStatuses';
import { EpiCaseSetUtil } from '../../../utils/EpiCaseSetUtil';
import type { ConfirmationRefMethods } from '../../ui/Confirmation';
import { Confirmation } from '../../ui/Confirmation';
import { ResponseHandler } from '../../ui/ResponseHandler';

export type EpiCasesAlreadyInCaseSetWarningCaseSetLinkProps = {
  readonly caseSet: CaseSet;
};

export const EpiCasesAlreadyInCaseSetWarningCaseSetLink = ({ caseSet }: EpiCasesAlreadyInCaseSetWarningCaseSetLinkProps) => {
  const caseSetCategoryMap = useCaseSetCategoryMap();
  const caseSetStatusMap = useCaseSetStatusMap();
  const loadables = useMemo(() => [caseSetCategoryMap, caseSetStatusMap], [caseSetCategoryMap, caseSetStatusMap]);
  const confirmationRef = useRef<ConfirmationRefMethods>(null);

  const onLinkClick = useCallback(() => {
    confirmationRef.current?.open();
  }, []);

  const onConfirm = useCallback(async () => {
    await RouterManager.instance.router.navigate(EpiCaseSetUtil.createCaseSetLink(caseSet));
  }, [caseSet]);


  return (
    <ResponseHandler
      loadables={loadables}
      shouldHideActionButtons
    >
      <Link
        color={'primary'}
        href="#"
        onClick={onLinkClick}
        sx={{
          display: 'table',
        }}
      >
        {`${caseSet.name} (${caseSetCategoryMap.map.get(caseSet.case_set_category_id)?.name}, ${caseSetStatusMap.map.get(caseSet.case_set_status_id)?.name})`}
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
