import { t } from 'i18next';
import { Box } from '@mui/material';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { NavLink } from '@gen-epix/ui';

import { CaseSetUtil } from '../../../utils/CaseSetUtil';

export type CreateEventDialogSuccessNotificationMessageProps = {
  readonly caseSet: CaseDbCaseSet;
  readonly isCreating?: boolean;
};

export const CreateEventDialogSuccessNotificationMessage = ({ caseSet, isCreating }: CreateEventDialogSuccessNotificationMessageProps) => {
  return (
    <Box>
      <Box>
        {isCreating && t('Successfully created event: {{name}}', { name: caseSet.name })}
        {!isCreating && t('Successfully edited event: {{name}}', { name: caseSet.name })}
      </Box>
      <Box
        sx={{
          marginY: 2,
        }}
      >
        <NavLink
          activeAsText
          to={CaseSetUtil.createCaseSetLink(caseSet)}
        >
          {t('View event: {{name}}', { name: caseSet.name })}
        </NavLink>
      </Box>
    </Box>
  );
};
