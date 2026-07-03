import { t } from 'i18next';
import {
  Box,
  Link,
} from '@mui/material';
import { useCallback } from 'react';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { RouterService } from '@gen-epix/ui';

import { CaseSetUtil } from '../../../utils/CaseSetUtil';

export type AddCasesToEventDialogSuccessNotificationMessageProps = {
  readonly caseSet: CaseDbCaseSet;
  readonly numAddedCases: number;
};

export const AddCasesToEventDialogSuccessNotificationMessage = ({ caseSet, numAddedCases }: AddCasesToEventDialogSuccessNotificationMessageProps) => {

  const onLinkClick = useCallback(async () => {
    await RouterService.getInstance().router.navigate({ pathname: CaseSetUtil.createCaseSetLink(caseSet) });
  }, [caseSet]);

  return (
    <Box>
      <Box>
        {t('Successfully added {{numAddedCases}} case(s) to event: {{name}}', { name: caseSet.name, numAddedCases })}
      </Box>
      <Box
        sx={{
          marginY: 2,
        }}
      >
        <Link
          href={'#'}
          onClick={onLinkClick}
        >
          {t('View event: {{name}}', { name: caseSet.name })}
        </Link>
      </Box>
    </Box>
  );
};
