import { t } from 'i18next';
import {
  Box,
  Link,
} from '@mui/material';
import { useCallback } from 'react';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';

import { RouterManager } from '../../../classes/managers/RouterManager';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';

export type EpiAddCasesToEventDialogSuccessNotificationMessageProps = {
  readonly caseSet: CaseDbCaseSet;
  readonly numAddedCases: number;
};

export const EpiAddCasesToEventDialogSuccessNotificationMessage = ({ caseSet, numAddedCases }: EpiAddCasesToEventDialogSuccessNotificationMessageProps) => {

  const onLinkClick = useCallback(async () => {
    await RouterManager.instance.router.navigate({ pathname: CaseSetUtil.createCaseSetLink(caseSet) });
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
